const mongoose = require('mongoose');

const InvitationPlanSchema = new mongoose.Schema(
  {
    plan_id: { type: String, require },
    invitee_id: { type: String, require },
  },
  { timestamps: true }
);

module.exports = mongoose.model('InvitationPlan', InvitationPlanSchema);
