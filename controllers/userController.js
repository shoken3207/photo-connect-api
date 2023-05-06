const User = require('../models/User');
const Plan = require('../models/Plan');
const Talk = require('../models/User');
const Friend = require('../models/Friend');
const TalkRoom = require('../models/TalkRoom');
const TalkRoomMember = require('../models/TalkRoomMember');
const {
  userCreateResponse,
  usersCreateResponse,
} = require('../utils/createResponses');
const Notification = require('../models/Notification');
const { NOTIFICATION_TYPE } = require('../const');
const { convertToSaveDate } = require('../utils/dateUtils');

// ユーザー情報登録
const register = async (req, res) => {
  let response;
  const {
    username,
    email,
    desc,
    prefecture,
    birthday,
    icon_image,
    home_image,
  } = req.body;
  try {
    // チェック処理
    const user = await User.findOne({ email });
    if (user) {
      response = await userCreateResponse(user);
      return res
        .status(200)
        .json({ user: response, registered: true, message: '' });
    }

    // 実行処理
    const newUser = await User.create({
      username,
      email,
      desc,
      prefecture,
      birthday,
      icon_image,
      home_image,
    });
    response = await userCreateResponse(newUser);
    return res
      .status(200)
      .json({ user: response, registered: false, message: '' });
  } catch (err) {
    return res.status(500).json(err);
  }
};

// 友達追加
const addFriend = async (req, res) => {
  const { user_id, friend_id } = req.body;
  try {
    // チェック処理
    const friend = await Friend.findOne({
      user_id,
      friend_id,
    });
    if (friend)
      return res.status(404).json({ message: '既に、友達追加済みです。' });

    // 実行処理
    const nowDate = new Date();
    const saveDate = convertToSaveDate(nowDate);
    const newTalkRoom = await TalkRoom.create({
      is_group_talk_room: false,
      is_plan_talk_room: false,
      last_message_date: saveDate,
    });
    await Friend.create({
      talk_room_id: newTalkRoom._id,
      user_id,
      friend_id,
    });
    await Friend.create({
      talk_room_id: newTalkRoom._id,
      user_id: friend_id,
      friend_id: user_id,
    });
    await TalkRoomMember.create({
      talk_room_id: newTalkRoom._id,
      member_id: friend_id,
    });
    await TalkRoomMember.create({
      talk_room_id: newTalkRoom._id,
      member_id: user_id,
    });
    await Notification.create({
      receiver_id: friend_id,
      actor_id: user_id,
      action_type: NOTIFICATION_TYPE.ADD_FRIEND,
    });

    return res.status(200).json({ message: '友達追加に成功しました。' });
  } catch (err) {
    return res.status(500).json(err);
  }
};

// ユーザデータ更新
const updateUser = async (req, res) => {
  const {
    user_id,
    username,
    icon_image,
    home_image,
    desc,
    prefecture,
    birthday,
  } = req.body;
  try {
    // チェック処理
    const user = await User.findById(user_id);
    if (!user)
      return res
        .status(404)
        .json({ message: 'ユーザーデータが存在しません。' });

    // 実行処理
    await user.updateOne({
      $set: { username, desc, prefecture, birthday, icon_image, home_image },
    });
    await Plan.updateMany(
      { organizer_id: user_id },
      { $set: { organizer_icon_image: icon_image } }
    );
    await Talk.updateMany(
      { sender_id: user_id },
      { $set: { sender_icon_image: icon_image } }
    );

    return res
      .status(200)
      .json({ message: 'ユーザデータの更新に成功しました' });
  } catch (err) {
    return res.status(500).json(err);
  }
};

// ユーザデータを削除
const deleteUser = async (req, res) => {
  const { user_id, login_user_id } = req.body;
  if (login_user_id !== user_id)
    return res
      .status(404)
      .json({ message: '自分以外のユーザを削除することはできません' });
  try {
    const user = await User.findById(user_id);
    if (!user)
      return res
        .status(404)
        .json({ message: '該当するユーザが存在しません。' });
    await user.deleteOne();
    return res.status(200).json({ message: 'ユーザの削除に成功しました' });
  } catch (err) {
    return res.status(500).json(err);
  }
};

// フレンド全員のユーザ情報を取得
const fetchAllFriend = async (req, res) => {
  try {
    const friendIds = await Friend.find({
      user_id: req.params.user_id,
    }).then((friendPairs) =>
      friendPairs.map((friendPair) => friendPair.friend_id)
    );
    const friends = await User.find({ _id: { $in: friendIds } });
    if (friends.length === 0)
      return res
        .status(404)
        .json({ message: 'フレンドが存在しません。', users: [] });
    const response = usersCreateResponse(friends);

    return res.status(200).json({ users: response, message: '' });
  } catch (err) {
    return res.status(500).json(err);
  }
};

// usernameからユーザ情報を取得
const fetchUsersByName = async (req, res) => {
  try {
    const users = await User.find({ username: req.params.name });
    if (users.length === 0)
      return res
        .status(404)
        .json({ users: [], message: '入力した名前のユーザは存在しません。' });
    const response = usersCreateResponse(users);

    return res.status(200).json({ users: response, message: '' });
  } catch (err) {
    return res.status(500).json(err);
  }
};

// emailからユーザ情報を取得
const fetchUserByEmail = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user)
      return res.status(404).json({ message: 'ユーザが見つかりません。' });
    const response = await userCreateResponse(user);
    return res.status(200).json({ user: response, message: '' });
  } catch (err) {
    return res.status(500).json(err);
  }
};

// user_idからユーザ情報を取得
const fetchUserById = async (req, res) => {
  const user_id = req.params.user_id;
  try {
    const user = await User.findById(user_id);
    if (!user)
      return res.status(404).json({ message: 'ユーザが見つかりません。' });
    const response = await userCreateResponse(user);
    return res.status(200).json({ user: response, message: '' });
  } catch (err) {
    return res.status(500).json(err);
  }
};

module.exports = {
  register,
  updateUser,
  deleteUser,
  addFriend,
  fetchAllFriend,
  fetchUsersByName,
  fetchUserByEmail,
  fetchUserById,
};
