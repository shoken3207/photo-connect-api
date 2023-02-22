const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    authId: { type: String },
    username: { type: String, require: true },
    email: { type: String, require: true },
    password: { type: String },
    friends: { type: Array, default: [] },
    desc: { type: String },
    prefecture: { type: String, require: true },
    birthday: { type: String },
    iconImage: { type: String },
    homeImage: { type: String },
    isAdmin: { type: String, default: false },
  },
  { timestamp: true }
);

module.exports = mongoose.model('User', UserSchema);
