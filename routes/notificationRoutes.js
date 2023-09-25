const express = require('express');
const router = express.Router();
const {
  fetchNotifications,
  fetchNotificationCount,
} = require('../controllers/notificationController');

router.get('/:user_id/:start/:limit', fetchNotifications);
router.get('/count/:user_id', fetchNotificationCount);

module.exports = router;
