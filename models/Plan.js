const mongoose = require('mongoose');

const PlanSchema = new mongoose.Schema(
  {
    talk_room_id: { type: String, require: true },
    title: { type: String, require: true },
    place: { type: String, require: true },
    prefecture: { type: String, require: true },
    date: { type: String, require: true },
    dead_line: { type: String },
    desc: { type: String },
    limit: { type: Number, default: 0 },
    organizer_id: { type: String, require: true },
    organizer_icon_image: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Plan', PlanSchema);
