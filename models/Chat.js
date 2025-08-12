const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    participants: [{ type: String, required: true }], // mobile numbers
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Chat', chatSchema);
