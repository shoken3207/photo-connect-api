const Friend = require('../models/Friend');
const LikePlan = require('../models/LikePlan');
const ParticipationPlan = require('../models/ParticipationPlan');
const Plan = require('../models/Plan');
const PlanBlackList = require('../models/PlanBlackList');
const PlanImage = require('../models/PlanImage');
const PlanTag = require('../models/PlanTag');
const ReactionMessage = require('../models/ReactionMessage');
const Talk = require('../models/Talk');
const ReadMessage = require('../models/ReadMessage');
const TalkRoom = require('../models/TalkRoom');
const TalkRoomMember = require('../models/TalkRoomMember');
const User = require('../models/User');
const { plansCreateResponse } = require('../utils/createResponses');
const { convertToSaveDate } = require('../utils/dateUtils');
const { NO_IMAGE_PATH, NOTIFICATION_TYPE } = require('../const');
const {
  isClosedPlanByDefaultDeadLine,
  isClosedPlanByDeadLine,
} = require('../utils/planUtils');
const Notification = require('../models/Notification');
const InvitationPlan = require('../models/InvitationPlan');

// プランデータの作成
const createPlan = async (req, res) => {
  const {
    title,
    place,
    prefecture,
    date,
    desc,
    limit,
    organizer_id,
    organizer_icon_image,
    images,
    tags,
  } = req.body;
  try {
    const nowDate = new Date();
    const saveDate = convertToSaveDate(nowDate);
    const talkRoom = await TalkRoom.create({
      talk_room_name: title,
      talk_room_icon_image: images[0] || NO_IMAGE_PATH,
      is_group_talk_room: true,
      is_plan_talk_room: true,
      last_message_date: saveDate,
    });
    await TalkRoomMember.create({
      talk_room_id: talkRoom._id,
      member_id: organizer_id,
    });
    const plan = await Plan.create({
      talk_room_id: talkRoom._id,
      title,
      place,
      prefecture,
      date,
      dead_line: '',
      desc,
      limit,
      organizer_id,
      organizer_icon_image,
    });
    await Promise.all(
      images.map((image) => {
        PlanImage.create({ plan_id: plan._id, image });
      })
    );
    await Promise.all(
      tags.map((tag) => {
        PlanTag.create({ plan_id: plan._id, tag_name: tag });
      })
    );
    return res.status(200).json({ message: 'プランの作成に成功しました' });
  } catch (err) {
    return res.status(500).json(err);
  }
};

// プランデータの締め切り
const closePlan = async (req, res) => {
  const { plan_id, user_id } = req.body;

  try {
    const plan = await Plan.findById(plan_id);
    if (!plan)
      return res.status(404).json({ message: 'プランは削除されました。' });

    if (plan.organizer_id !== user_id)
      return res
        .status(404)
        .json({ message: 'プランの創設者以外に締め切ることはできません。' });

    const nowDate = new Date();
    const saveDate = convertToSaveDate(nowDate);
    await plan.updateOne({ dead_line: saveDate });
    return res.status(200).json({ message: '参加者の募集を締め切りました。' });
  } catch (err) {
    return res.status(500).json(err);
  }
};

// プラン募集再開
const resumePlan = async (req, res) => {
  const { plan_id, user_id } = req.body;

  try {
    const plan = await Plan.findById(plan_id);
    if (!plan)
      return res.status(404).json({ message: 'プランは削除されました。' });

    if (plan.organizer_id !== user_id)
      return res.status(404).json({
        message: 'プランの創設者以外に募集を再開することはできません。',
      });

    const participants = await ParticipationPlan.find({
      plan_id,
    });
    if (plan.limit > 0 && plan.limit <= participants.length) {
      return res.status(404).json({
        message: 'プランの参加人数が上限に達しています。',
      });
    }
    if (plan.dead_line !== '' && isClosedPlanByDefaultDeadLine(plan.date))
      return res
        .status(404)
        .json({ message: 'プランの募集期間は、締め切られました。' });

    await plan.updateOne({ dead_line: '' });

    return res.status(200).json({ message: '参加者募集を再開しました。' });
  } catch (err) {
    return res.status(500).json(err);
  }
};

