const router = require('express').Router();
const User = require('../models/User');

router.get('/hello', (req, res) => {
  return res.send('Hello Expless');
});

// ユーザー情報登録
router.post('/register', async (req, res) => {
  console.log('register');
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      console.log('登録済み');
      return res.status(200).json({ user, registered: true });
    }
    console.log('user: ', user);
    console.log('req: ', req.body);
    const newUser = await User.create(req.body);

    return res.status(200).json({ user: newUser, registered: false });
  } catch (err) {
    return res.status(500).json(err);
  }
});

router.delete('/:id', async (req, res) => {
  if (req.body.userId !== req.params.id)
    return res.status(404).json('自分以外のユーザを削除することはできません');
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json('該当するユーザが存在しません。');
    await user.deleteOne();
    return res.status(200).json('ユーザの削除に成功しました');
  } catch (err) {
    return res.status(500).json(err);
  }
});
// フレンド全員のユーザ情報を取得
router.get('/:id/all', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    const friends = await Promise.all(
      user.friends.map((friendId) => {
        return User.findById(friendId);
      })
    );

    const formatFriends = friends.map((friend) => {
      const { password, ...other } = friend._doc;
      return other;
    });
    return res.status(200).json(formatFriends);
  } catch (err) {
    return res.status(500).json(err);
  }
});

router.get('/:name/search', async (req, res) => {
  try {
    const users = await User.find({ username: req.params.name });
    if (users.length === 0)
      return res.status(404).json('入力した名前のユーザは存在しません。');
    const formatUsers = users.map((user) => {
      const { password, ...other } = user._doc;
      return other;
    });
    res.status(200).json(formatUsers);
  } catch (err) {
    return res.status(500).json(err);
  }
});
// 一人のユーザ情報を取得
router.get('/:id', async (req, res) => {
  const userId = req.params.id;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json('ユーザが見つかりません。');
    const { password, ...other } = user._doc;
    return res.status(200).json(other);
  } catch (err) {
    return res.status(500).json(err);
  }
});

// 一人のユーザ情報を取得
router.get('/:email/email', async (req, res) => {
  const email = req.params.email;
  console.log(email);
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json('ユーザが見つかりません。');
    const { password, ...other } = user._doc;
    return res.status(200).json(other);
  } catch (err) {
    return res.status(500).json(err);
  }
});
// フレンド追加処理
router.put('/:id/add', async (req, res) => {
  const userId = req.body.userId;
  const friendId = req.params.id;
  if (req.body.userId === req.params.id)
    return res.status(404).json('自分自身をフレンドに追加することはできません');
  try {
    const user = await User.findById(userId);
    const friend = await User.findById(friendId);
    console.log('user: ', friendId, user.friends);

    if (!user.friends.includes(friendId)) {
      await user.updateOne({
        $push: {
          friends: friendId,
        },
      });
      await friend.updateOne({
        $push: {
          friends: userId,
        },
      });
    } else {
      return res.status(404).json('既に追加されています');
    }
    return res.status(200).json('友達追加に成功しました');
  } catch (err) {
    return res.status(500).json(err);
  }
});
// ユーザデータ更新
router.put('/:id', async (req, res) => {
  console.log(req.body);
  try {
    if (req.body.userId !== req.params.id)
      return res
        .status(404)
        .json('自分以外のユーザデータを更新することはできません。');
    await User.findByIdAndUpdate(req.params.id, {
      $set: req.body,
    });
    return res.status(200).json('ユーザデータの更新に成功しました');
  } catch (err) {
    return res.status(500).json(err);
  }
});

module.exports = router;
