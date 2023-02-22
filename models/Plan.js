const mongoose = require('mongoose');

const PlanSchema = new mongoose.Schema(
  {
    talkRoomId: { type: String, require: true },
    title: { type: String, require: true },
    images: { type: Array, default: [] },
    place: { type: String, require: true },
    prefecture: { type: String, require: true },
    date: { type: String, require: true },
    desc: { type: String },
    limit: { type: Number, default: 0 },
    chipTexts: { type: Array, default: [] },
    likes: { type: Array, default: [] },
    organizerId: { type: String, require: true },
    organizerIconImage: { type: String },
    participants: { type: Array, default: [] },
  },
  { timestamp: true }
);

module.exports = mongoose.model('Plan', PlanSchema);