// プランデータの削除
const deletePlan = async (req, res) => {
  const { plan_id, user_id } = req.params;
  try {
    const plan = await Plan.findById(plan_id);
    const participants = await ParticipationPlan.find({ plan_id });
    if (plan.organizer_id !== user_id)
      return res.status(400).json({
        message: '作成者が自分以外のプランデータを削除することはできません。',
      });
    await PlanImage.deleteMany({ plan_id: plan._id });
    await PlanTag.deleteMany({ plan_id: plan._id });
    await LikePlan.deleteMany({ plan_id: plan._id });
    await ParticipationPlan.deleteMany({ plan_id: plan._id });
    await PlanBlackList.deleteMany({ plan_id: plan._id });
    await TalkRoomMember.deleteMany({ talk_room_id: plan.talk_room_id });

    const talkIds = await Talk.find({ talk_room_id: plan.talk_room_id }).then(
      (talks) => talks.map((talk) => talk._id)
    );
    await Promise.all(
      talkIds.map(async (talk_id) => {
        await ReactionMessage.deleteMany({ talk_id });
        await ReadMessage.deleteMany({ talk_id });
      })
    );
    await Talk.deleteMany({ talk_room_id: plan.talk_room_id });
    await TalkRoom.findByIdAndDelete(plan.talk_room_id);
    await plan.deleteOne();
    await Promise.all(
      participants.map(async (participant) => {
        await Notification.create({
          receiver_id: participant.participants_id,
          actor_id: user_id,
          action_type: NOTIFICATION_TYPE.REMOVE_PLAN,
        });
      })
    );
    return res.status(200).json({ message: 'planの削除に成功しました' });
  } catch (err) {
    return res.status(500).json(err);
  }
};

const invitationPlan = async (req, res) => {
  const { invitee_ids, user_id, plan_id } = req.body;
  try {
    // チェック処理
    const plan = await Plan.findById(plan_id);
    if (plan.organizer_id !== user_id)
      return res
        .status(404)
        .json({ message: 'あなたは、プランの作成者ではありません。' });

    const errorMessages = await Promise.all(
      invitee_ids.map(async (invitee_id) => {
        const friend1 = await Friend.findOne({
          user_id,
          friend_id: invitee_id,
        });
        const friend2 = await Friend.findOne({
          user_id: invitee_id,
          friend_id: user_id,
        });
        const friend = await User.findById(invitee_id);
        if (!friend1 || !friend2) {
          return `${friend.username}は、友達から抜けています。`;
        }
        const participant = await ParticipationPlan.findOne({
          plan_id,
          participants_id: invitee_id,
        });
        if (participant) {
          return `${friend.username}は、プランに参加済みです。`;
        }

        const invitation = await InvitationPlan.findOne({
          plan_id,
          invitee_id,
        });
        if (invitation) {
          return `${friend.username}は、プランへ招待済みです。`;
        }
      })
    ).then((messages) => messages.filter((message) => message !== undefined));
    if (errorMessages.length > 0)
      return res.status(404).json({ message: errorMessages[0] });

    // 実行処理
    await Promise.all(
      invitee_ids.map(async (invitee_id) => {
        await InvitationPlan.create({ plan_id, invitee_id });
        await Notification.create({
          receiver_id: invitee_id,
          actor_id: user_id,
          content_id: plan_id,
          action_type: NOTIFICATION_TYPE.INVITATION_PLAN,
        });
      })
    );
    return res
      .status(200)
      .json({ message: 'プランへの招待を友達に通知しました。' });
  } catch (err) {
    return res.status(500).json(err);
  }
};

