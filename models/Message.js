const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderMobile: {
    type: String,
    required: true,
    ref: 'User'
  },
  receiverMobile: {
    type: String,
    required: true,
    ref: 'User'
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'video', 'audio'],
    required: true
  },
  content: {
    type: String,
    required: true // For text messages or media URLs
  },
  duration: { // For audio/video
    type: String
  },
  hideAfter: { // Time in minutes after which message should disappear
    type: Number,
    default: null
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'seen'],
    default: 'sent'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Message', messageSchema);
