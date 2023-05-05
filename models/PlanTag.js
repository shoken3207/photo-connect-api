const mongoose = require('mongoose');

const PlanTagSchema = new mongoose.Schema(
  {
    plan_id: { type: String, require },
    tag_name: { type: String, require },
  },
  { timestamp: true }
);

module.exports = mongoose.model('PlanTag', PlanTagSchema);
