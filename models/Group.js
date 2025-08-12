// models/Group.js
const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  title: { type: String, required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  autoDelete: { type: Boolean, default: false },
  autoDeleteAt: { type: Date, default: null },
  contentTypes: [{ type: String, enum: ['text', 'voice', 'media', 'documents', 'attachments'] }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Group', groupSchema);