// プランへの招待取り消し
const cancelInvitationPlan = async (req, res) => {
  const { invitee_ids, user_id, plan_id } = req.body;
  try {
    // チェック処理
    const plan = await Plan.findById(plan_id);
    if (plan.organizer_id !== user_id)
      return res
        .status(404)
        .json({ message: 'あなたは、プランの作成者ではありません。' });

    const errorMessages = await Promise.all(
      invitee_ids.map(async (invitee_id) => {
        const invitation = await InvitationPlan.findOne({
          plan_id,
          invitee_id,
        });
        if (!invitation) {
          const invitee = await User.findById(invitee_id);
          return `${invitee.username}は、プランへ招待されていません。`;
        }
      })
    ).then((messages) => messages.filter((message) => message !== undefined));
    if (errorMessages.length > 0)
      return res.status(404).json({ message: errorMessages[0] });

    // 実行処理
    await Promise.all(
      invitee_ids.map(async (invitee_id) => {
        await InvitationPlan.findOneAndDelete({ plan_id, invitee_id });
        await Notification.findOneAndDelete({
          receiver_id: invitee_id,
          actor_id: user_id,
          content_id: plan_id,
          action_type: NOTIFICATION_TYPE.INVITATION_PLAN,
        });
      })
    );
    return res
      .status(200)
      .json({ message: 'プランへの招待をキャンセルしました。' });
  } catch (err) {
    return res.status(500).json(err);
  }
};

// プランデータ更新
const updatePlan = async (req, res) => {
  const {
    plan_id,
    user_id,
    title,
    place,
    prefecture,
    date,
    desc,
    limit,
    images,
    tags,
  } = req.body;
  try {
    const plan = await Plan.findById(plan_id);
    if (plan.organizer_id !== user_id)
      return res.status(404).json({
        message: '作成者が自分以外のプランデータを編集することはできません。',
      });

    await plan.updateOne({
      $set: {
        title,
        place,
        prefecture,
        date,
        desc,
        limit,
      },
    });

    await PlanImage.deleteMany({ plan_id });
    await Promise.all(
      images.map((image) => {
        PlanImage.create({ plan_id, image });
      })
    );

    await PlanTag.deleteMany({ plan_id });
    await Promise.all(
      tags.map((tag) => {
        PlanTag.create({ plan_id, tag_name: tag });
      })
    );

    const talkRoom = await TalkRoom.findById(plan.talk_room_id);
    await talkRoom.updateOne({
      talk_room_name: title,
      talk_room_icon_image: images[0] || NO_IMAGE_PATH,
    });

    return res
      .status(200)
      .json({ message: 'プランデータの更新に成功しました' });
  } catch (err) {
    return res.status(500).json(err);
  }
};

// プランに参加
const participationPlan = async (req, res) => {
  const { user_id, plan_id } = req.body;
  try {
    const plan = await Plan.findById(plan_id);
    if (!plan)
      return res.status(404).json({ message: 'プランは削除されました。' });
    if (plan.organizer_id === user_id)
      return res
        .status(404)
        .json({ message: '自分で作成したプランに参加することはできません。' });

    if (
      (plan.dead_line === '' && isClosedPlanByDefaultDeadLine(plan.date)) ||
      (plan.dead_line !== '' && isClosedPlanByDeadLine(plan.dead_line))
    )
      return res
        .status(404)
        .json({ message: 'プランの募集期間は、締め切られました。' });

    const participants = await ParticipationPlan.find({
      plan_id,
    });
    if (plan.limit > 0 && plan.limit <= participants.length) {
      return res.status(404).json({
        message: 'プランの参加人数が上限に達しています。',
      });
    }

    const planBlackList = await PlanBlackList.findOne({ plan_id, user_id });
    if (planBlackList)
      return res.status(404).json({
        message: 'プラン創設者から追放されているため、参加できません。',
      });
    const participant = await ParticipationPlan.findOne({
      plan_id,
      participants_id: user_id,
    });

    if (participant) {
      return res.status(404).json({ message: '既にプランに参加しています。' });
    }
    await ParticipationPlan.create({ plan_id, participants_id: user_id });
    await TalkRoomMember.create({
      talk_room_id: plan.talk_room_id,
      member_id: user_id,
    });

    await Notification.create({
      receiver_id: plan.organizer_id,
      actor_id: user_id,
      content_id: plan_id,
      action_type: NOTIFICATION_TYPE.PARTICIPATION_PLAN,
      is_plan_organizer: true,
    });
    await Promise.all(
      participants.map(async (participant) => {
        await Notification.create({
          receiver_id: participant.participants_id,
          actor_id: user_id,
          content_id: plan_id,
          action_type: NOTIFICATION_TYPE.PARTICIPATION_PLAN,
        });
      })
    );

    return res.status(200).json({ message: 'プランの参加に成功しました。' });
  } catch (err) {
    return res.status(500).json(err);
  }
};

