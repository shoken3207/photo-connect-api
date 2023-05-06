const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    receiver_id: { type: String, require },
    actor_id: { type: String, require },
    content_id: { type: String },
    action_type: { type: Number, require },
    readed: { type: Boolean, default: false },
    is_plan_organizer: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', NotificationSchema);
