const Talk = require('../models/Talk');
const TalkRoom = require('../models/TalkRoom');
const ReadMessage = require('../models/ReadMessage');
const ReactionMessage = require('../models/ReactionMessage');
const TalkRoomMember = require('../models/TalkRoomMember');
const User = require('../models/User');
const {
  talkRoomCreateResponse,
  messageCreateResopnse,
  usersCreateResponse,
} = require('../utils/createResponses');
const { convertToSaveDate } = require('../utils/dateUtils');
const Friend = require('../models/Friend');
const Notification = require('../models/Notification');
const { NOTIFICATION_TYPE } = require('../const');

// トークルームから抜ける
const leaveTalkRoom = async (req, res) => {
  const { talk_room_id, user_id } = req.body;
  try {
    const talkRoom = await TalkRoom.findById(talk_room_id);

    if (talkRoom.is_plan_talk_room)
      return res.status(404).json({
        message:
          'プランのトークルームを抜けるには、プラン自体から抜ける必要があります。',
      });

    const talkRoomMember = await TalkRoomMember.findOne({
      talk_room_id,
      members_id: user_id,
    });
    if (!talkRoomMember)
      return res
        .status(404)
        .json({ message: 'あなたはトークルームのメンバーではありません。' });

    const talkRoomMembers = await TalkRoomMember.find({ talk_room_id });
    if (talkRoomMembers.length === 1) {
      if (talkRoomMembers[0].member_id !== user_id)
        return res.status(404).json({
          message: 'トークルームのメンバーは一人ですが、あなたではありません。',
        });
      const talkIds = await Talk.find({ talk_room_id }).then((talks) =>
        talks.map((talk) => talk._id)
      );
      await Promise.all(
        talkIds.map(async (talk_id) => {
          await ReactionMessage.deleteMany({ talk_id });
          await ReadMessage.deleteMany({ talk_id });
        })
      );
      await Talk.deleteMany({ talk_room_id });
      await talkRoom.deleteOne();
    }
    await TalkRoomMember.deleteOne({ talk_room_id, member_id: user_id });

    if (!talkRoom.is_group_talk_room) {
      const friend_id = await Friend.findOne({ talk_room_id, user_id }).then(
        (friend) => friend.friend_id
      );
      await Friend.deleteOne({ user_id, friend_id });
      await Notification.create({
        receiver_id: friend_id,
        actor_id: user_id,
        action_type: NOTIFICATION_TYPE.LEAVE_FRIEND,
      });
      return res
        .status(200)
        .json({ message: '友達から抜けるのに成功しました。' });
    }

    return res
      .status(200)
      .json({ message: 'トークルームから抜けるのに成功しました。' });
  } catch (err) {
    return res.status(500).json(err);
  }
};

// メッセージ作成
const createMessage = async (req, res) => {
  const { message, image, talk_room_id, sender_id, sender_icon_image } =
    req.body;
  try {
    // チェック処理
    const talkRoom = await TalkRoom.findById(talk_room_id);
    if (!talkRoom._id)
      return res.status(404).json({ message: 'トークルームが存在しません。' });
    const talkRoomMemberIds = await TalkRoomMember.find({
      talk_room_id: talkRoom._id,
    }).then((talkRoomMembers) =>
      talkRoomMembers.map((talkRoomMember) => talkRoomMember.member_id)
    );
    const isTalkRoomMember = talkRoomMemberIds.find(
      (talkRoomMemberId) => talkRoomMemberId === sender_id
    );
    if (!isTalkRoomMember)
      return res.status(404).json({ message: 'メンバーに入っていません。' });
    // 実行処理
    await Talk.create({
      talk_room_id,
      sender_id,
      sender_icon_image,
      message,
      image,
    });

    let last_message;
    if (message) {
      last_message = message;
    } else {
      if (image) {
        last_message = '画像が送信されています。';
      } else {
        last_message = '';
      }
    }
    const nowDate = new Date();
    const saveDate = convertToSaveDate(nowDate);
    await talkRoom.updateOne({
      $set: { last_message, last_message_date: saveDate },
    });

    await Promise.all(
      talkRoomMemberIds.map(async (talkRoomMemberId) => {
        if (talkRoomMemberId !== sender_id) {
          await Notification.create({
            receiver_id: talkRoomMemberId,
            actor_id: sender_id,
            action_type: NOTIFICATION_TYPE.RECEIVE_TALK,
            content_id: talk_room_id,
          });
        }
      })
    );

    return res.status(200).json({ message: '' });
  } catch (err) {
    return res.status(500).json(err);
  }
};

