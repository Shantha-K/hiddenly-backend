const mongoose = require('mongoose');

const QrSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  qrText: {
    type: String,
    required: true,
  },
  qrCode: {
    type: String, // base64 or image URL
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Qr', QrSchema);
