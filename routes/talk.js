const router = require('express').Router();
const Talk = require('../models/Talk');

router.post('/create', async (req, res) => {
  try {
    const newTalk = await Talk.create(req.body);
    return res.status(200).json(newTalk);
  } catch (err) {
    return res.status(500).json(err);
  }
});

router.get('/:talkId', async (req, res) => {
  try {
    const talk = await Talk.findById(req.params.talkId);
    if (!talk) return res.status(404).json('トークがありません。');
    return res.status(200).json(talk);
  } catch (err) {
    return res.status(500).json(err);
  }
});

router.get('/:talkRoomId/all', async (req, res) => {
  try {
    const allTalk = await Talk.find({ talkRoomId: req.params.talkRoomId });
    if (!allTalk) return res.status(404).json('トークがありません。');
    return res.status(200).json(allTalk);
  } catch (err) {
    return res.status(500).json(err);
  }
});

router.put('/:talkRoomId/readed', async (req, res) => {
  try {
    const talks = await Talk.find({
      talkRoomId: req.params.talkRoomId,
      senderId: req.body.friendId,
      readed: false,
    });
    if (talks.length === 0) {
      return res.status(200).json('未読のメッセージはありません。');
    }
    await Promise.all(
      talks.map((talk) => {
        return talk.updateOne({ $set: { readed: true } });
      })
    );
    return res.status(200).json('メッセージを既読にしました。');
  } catch (err) {
    return res.status(500).json(err);
  }
});

// トークが持つiconImageURLを変更
router.put('/updateIconImage', async (req, res) => {
  try {
    // const plans = await Plan.find(req.body.iconImageURL);
    // if (plans.length < 1)
    //   return res.status(404).json('作成したプランはありません。');
    await Talk.updateMany(
      { senderId: req.body.userId },
      { $set: { senderIconImage: req.body.iconImage } }
    );
    return res.status(200).json('talkのsenderIconImageの変更に成功しました。');
    // await Promise.all(
    //   plans.map(plan => {
    //     plan.up
    //   })
    // )
  } catch (err) {
    return res.status(500).json(err);
  }
});

module.exports = router;
