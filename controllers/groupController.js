// Get all groups for a particular mobile number
exports.getGroupList = async (req, res) => {
  const { mobile } = req.body;
  if (!mobile) {
    return res.status(400).json({ message: 'mobile is required.' });
  }
  try {
    // Find user by mobile
    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    // Find groups where this user is a participant
    const groups = await Group.find({ participants: user._id }).populate('participants', 'mobile name');
    // Return groups with participants as mobile numbers
    const groupList = groups.map(group => ({
      ...group.toObject(),
      participants: group.participants.map(p => p.mobile)
    }));
    res.json({ groups: groupList });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching group list', error: err.message });
  }
};
// For Socket.io: save group message and return message object
exports.sendGroupMessageSocket = async (data) => {
  const { groupId, sender, content, messageType } = data;
  if (!groupId || !sender || !content) {
    throw new Error('groupId, sender, and content are required.');
  }
  const group = await Group.findById(groupId).populate('participants', 'mobile');
  if (!group) throw new Error('Group not found');
  // Check sender is in group participants by mobile
  const isSenderParticipant = group.participants.some(p => p.mobile === sender);
  if (!isSenderParticipant) {
    throw new Error('Sender is not a participant of this group.');
  }
  // Find sender user by mobile
  const senderUser = await User.findOne({ mobile: sender });
  if (!senderUser) {
    throw new Error('Sender user not found.');
  }
  const message = new GroupMessage({
    groupId: group._id,
    sender: senderUser._id,
    content,
    messageType: messageType || 'text'
  });
  await message.save();
  return message;
};
const GroupMessage = require('../models/GroupMessage');
// Send a message to a group
exports.sendGroupMessage = async (req, res) => {
//   const {  } = req.par;
  const { groupId, sender, content, messageType } = req.body;
  if (!groupId || !sender || !content) {
    return res.status(400).json({ message: 'groupId, sender, and content are required.' });
  }
  try {
    const group = await Group.findById(groupId).populate('participants', 'mobile');
    if (!group) return res.status(404).json({ message: 'Group not found' });
    // Check sender is in group participants by mobile
    const isSenderParticipant = group.participants.some(p => p.mobile === sender);
    if (!isSenderParticipant) {
      return res.status(403).json({ message: 'Sender is not a participant of this group.' });
    }
    // Find sender user by mobile
    const senderUser = await User.findOne({ mobile: sender });
    if (!senderUser) {
      return res.status(400).json({ message: 'Sender user not found.' });
    }
    const message = new GroupMessage({
      groupId: group._id,
      sender: senderUser._id,
      content,
      messageType: messageType || 'text'
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

// Create a new group (participants as mobile numbers)
exports.createGroup = async (req, res) => {
  let { title, participants, autoDelete, autoDeleteAt, contentTypes } = req.body;
  // Robustly parse participants if sent as a string
  if (typeof participants === 'string') {
    try {
      participants = JSON.parse(participants);
    } catch (e) {
      return res.status(400).json({ message: 'Invalid participants format.' });
    }
  }
  if (!title || !participants || !Array.isArray(participants) || participants.length < 2) {
    return res.status(400).json({ message: 'Group title and at least 2 participants are required.' });
  }
  try {
    // Find user ObjectIds for all participant mobile numbers
    const users = await User.find({ mobile: { $in: participants } });
    if (users.length !== participants.length) {
      return res.status(400).json({ message: 'One or more participant mobile numbers are invalid.' });
    }
    const userIds = users.map(u => u._id);
    const group = new Group({
      title,
      participants: userIds,
      autoDelete: autoDelete || false,
      autoDeleteAt: autoDeleteAt || null,
      contentTypes: contentTypes || ['text', 'voice', 'media', 'documents', 'attachments']
    });
    await group.save();
    // Populate participants with mobile numbers for response
    const populatedGroup = await Group.findById(group._id).populate('participants', 'mobile name');
    // Convert participants to array of mobile numbers
    const participantMobiles = populatedGroup.participants.map(p => p.mobile);
    // Return group with participants as mobile numbers
    res.status(201).json({
      message: 'Group created successfully',
      group: {
        ...populatedGroup.toObject(),
        participants: participantMobiles
      }
    });
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
