const Notification = require('../models/Notification');
const { notificationsCreateResponse } = require('../utils/createResponses');

const fetchNotifications = async (req, res) => {
  const start = parseInt(req.params.start);
  const limit = parseInt(req.params.limit);
  const { user_id } = req.params;
  if (!user_id)
    return res.status(404).json({ message: '不正なパラメータです。' });

  try {
    const notifications = await Notification.find({ receiver_id: user_id })
      .sort({ createdAt: -1 })
      .skip(start)
      .limit(limit);
    if (notifications.length === 0)
      return res
        .status(404)
        .json({ notifications: [], message: '通知はありません。' });
    const response = await notificationsCreateResponse(notifications);

    await Promise.all(
      notifications.map(async (notification) => {
        if (!notification.readed) {
          await notification.updateOne({ readed: true });
        }
      })
    );

    return res.status(200).json({
      notifications: response,
      message: '',
    });
  } catch (err) {
    return res.status(500).json(err);
  }
};

const fetchNotificationCount = async (req, res) => {
  const { user_id } = req.params;
  if (!user_id)
    return res.status(404).json({ message: '不正なパラメータです。' });
  const allNotifications = await Notification.find({
    receiver_id: user_id,
    readed: false,
  });

  return res.status(200).json({
    notificationCount: allNotifications.length,
  });
};

module.exports = {
  fetchNotifications,
  fetchNotificationCount,
};
