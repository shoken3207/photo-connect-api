const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, require: true },
    email: { type: String, require: true },
    password: { type: String },
    desc: { type: String },
    prefecture: { type: String },
    birthday: { type: String },
    icon_image: { type: String },
    home_image: { type: String },
    is_admin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
