const router = require('express').Router();
const Plan = require('../models/Plan');
const User = require('../models/User');

// 1つのプラン
router.get('/:planId', async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.planId);
    if (!plan) return res.status(404).json('指定のプランは存在しません。');
    return res.status(200).json(plan);
  } catch (err) {
    return res.status(500).json(err);
  }
});

// 在住県でのプランを表示
router.get('/:prefecture/prefecture', async (req, res) => {
  try {
    console.log('req: ', req.params.prefecture);
    const plans = await Plan.find({ prefecture: req.params.prefecture });
    if (plans.length === 0)
      return res.status(404).json('指定の県でのプランはありません。');

    return res.status(200).json(plans);
  } catch (err) {
    return res.status(500).json(err);
  }
});

// いいねしたプラン
router.get('/:userId/liked', async (req, res) => {
  try {
    const plans = await Plan.find({
      likes: {
        $in: [req.params.userId],
      },
    });
    if (plans.length === 0)
      return res.status(404).json('いいねしたプランはありません。');
    return res.status(200).json(plans);
  } catch (err) {
    return res.status(500).json(err);
  }
});

// 参加したプラン
router.get('/:userId/participants', async (req, res) => {
  try {
    const plans = await Plan.find({
      participants: {
        $in: [req.params.userId],
      },
    });
    if (plans.length === 0)
      return res.status(404).json('参加したプランはありません。');
    return res.status(200).json(plans);
  } catch (err) {
    return res.status(500).json(err);
  }
});

// 作成したプラン
router.get('/:userId/create', async (req, res) => {
  try {
    const plans = await Plan.find({
      organizerId: req.params.userId,
    });
    if (plans.length === 0)
      return res.status(404).json('参加したプランはありません。');
    return res.status(200).json(plans);
  } catch (err) {
    return res.status(500).json(err);
  }
});

// ユーザーに合ったプラン
router.get('/:userId/home', async (req, res) => {
  console.log(req.params.userId);
  try {
    let allFriendPlans = [];
    let myPlans = [];
    let prefPlans = [];
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json('当てはまるユーザが存在しません。');
    if (user.prefecture) {
      allFriendPlans = await Promise.all(
        user.friends.map((friendId) => {
          return Plan.find({
            organizerId: friendId,
            prefecture: { $ne: user.prefecture },
          });
        })
      );
      myPlans = await Plan.find({
        organizerId: user._id,
        prefecture: { $ne: user.prefecture },
      });
      prefPlans = await Plan.find({ prefecture: user.prefecture });
    } else {
      allFriendPlans = await Promise.all(
        user.friends.map((friendId) => {
          return Plan.find({
            organizerId: friendId,
          });
        })
      );
      myPlans = await Plan.find({
        organizerId: user._id,
      });
    }
    const convertAllFriendPlans = allFriendPlans.flat();
    console.log(convertAllFriendPlans, 'aaa');
    const plans = [...convertAllFriendPlans, ...prefPlans, ...myPlans];
    console.log(plans, 'bbb');
    if (plans.length === 0) return res.status(404).json('プランはありません。');
    if (plans.length > 1) {
      const sortPlans = plans.sort((plan1, plan2) => {
        return new Date(plan1.createdAt) - new Date(plan2.createdAt);
      });
      return res.status(200).json(sortPlans);
    }
    return res.status(200).json(plans);
  } catch (err) {
    return res.status(500).json(err);
  }
});

// プランデータの作成
router.post('/create', async (req, res) => {
  try {
    await Plan.create(req.body);
    return res.status(200).json('プロジェクトの作成に成功しました');
  } catch (err) {
    return res.status(500).json(err);
  }
});

// プランデータの削除
router.delete('/:planId', async (req, res) => {
  if (req.params)
    try {
      const plan = await Plan.findById(req.params.planId);
      if (plan.organizerId !== req.body.organizerId)
        return res
          .status(400)
          .json('作成者が自分以外のプランデータを削除することはできません。');
      await plan.deleteOne();
      return res.status(200).json('planの削除に成功しました');
    } catch (err) {
      return res.status(500).json(err);
    }
});

// プランデータ更新
router.put('/:planId/update', async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.planId);
    if (plan.organizerId !== req.body.organizerId)
      return res
        .status(400)
        .json('作成者が自分以外のプランデータを編集することはできません。');
    await plan.updateOne({
      $set: req.body,
    });
    return res.status(200).json('プランデータの更新に成功しました');
  } catch (err) {
    return res.status(500).json(err);
  }
});

// プランに参加
router.put('/:planId/participation', async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.planId);
    if (plan.organizerId === req.body.userId)
      return res
        .status(404)
        .json('自分で作成したプランに参加することはできません。');
    if (plan.participants.includes(req.body.userId)) {
      return res.status(404).json('既にプランに参加しています。');
    }
    await plan.updateOne({
      $push: {
        participants: req.body.userId,
      },
    });
    return res.status(200).json('プランの参加に成功しました。');
  } catch (err) {
    return res.status(500).json(err);
  }
});

// プランから抜ける
router.put('/:planId/except', async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.planId);
    if (!plan.participants.includes(req.body.userId)) {
      return res.status(404).json('プランに参加していません。');
    }
    await plan.updateOne({
      $pull: {
        participants: req.body.userId,
      },
    });
    return res.status(200).json('プランから抜けました。');
  } catch (err) {
    return res.status(500).json(err);
  }
});

// プランにいいねをする
router.put('/:planId/like', async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.planId);
    if (!plan.likes.includes(req.body.userId)) {
      await plan.updateOne({
        $push: {
          likes: req.body.userId,
        },
      });
      return res.status(200).json('プランのいいねに成功しました。');
    } else {
      await plan.updateOne({
        $pull: {
          likes: req.body.userId,
        },
      });
      return res.status(200).json('プランのいいねを外しました。');
    }
  } catch (err) {
    return res.status(500).json(err);
  }
});

// プランが持つiconImageURLを変更
router.put('/updateIconImage', async (req, res) => {
  try {
    await Plan.updateMany(
      { organizerId: req.body.userId },
      { $set: { organizerIconImage: req.body.iconImage } }
    );
    return res
      .status(200)
      .json('planのorganizerIconImageの変更に成功しました。');
  } catch (err) {
    return res.status(500).json(err);
  }
});

module.exports = router;
