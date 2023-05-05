const express = require('express');
const router = express.Router();
const {
  createMessage,
  deleteMessage,
  readMessage,
  reactionMessage,
  fetchTalkRoomMembers,
  fetchTalkRooms,
  fetchTalkRoom,
  fetchMessage,
  fetchMessages,
  removeMessageReaction,
  leaveTalkRoom,
} = require('../controllers/chatController');

router.post('/leaveTalkRoom', leaveTalkRoom);
router.post('/createMessage', createMessage);
router.post('/readMessages', readMessage);
router.post('/reactionMessage', reactionMessage);
router.post('/removeMessageReaction', removeMessageReaction);
router.delete('/deleteMessage/:talk_id/:user_id', deleteMessage);
router.get('/message/:talk_id', fetchMessage);
router.get('/talkRooms/:user_id/:start/:limit', fetchTalkRooms);
router.get('/talkRoom/:user_id/:talk_room_id', fetchTalkRoom);
router.get('/members/:talk_room_id/:start/:limit', fetchTalkRoomMembers);
router.get('/messages/:talk_room_id/:start/:limit', fetchMessages);

module.exports = router;
