const mongoose = require('mongoose');

const PlanImageSchema = new mongoose.Schema(
  {
    plan_id: { type: String, require },
    image: { type: String, require },
  },
  { timestamp: true }
);

module.exports = mongoose.model('PlanImage', PlanImageSchema);