// メッセージ削除
const deleteMessage = async (req, res) => {
  const { talk_id, user_id } = req.params;
  try {
    const talk = await Talk.findById(talk_id);
    if (!talk)
      return res.status(404).json({ message: 'トークが存在しません。' });

    if (talk.sender_id !== user_id)
      return res
        .status(404)
        .json({ message: 'トークの作成者以外は、削除できません。' });

    await Talk.findByIdAndDelete(talk_id);
    const [lastTalk] = await Talk.find({ talk_room_id: talk.talk_room_id })
      .sort({ createdAt: -1 })
      .limit(1);
    await TalkRoom.findByIdAndUpdate(talk.talk_room_id, {
      $set: {
        last_message: lastTalk.message || '画像が送信されています。',
        last_message_date: lastTalk.createdAt,
      },
    });
    return res.status(200).json({ message: '' });
  } catch (err) {
    return res.status(500).json(err);
  }
};

// メッセージ既読
const readMessage = async (req, res) => {
  const { talk_room_id, reader_id } = req.body;
  try {
    // チェック処理
    const talkIds = await Talk.find({
      talk_room_id,
      sender_id: { $ne: reader_id },
    }).then((talks) => talks.map((talk) => talk._id));
    if (talkIds.length === 0) return res.status(200).json({ message: '' });

    // 実行処理
    const unreadTalkIds = await Promise.all(
      talkIds.map(async (talk_id) => {
        const readTalk = await ReadMessage.findOne({
          talk_id,
          reader_id,
        });
        if (!readTalk) {
          return talk_id;
        }
      })
    );
    const filterUnreadTalkIds = unreadTalkIds.filter((x) => x !== undefined);

    await Promise.all(
      filterUnreadTalkIds.map(async (talk_id) => {
        await ReadMessage.create({ talk_id, reader_id });
      })
    );

    return res.status(200).json({ message: '' });
  } catch (err) {
    return res.status(500).json(err);
  }
};

// メッセージリアクション
const reactionMessage = async (req, res) => {
  const { talk_id, reactor_id, reaction_type } = req.body;
  try {
    // チェック処理
    const talk = await Talk.findById(talk_id);
    if (!talk)
      return res.status(404).json({ message: 'メッセージが存在しません。' });

    const reactionMessage = await ReactionMessage.find({ talk_id, reactor_id });
    if (reactionMessage.length > 0)
      return res
        .status(404)
        .json({ message: 'このトークにはリアクション済みです。' });

    // 実行処理
    await ReactionMessage.create({ talk_id, reactor_id, reaction_type });

    await Notification.create({
      receiver_id: talk.sender_id,
      actor_id: reactor_id,
      action_type: NOTIFICATION_TYPE.REACTION_TALK,
      content_id: talk.talk_room_id,
    });
    return res.status(200).json({ message: 'トークにリアクションしました' });
  } catch (err) {
    return res.status(500).json(err);
  }
};

// メッセージリアクションを外す
const removeMessageReaction = async (req, res) => {
  const { talk_id, reactor_id } = req.body;
  try {
    // チェック処理
    const talk = await Talk.findById(talk_id);
    if (!talk)
      return res.status(404).json({ message: 'メッセージが存在しません。' });

    const reactionMessage = await ReactionMessage.findOne({
      talk_id,
      reactor_id,
    });
    if (!reactionMessage)
      return res
        .status(404)
        .json({ message: 'このトークにリアクションしていません。' });

    // 実行処理
    await reactionMessage.deleteOne();

    return res
      .status(200)
      .json({ message: 'トークへのリアクションを削除しました。' });
  } catch (err) {
    return res.status(500).json(err);
  }
};

