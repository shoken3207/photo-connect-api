const router = require('express').Router();
const TalkRoom = require('../models/TalkRoom');
const User = require('../models/User');

// home画面用　トークルームを複数返す
router.get('/:userId/all', async (req, res) => {
  try {
    const talkRooms = await TalkRoom.find({
      members: {
        $in: [req.params.userId],
      },
    });
    if (talkRooms.length === 0)
      return res.status(404).json('該当するトークルームは、存在しません');
    return res.status(200).json(talkRooms);
  } catch (err) {
    return res.status(500).json(err);
  }
});

// トークルーム内のメンバーを返す
router.get('/:talkRoomId/members', async (req, res) => {
  try {
    const talkRoom = await TalkRoom.findById(req.params.talkRoomId);
    if (!talkRoom)
      return res.status(404).json('トークルームが見つかりません。');
    const membersId = talkRoom.members;
    const membersData = await Promise.all(
      membersId.map((memberId) => {
        return User.findById(memberId);
      })
    );
    console.log(membersData);
    return res.status(200).json(membersData);
  } catch (err) {
    return res.status(500).json(err);
  }
});

router.get('/:talkRoomId', async (req, res) => {
  try {
    const talkRoom = await TalkRoom.findById(req.params.talkRoomId);
    if (!talkRoom) {
      return res.status(404).json('指定のトークルームは存在しません。');
    }
    return res.status(200).json(talkRoom);
  } catch (err) {
    return res.status(500).json(err);
  }
});

router.delete('/:talkRoomId/remove', async (req, res) => {
  try {
    await TalkRoom.findByIdAndDelete(req.params.talkRoomId);
    return res.status(200).json('トークルームの削除に成功しました');
  } catch (err) {
    return res.status(500).json(err);
  }
});

// フレンド追加したタイミング
router.post('/create', async (req, res) => {
  try {
    console.log(req.body);
    // const talkRoom = await TalkRoom.findOne({
    //   members: {
    //     $all: [req.body.userId, req.params.id],
    //   },
    // });
    // if (talkRoom)
    //   return res.status(404).json('このトークルームは既に存在しています');
    const newTalkRoom = await TalkRoom.create(req.body);
    return res.status(200).json(newTalkRoom);
  } catch (err) {
    return res.status(500).json(err);
  }
});

// トークルームデータ更新
router.put('/:talkRoomId', async (req, res) => {
  try {
    console.log('talkROomId: ', req.params.talkRoomId);
    const talkRoom = await TalkRoom.findById(req.params.talkRoomId);
    if (!talkRoom) return res.status(404).json('トークルームが存在しません。');
    await talkRoom.updateOne({ $set: { lastMessage: req.body.lastMessage } });
    return res.status(200).json('ラストメッセージの更新に成功しました');
  } catch (err) {
    return res.status(500).json(err);
  }
});

// トークルームのメンバーに加える
router.put('/:talkRoomId/add', async (req, res) => {
  try {
    const talkRoom = await TalkRoom.findById(req.params.talkRoomId);
    if (!talkRoom) return res.status(404).json('トークルームが存在しません。');
    await talkRoom.updateOne({ $push: { members: req.body.userId } });
    return res.status(200).json('トークルームに追加しました');
  } catch (err) {
    return res.status(500).json(err);
  }
});

// トークルームのメンバーから外す
router.put('/:talkRoomId/except', async (req, res) => {
  try {
    const talkRoom = await TalkRoom.findById(req.params.talkRoomId);
    if (!talkRoom) return res.status(404).json('トークルームが存在しません。');
    await talkRoom.updateOne({ $pull: { members: req.body.userId } });
    return res.status(200).json('トークルームから外しました');
  } catch (err) {
    return res.status(500).json(err);
  }
});

// トークルームが持つiconImageURLを変更
router.put('/updateIconImage', async (req, res) => {
  try {
    await TalkRoom.updateMany(
      { _id: req.body.talkRoomId },
      { $set: { talkRoomIconImage: req.body.talkRoomIconImage } }
    );
    return res
      .status(200)
      .json('talkRoomのtalkRoomIconImageの変更に成功しました。');
  } catch (err) {
    return res.status(500).json(err);
  }
});

// トークルームが持つNameを変更
router.put('/updateName', async (req, res) => {
  try {
    await TalkRoom.updateMany(
      { _id: req.body.talkRoomId },
      { $set: { talkRoomName: req.body.talkRoomName } }
    );
    return res.status(200).json('talkRoomのtalkRoomNameの変更に成功しました。');
  } catch (err) {
    return res.status(500).json(err);
  }
});
module.exports = router;
