const Friend = require('../models/Friend');
const LikePlan = require('../models/LikePlan');
const ParticipationPlan = require('../models/ParticipationPlan');
const PlanBlackList = require('../models/PlanBlackList');
const PlanImage = require('../models/PlanImage');
const PlanTag = require('../models/PlanTag');
const ReactionMessage = require('../models/ReactionMessage');
const ReadMessage = require('../models/ReadMessage');
const Talk = require('../models/Talk');
const TalkRoomMember = require('../models/TalkRoomMember');
const User = require('../models/User');

const userCreateResponse = async (user) => {
  const friendIds = await Friend.find({ user_id: user._id }).then(
    (friendPairs) => friendPairs.map((friendPair) => friendPair.friend_id)
  );
  const friends = await User.find({ _id: { $in: friendIds } }).then((friends) =>
    usersCreateResponse(friends)
  );
  const { password, email, is_admin, __v, ...other } = user._doc;
  const convertUser = { friends, ...other };

  return convertUser;
};

const usersCreateResponse = (users) => {
  const convertUsers = users.map((user) => {
    const { _id, username, icon_image, desc } = user._doc;
    return { _id, username, icon_image, desc };
  });

  return convertUsers;
};

const plansCreateResponse = async (plans) => {
  const convertPlans = await Promise.all(
    plans.map(async (plan) => {
      const images = await PlanImage.find({ plan_id: plan._id }).then(
        (planImages) => planImages.map((planImage) => planImage.image)
      );
      const tags = await PlanTag.find({ plan_id: plan._id }).then((planTags) =>
        planTags.map((planTag) => planTag.tag_name)
      );
      const likerIds = await LikePlan.find({ plan_id: plan._id }).then(
        (likePlans) => likePlans.map((likePlan) => likePlan.liker_id)
      );
      const likers = await User.find({ _id: { $in: likerIds } }).then(
        (likers) => usersCreateResponse(likers)
      );
      const blakUserIds = await PlanBlackList.find({ plan_id: plan._id }).then(
        (blackUsers) => blackUsers.map((blackUser) => blackUser.user_id)
      );
      const blackUsers = await User.find({ _id: { $in: blakUserIds } }).then(
        (blackUsers) => usersCreateResponse(blackUsers)
      );
      const participantIds = await ParticipationPlan.find({
        plan_id: plan._id,
      }).then((participationPlans) =>
        participationPlans.map((plan) => plan.participants_id)
      );
      const participants = await User.find({
        _id: { $in: participantIds },
      }).then((participants) => usersCreateResponse(participants));
      return {
        ...plan._doc,
        images,
        tags,
        likers,
        participants,
        blackUsers,
      };
    })
  );
  return convertPlans;
};

const messageCreateResopnse = async (messages) => {
  const convertMessages = await Promise.all(
    messages.map(async (message) => {
      const reactions = await ReactionMessage.find({ talk_id: message._id });
      const reactors = await Promise.all(
        reactions.map(async (reaction) => {
          const reactor = await User.findById(reaction.reactor_id);
          const { reaction_type } = reaction;
          const { _id, username, icon_image, desc } = reactor;
          return { _id, username, icon_image, desc, reaction_type };
        })
      );
      const readMessages = await ReadMessage.find({ talk_id: message._id });
      return { ...message._doc, reactors, read_count: readMessages.length };
    })
  );
  return convertMessages;
};

const talkRoomCreateResponse = async (talkRooms, user_id) => {
  const convertTalkRooms = await Promise.all(
    talkRooms.map(async (talkRoom) => {
      if (!talkRoom.is_group_talk_room) {
        const friendId = await TalkRoomMember.findOne({
          talk_room_id: talkRoom._id,
          member_id: { $ne: user_id },
        }).then(
          (talkRoomMember) =>
            talkRoomMember !== null && talkRoomMember.member_id
        );
        if (friendId) {
          const friend = await User.findById(friendId);
          talkRoom.talk_room_icon_image = friend.icon_image;
          talkRoom.talk_room_name = friend.username || 'unknown';
        } else {
          talkRoom.talk_room_name = 'unknown';
          talkRoom.talk_room_icon_image = '';
        }
      }
      const talkIds = await Talk.find({
        talk_room_id: talkRoom._id,
        sender_id: { $ne: user_id },
      }).then((talks) => talks.map((talk) => talk._id));
      const unreadTalkIds = await Promise.all(
        talkIds.map(async (talk_id) => {
          const readTalk = await ReadMessage.findOne({
            talk_id,
            reader_id: user_id,
          });
          if (!readTalk) {
            return talk_id;
          }
        })
      );
      const filterUnreadTalkIds = unreadTalkIds.filter((x) => x !== undefined);
      const talkRoomMemberIds = await TalkRoomMember.find({
        talk_room_id: talkRoom._id,
      }).then((talkRoomMembers) =>
        talkRoomMembers.map((talkRoomMember) => talkRoomMember.member_id)
      );
      const talkRoomMembers = await User.find({
        _id: { $in: talkRoomMemberIds },
      });
      const convertTalkRoomMembers = usersCreateResponse(talkRoomMembers);
      return {
        ...talkRoom._doc,
        talk_room_members: convertTalkRoomMembers,
        unread_talk_count: filterUnreadTalkIds.length,
      };
    })
  );

  return convertTalkRooms;
};

module.exports = {
  userCreateResponse,
  usersCreateResponse,
  plansCreateResponse,
  talkRoomCreateResponse,
  messageCreateResopnse,
};
