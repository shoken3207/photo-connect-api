const mongoose = require('mongoose');

const PlanBlackListSchema = new mongoose.Schema(
  {
    plan_id: { type: String, require },
    user_id: { type: String, require },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PlanBlackList', PlanBlackListSchema);
