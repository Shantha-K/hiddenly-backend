const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toString(),
  },
  mobile: {
    type: String,
    required: true,
    unique: true,
  },
  deviceId: {
    type: String,
    required: false,
    default: null,
  },
  otp: {
    type: String,
    required: false,
  },
  otpExpires: {
    type: Date,
    required: false,
  }
});

module.exports = mongoose.model('User', UserSchema);