// プランから抜ける
const leavePlan = async (req, res) => {
  const { plan_id, user_id } = req.body;
  try {
    const plan = await Plan.findById(plan_id);
    if (!plan)
      return res.status(404).json({ message: 'プランは削除されました。' });
    const participant = await ParticipationPlan.findOne({
      plan_id,
      participants_id: user_id,
    });
    if (!participant) {
      return res.status(404).json({ message: 'プランに参加していません。' });
    }
    await participant.deleteOne();

    const talkRoom = await TalkRoomMember.findOne({
      talk_room_id: plan.talk_room_id,
      member_id: user_id,
    });
    await talkRoom.deleteOne();

    const participants = await ParticipationPlan.find({ plan_id });
    await Notification.create({
      receiver_id: plan.organizer_id,
      actor_id: user_id,
      content_id: plan_id,
      action_type: NOTIFICATION_TYPE.LEAVE_PLAN,
      is_plan_organizer: true,
    });
    await Promise.all(
      participants.map(async (participant) => {
        await Notification.create({
          receiver_id: participant.participants_id,
          actor_id: user_id,
          content_id: plan_id,
          action_type: NOTIFICATION_TYPE.LEAVE_PLAN,
        });
      })
    );
    return res.status(200).json({ message: 'プランから抜けました。' });
  } catch (err) {
    return res.status(500).json(err);
  }
};

// プランから抜けさせる
const exceptPlan = async (req, res) => {
  const { plan_id, user_id, organizer_id } = req.body;
  try {
    const participant = await ParticipationPlan.findOne({
      plan_id,
      participants_id: user_id,
    });
    if (!participant) {
      return res.status(404).json({ message: 'プランから既に抜けています。' });
    }
    const plan = await Plan.findById(plan_id);
    if (plan.organizer_id !== organizer_id)
      return rse.status(404).json({
        message: 'プランの主催者以外は、抜けさせることが出来ません。',
      });
    const planBlackList = await PlanBlackList.findOne({ plan_id, user_id });
    if (planBlackList)
      return res.status(404).json({ message: 'プランから追放済みです。' });
    await participant.deleteOne();
    const talkRoom = await TalkRoomMember.findOne({
      talk_room_id: plan.talk_room_id,
      member_id: user_id,
    });
    await talkRoom.deleteOne();
    await PlanBlackList.create({ plan_id, user_id });

    const participants = await ParticipationPlan.find({ plan_id });
    await Notification.create({
      receiver_id: user_id,
      actor_id: organizer_id,
      content_id: plan_id,
      action_type: NOTIFICATION_TYPE.EXCEPT_PLAN,
    });
    await Promise.all(
      participants.map(async (participant) => {
        await Notification.create({
          receiver_id: participant.participants_id,
          actor_id: user_id,
          content_id: plan_id,
          action_type: NOTIFICATION_TYPE.LEAVE_PLAN,
        });
      })
    );
    return res
      .status(200)
      .json({ message: 'プランから抜けさせるのに成功しました。' });
  } catch (err) {
    return res.status(500).json(err);
  }
};

// プランのブラックリストから外す
const acceptPlan = async (req, res) => {
  const { plan_id, user_id, organizer_id } = req.body;
  try {
    const plan = await Plan.findById(plan_id);
    if (plan.organizer_id !== organizer_id)
      return res.status(404).json({
        message: 'この操作は、プランの作成者にしか許可されていません。',
      });

    const planBlackList = await PlanBlackList.findOne({ plan_id, user_id });
    if (!planBlackList)
      return res
        .status(200)
        .json({ message: 'プランから追放されていません。' });

    await planBlackList.deleteOne();
    await Notification.create({
      receiver_id: user_id,
      actor_id: organizer_id,
      content_id: plan_id,
      action_type: NOTIFICATION_TYPE.ACCEPT_PLAN,
    });
    return res
      .status(200)
      .json({ message: 'プランのブラックリストから外しました。' });
  } catch (err) {
    return res.status(500).json(err);
  }
};

