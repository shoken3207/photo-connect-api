const mongoose = require('mongoose');

const FriendSchema = new mongoose.Schema(
  {
    talk_room_id: { type: String, require },
    user_id: { type: String, require },
    friend_id: { type: String, require },
  },
  { timestamp: true }
);

module.exports = mongoose.model('Friend', FriendSchema);
