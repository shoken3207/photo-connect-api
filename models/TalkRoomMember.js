const mongoose = require('mongoose');

const TalkRoomMemberSchema = new mongoose.Schema(
  {
    talk_room_id: { type: String, require },
    member_id: { type: String, require },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TalkRoomMember', TalkRoomMemberSchema);