// 1つのメッセージを取得
const fetchMessage = async (req, res) => {
  try {
    const talk = await Talk.findById(req.params.talk_id);
    if (!talk) return res.status(404).json({ message: 'トークがありません。' });
    const response = await messageCreateResopnse([talk]);
    return res.status(200).json({ talk: response, message: '' });
  } catch (err) {
    return res.status(500).json(err);
  }
};

// トークルームを取得
const fetchTalkRoom = async (req, res) => {
  const { talk_room_id, user_id } = req.params;
  try {
    const talkRoom = await TalkRoom.findById(talk_room_id);
    if (!talkRoom)
      return res
        .status(404)
        .json({ message: 'トークルームがありません', talkRooms: [] });

    const response = await talkRoomCreateResponse([talkRoom], user_id);

    return res.status(200).json({ talkRoom: response[0], message: '' });
  } catch (err) {
    return rse.status(500).json(err);
  }
};

// chat画面のトークルームを取得
const fetchTalkRooms = async (req, res) => {
  const start = parseInt(req.params.start) || 0;
  const limit = parseInt(req.params.limit) || 10;
  const { user_id } = req.params;
  try {
    const talkRoomIds = await TalkRoomMember.find({
      member_id: user_id,
    }).then((talkRooms) => talkRooms.map((talkRoom) => talkRoom.talk_room_id));
    if (talkRoomIds.length === 0)
      return res
        .status(404)
        .json({ message: 'トークルームがありません', talkRooms: [] });
    const talkRooms = await TalkRoom.find({ _id: { $in: talkRoomIds } })
      .sort({ last_message_date: -1 })
      .skip(start)
      .limit(limit);
    const response = await talkRoomCreateResponse(talkRooms, user_id);

    return res.status(200).json({ talkRooms: response, message: '' });
  } catch (err) {
    return res.status(500).json(err);
  }
};

// トークルームのメンバーを取得
const fetchTalkRoomMembers = async (req, res) => {
  const start = parseInt(req.params.start) || 0;
  const limit = parseInt(req.params.limit) || 10;
  const { talk_room_id } = req.params;
  try {
    const talkRoomMemberIds = await TalkRoomMember.find({
      talk_room_id,
    }).then((talkRoomMembers) =>
      talkRoomMembers.map((talkRoomMember) => talkRoomMember.member_id)
    );

    if (talkRoomMemberIds.length === 0)
      return res
        .status(404)
        .json({ message: 'メンバーが存在しません', talkRoomMembers: [] });

    const talkRoomMembers = await User.find({
      _id: { $in: talkRoomMemberIds },
    })
      .skip(start)
      .limit(limit);

    const response = usersCreateResponse(talkRoomMembers);

    return res.status(200).json({ talkRoomMembers: response, message: '' });
  } catch (err) {
    return rse.status(500).json(err);
  }
};

// メッセージ取得
const fetchMessages = async (req, res) => {
  const start = parseInt(req.params.start) || 0;
  const limit = parseInt(req.params.limit) || 10;
  const { talk_room_id } = req.params;
  try {
    const messages = await Talk.find({ talk_room_id })
      .sort({ createdAt: -1 })
      .skip(start)
      .limit(limit);
    if (messages.length === 0)
      return res
        .status(200)
        .json({ message: 'トークが存在しません', talks: [] });

    const allMessages = await Talk.find({ talk_room_id });
    const convertMessages = messages.sort((message1, message2) => {
      return message1 > message2 ? 1 : -1;
    });
    const response = await messageCreateResopnse(convertMessages);

    return res
      .status(200)
      .json({ talks: response, message: '', talkCount: allMessages.length });
  } catch (err) {
    return res.status(500).json(err);
  }
};

module.exports = {
  leaveTalkRoom,
  createMessage,
  deleteMessage,
  reactionMessage,
  removeMessageReaction,
  readMessage,
  fetchTalkRooms,
  fetchTalkRoom,
  fetchTalkRoomMembers,
  fetchMessage,
  fetchMessages,
};
