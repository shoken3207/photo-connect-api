const mongoose = require('mongoose');

const ParticipationPlanSchema = new mongoose.Schema(
  {
    plan_id: { type: String, require },
    participants_id: { type: String, require },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ParticipationPlan', ParticipationPlanSchema);
