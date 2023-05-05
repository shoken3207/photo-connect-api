const mongoose = require('mongoose');

const TalkSchema = new mongoose.Schema(
  {
    talk_room_id: {
      type: String,
      require: true,
    },
    sender_id: {
      type: String,
      require: true,
    },
    sender_icon_image: {
      type: String,
      require: true,
    },
    message: {
      type: String,
      default: '',
    },
    image: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Talk', TalkSchema);
