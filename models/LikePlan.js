const mongoose = require('mongoose');

const LikePlanSchema = new mongoose.Schema(
  {
    plan_id: { type: String, require },
    liker_id: { type: String, require },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LikePlan', LikePlanSchema);
