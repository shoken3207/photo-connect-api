const mongoose = require('mongoose');

const TalkSchema = new mongoose.Schema(
  {
    talkRoomId: {
      type: String,
      require: true,
    },
    senderId: {
      type: String,
      require: true,
    },
    senderIconImage: {
      type: String,
      require: true,
    },
    message: {
      type: String,
    },
    image: {
      type: String,
    },
    reads: {
      type: Array,
      default: [],
    },
    likes: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Talk', TalkSchema);
