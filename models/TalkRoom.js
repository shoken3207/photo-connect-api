const mongoose = require('mongoose');

const TalkRoomSchema = new mongoose.Schema(
  {
    talk_room_name: {
      type: String,
      require: true,
      default: '',
    },
    talk_room_icon_image: {
      type: String,
      require: true,
      default: '',
    },
    last_message: {
      type: String,
      default: 'メッセージのやり取りがありません',
    },
    last_message_date: {
      type: String,
    },
    is_group_talk_room: {
      type: Boolean,
    },
    is_plan_talk_room: {
      type: Boolean,
    },
  },
  { timestamp: true }
);

module.exports = mongoose.model('TalkRoom', TalkRoomSchema);
