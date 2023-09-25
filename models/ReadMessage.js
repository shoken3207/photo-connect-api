const mongoose = require('mongoose');

const ReadMessageSchema = new mongoose.Schema(
  {
    talk_id: { type: String, require },
    reader_id: { type: String, require },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ReadMessage', ReadMessageSchema);