// プランにいいねをする
const likePlan = async (req, res) => {
  const { plan_id, liker_id } = req.body;
  try {
    const plan = await Plan.findById(plan_id);
    if (!plan)
      return res.status(404).json({ message: 'プランは削除されました。' });
    const like = await LikePlan.findOne({ plan_id, liker_id });
    if (like) {
      like.deleteOne();
      return res.status(200).json({ message: 'プランのいいねを外しました。' });
    } else {
      LikePlan.create({ plan_id, liker_id });
      await Notification.create({
        receiver_id: plan.organizer_id,
        actor_id: liker_id,
        content_id: plan_id,
        action_type: NOTIFICATION_TYPE.LIKE_PLAN,
      });
      return res
        .status(200)
        .json({ message: 'プランのいいねに成功しました。' });
    }
  } catch (err) {
    return res.status(500).json(err);
  }
};

// 1つのプラン
const fetchPlan = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.plan_id);
    if (!plan)
      return res.status(404).json({ message: '指定のプランは存在しません。' });
    const response = await plansCreateResponse([plan]);
    return res.status(200).json({ plan: response[0], message: '' });
  } catch (err) {
    return res.status(500).json(err);
  }
};

// 在住県でのプランを表示
const fetchPlansByPrefecture = async (req, res) => {
  const start = parseInt(req.params.start) || 0;
  const limit = parseInt(req.params.limit) || 10;
  const { prefecture } = req.params;
  try {
    const plans = await Plan.find({ prefecture })
      .sort({ date: -1 })
      .skip(start)
      .limit(limit);
    if (plans.length === 0)
      return res
        .status(404)
        .json({ plans: [], message: '指定の県でのプランはありません。' });
    const response = await plansCreateResponse(plans);

    const allPlans = await Plan.find({ prefecture });
    return res
      .status(200)
      .json({ plans: response, planCount: allPlans.length, message: '' });
  } catch (err) {
    return res.status(500).json(err);
  }
};

// タグでのプランを表示
const fetchPlansByTag = async (req, res) => {
  const start = parseInt(req.params.start) || 0;
  const limit = parseInt(req.params.limit) || 10;
  const { tag } = req.params;
  try {
    const planIds = await PlanTag.find({ tag_name: tag }).then((planTags) =>
      planTags.map((planTag) => planTag.plan_id)
    );
    const plans = await Plan.find({ _id: { $in: planIds } })
      .sort({ date: -1 })
      .skip(start)
      .limit(limit);
    if (plans.length === 0)
      return res
        .status(404)
        .json({ plans: [], message: '指定のタグでのプランはありません。' });
    const response = await plansCreateResponse(plans);

    const allPlans = await PlanTag.find({ tag_name: tag });
    return res
      .status(200)
      .json({ plans: response, planCount: allPlans.length, message: '' });
  } catch (err) {
    return res.status(500).json(err);
  }
};

// いいねしたプラン
const fetchLikedPlans = async (req, res) => {
  const start = parseInt(req.params.start) || 0;
  const limit = parseInt(req.params.limit) || 10;
  const { liker_id } = req.params;
  try {
    const likedPlanIds = await LikePlan.find({
      liker_id,
    })
      .sort({ createdAt: -1 })
      .skip(start)
      .limit(limit)
      .then((likedPlans) => likedPlans.map((likedPlan) => likedPlan.plan_id));
    if (likedPlanIds.length === 0)
      return res
        .status(404)
        .json({ plans: [], message: 'いいねしたプランはありません。' });

    const plans = await Plan.find({ _id: { $in: likedPlanIds } });
    const response = await plansCreateResponse(plans);

    const allPlans = await LikePlan.find({
      liker_id,
    });
    return res
      .status(200)
      .json({ plans: response, planCount: allPlans.length, message: '' });
  } catch (err) {
    return res.status(500).json(err);
  }
};

