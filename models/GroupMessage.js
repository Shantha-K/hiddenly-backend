// models/GroupMessage.js
const mongoose = require('mongoose');

const groupMessageSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  messageType: { type: String, enum: ['text', 'media', 'voice', 'document', 'attachment'], default: 'text' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GroupMessage', groupMessageSchema);
