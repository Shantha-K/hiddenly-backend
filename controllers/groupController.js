const GroupMessage = require('../models/GroupMessage');
// Send a message to a group
exports.sendGroupMessage = async (req, res) => {
//   const {  } = req.par;
  const { groupId,sender, content, messageType } = req.body;
  if (!groupId || !sender || !content) {
    return res.status(400).json({ message: 'groupId, sender, and content are required.' });
  }
  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!group.participants.includes(sender)) {
      return res.status(403).json({ message: 'Sender is not a participant of this group.' });
    }
    const message = new GroupMessage({
      groupId,
      sender,
      content,
      messageType: messageType || ['text', 'voice', 'media', 'documents', 'attachments']
    });
    await message.save();
    res.status(201).json({ message: 'Message sent', data: message });
  } catch (err) {
    res.status(500).json({ message: 'Error sending group message', error: err.message });
  }
};

// Get all messages for a group
exports.getGroupMessages = async (req, res) => {
  const { groupId,sender } = req.body;
  if (!groupId && !sender) {
    return res.status(400).json({ message: 'groupId and senderMobile required.' });
  }
  try {
    const messages = await GroupMessage.find({ groupId }).populate('sender', 'name mobile').sort({ createdAt: 1 });
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching group messages', error: err.message });
  }
};
// controllers/groupController.js
// APIs for group creation, group settings, and group content customization

const Group = require('../models/Group');
const User = require('../models/User');

// Create a new group
exports.createGroup = async (req, res) => {
  const { title, participants, autoDelete, autoDeleteAt, contentTypes } = req.body;
  if (!title || !participants || participants.length < 2) {
    return res.status(400).json({ message: 'Group title and at least 2 participants are required.' });
  }
  try {
    const group = new Group({
      title,
      participants,
      autoDelete: autoDelete || false,
      autoDeleteAt: autoDeleteAt || null,
      contentTypes: contentTypes || ['text', 'voice', 'media', 'documents', 'attachments']
    });
    await group.save();
    res.status(201).json({ message: 'Group created successfully', group });
  } catch (err) {
    res.status(500).json({ message: 'Error creating group', error: err.message });
  }
};

// Update group settings (auto delete, content customization)
exports.updateGroupSettings = async (req, res) => {
//   const { groupId } = req.params;
  const { groupId,autoDelete, autoDeleteAt, contentTypes } = req.body;
  try {
    const group = await Group.findByIdAndUpdate(
      groupId,
      {
        autoDelete,
        autoDeleteAt,
        contentTypes,
      },
      { new: true }
    );
    if (!group) return res.status(404).json({ message: 'Group not found' });
    res.json({ message: 'Group settings updated', group });
  } catch (err) {
    res.status(500).json({ message: 'Error updating group', error: err.message });
  }
};

// Get group details
exports.getGroup = async (req, res) => {
  const { groupId } = req.body;
  try {
    const group = await Group.findById(groupId).populate('participants', 'name mobile');
    if (!group) return res.status(404).json({ message: 'Group not found' });
    res.json({ group });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching group', error: err.message });
  }
};

// Delete group
exports.deleteGroup = async (req, res) => {
  const { groupId } = req.body;
  try {
    const group = await Group.findByIdAndDelete(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    res.json({ message: 'Group deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting group', error: err.message });
  }
};

// Report group
exports.reportGroup = async (req, res) => {
//   const {  } = req.params;
  const { groupId,reason } = req.body;
  // You can implement reporting logic here (e.g., save to a reports collection)
  res.json({ message: 'Group reported', groupId, reason });
};
