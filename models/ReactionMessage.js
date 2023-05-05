const mongoose = require('mongoose');

const ReactionMessageSchema = new mongoose.Schema(
  {
    talk_id: { type: String, require },
    reactor_id: { type: String, require },
    reaction_type: { type: String, require },
  },
  { timestamp: true }
);

module.exports = mongoose.model('ReactionMessage', ReactionMessageSchema);
