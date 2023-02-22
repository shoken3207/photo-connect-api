const mongoose = require('mongoose');

const TalkRoomSchema = new mongoose.Schema(
  {
    talkRoomName: {
      type: String,
      require: true,
      default: '',
    },
    talkRoomIconImage: {
      type: String,
      require: true,
      default: '',
    },
    members: {
      type: Array,
      default: [],
    },
    lastMessage: {
      type: String,
      default: 'メッセージのやり取りがありません',
    },
    lastMessageDate: {
      type: Date,
    },
  },
  { timestamp: true }
);

module.exports = mongoose.model('TalkRoom', TalkRoomSchema);