// 参加したプラン
const fetchParticipatedPlans = async (req, res) => {
  const start = parseInt(req.params.start) || 0;
  const limit = parseInt(req.params.limit) || 10;
  const { participants_id } = req.params;
  try {
    const participatedPlanIds = await ParticipationPlan.find({
      participants_id,
    })
      .sort({ createdAt: -1 })
      .skip(start)
      .limit(limit)
      .then((participatedPlan) =>
        participatedPlan.map((participatedPlan) => participatedPlan.plan_id)
      );
    if (participatedPlanIds.length === 0)
      return res
        .status(404)
        .json({ plans: [], message: '参加したプランはありません。' });
    const plans = await Plan.find({ _id: { $in: participatedPlanIds } });
    const response = await plansCreateResponse(plans);

    const allPlans = await ParticipationPlan.find({
      participants_id,
    });
    return res
      .status(200)
      .json({ plans: response, planCount: allPlans.length, message: '' });
  } catch (err) {
    return res.status(500).json(err);
  }
};

// 作成したプラン
const fetchCreatedPlans = async (req, res) => {
  const start = parseInt(req.params.start) || 0;
  const limit = parseInt(req.params.limit) || 10;
  const { user_id } = req.params;
  try {
    const plans = await Plan.find({
      organizer_id: user_id,
    })
      .sort({ date: -1 })
      .skip(start)
      .limit(limit);
    if (plans.length === 0)
      return res
        .status(404)
        .json({ plans: [], message: '作成したプランはありません。' });
    const response = await plansCreateResponse(plans);

    const allPlans = await Plan.find({
      organizer_id: user_id,
    });
    return res
      .status(200)
      .json({ plans: response, planCount: allPlans.length, message: '' });
  } catch (err) {
    return res.status(500).json(err);
  }
};

// ユーザーに合ったプラン
const fetchHomePlans = async (req, res) => {
  const start = parseInt(req.params.start) || 0;
  const limit = parseInt(req.params.limit) || 10;
  const { user_id } = req.params;
  let plans;
  try {
    const user = await User.findById(user_id);
    if (!user)
      return res
        .status(404)
        .json({ plans: [], message: '当てはまるユーザが存在しません。' });
    const friendIds = await Friend.find({ user_id: user._id }).then((friends) =>
      friends.map((friend) => friend.friend_id)
    );
    if (user.prefecture) {
      plans = await Plan.find({
        $or: [
          { organizer_id: { $in: [user._id, ...friendIds] } },
          { prefecture: user.prefecture },
        ],
      }).sort({ date: 1 });
    } else {
      plans = await Plan.find({
        organizer_id: { $in: [user._id, ...friendIds] },
      }).sort({ date: 1 });
    }
    // 締め切ったプランを除く
    const filterPlans = await Promise.all(
      plans.map(async (plan) => {
        if (plan.dead_line && isClosedPlanByDeadLine(plan.dead_line)) {
          console.log('aa: ', plan.title);
          return;
        }

        if (!plan.dead_line && isClosedPlanByDefaultDeadLine(plan.date)) {
          console.log('bb: ', plan.title);
          return;
        }

        if (plan.limit > 0) {
          const participants = await ParticipationPlan.find({
            plan_id: plan._id,
          });
          if (participants.length === plan.limit) {
            return;
          }
        }
        console.log('cc: ', plan.title);
        return plan;
      })
    ).then((results) => results.filter((result) => result !== undefined));

    if (filterPlans.length === 0) {
      return res
        .status(200)
        .json({ plans: [], message: 'おすすめのプランはありません。' });
    } else if (filterPlans.length > 0) {
      const limitPlans = filterPlans.splice(start, limit);
      const response = await plansCreateResponse(limitPlans);
      return res.status(200).json({
        plans: response,
        planCount: filterPlans.length + limitPlans.length,
        message: '',
      });
    }
  } catch (err) {
    return res.status(500).json(err);
  }
};

module.exports = {
  createPlan,
  closePlan,
  resumePlan,
  participationPlan,
  leavePlan,
  exceptPlan,
  acceptPlan,
  updatePlan,
  deletePlan,
  invitationPlan,
  cancelInvitationPlan,
  likePlan,
  fetchPlan,
  fetchPlansByPrefecture,
  fetchPlansByTag,
  fetchLikedPlans,
  fetchParticipatedPlans,
  fetchCreatedPlans,
  fetchHomePlans,
};
