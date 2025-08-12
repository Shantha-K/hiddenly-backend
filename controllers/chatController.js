// Reusable function to save instant message (for REST and Socket.io)
exports.saveInstantMessageToDB = async ({ chatId, content, senderMobile }) => {
  if (!chatId || !content || !senderMobile) {
    throw new Error('chatId, content, and senderMobile are required.');
  }
  // Find chat and participants
  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new Error('Chat not found.');
  }
  // Infer receiver: the other participant
  let receiverMobile = chat.participants.find(mobile => mobile !== senderMobile);
  const message = new Message({
    chatId,
    senderMobile,
    receiverMobile,
    messageType: 'text',
    content,
    hideAfter: null
  });
  await message.save();
  return message;
};

// Save instant socket.io message to DB (REST API)
exports.saveInstantMessage = async (req, res) => {
  const { chatId, content, senderMobile } = req.body;
  if (!chatId || !content || !senderMobile) {
    return res.status(400).json({ message: 'chatId, content, and senderMobile are required.' });
  }
  try {
    const message = await exports.saveInstantMessageToDB({ chatId, content, senderMobile });
    res.status(201).json({ message: 'Instant message saved', data: message });
  } catch (err) {
    res.status(500).json({ message: 'Error saving instant message', error: err.message });
  }
};
// Get chat history between sender and receiver for a chatId
// exports.getChatHistory = async (req, res) => {
//   const { chatId, sender, receiver } = req.body;
//   if (!chatId || !sender || !receiver) {
//     return res.status(400).json({ message: 'chatId, sender, and receiver are required in body.' });
//   }
//   try {
//     const messages = await Message.find({
//       chatId,
//       $or: [
//         { senderMobile: sender, receiverMobile: receiver },
//         { senderMobile: receiver, receiverMobile: sender }
//       ]
//     }).sort({ createdAt: 1 });
//     res.status(200).json({ chathistory: messages });
//   } catch (err) {
//     res.status(500).json({ message: 'Error fetching chat history', error: err.message });
//   }
// };

exports.getChatHistory = async (req, res) => {
  const { chatId, sender, receiver } = req.body;
  if (!chatId || !sender || !receiver) {
    return res.status(400).json({ message: 'chatId, sender, and receiver are required in body.' });
  }
  try {
    const messages = await Message.find({
      chatId,
      $or: [
        { senderMobile: sender, receiverMobile: receiver },
        { senderMobile: receiver, receiverMobile: sender }
      ]
    }).sort({ createdAt: 1 });
    res.json({ chathistory: messages });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching chat history', error: err.message });
  }
};
const Message = require('../models/Message');
const User = require('../models/User');
const Chat = require('../models/Chat');

// Get chat list for a user
exports.getChatList = async (req, res) => {
  const { mobile } = req.body;
  if (!mobile) {
    return res.status(400).json({ message: 'mobile is required in body.' });
  }
  try {
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderMobile: mobile },
            { receiverMobile: mobile }
          ]
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$senderMobile", mobile] },
              "$receiverMobile",
              "$senderMobile"
            ]
          },
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $eq: ["$receiverMobile", mobile] },
                    { $ne: ["$status", "seen"] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "mobile",
          as: "userDetails"
        }
      },
      {
        $project: {
          mobile: "$_id",
          name: { $arrayElemAt: ["$userDetails.name", 0] },
          lastMessage: 1,
          unreadCount: 1
        }
      }
    ]);
    res.json({ chats: messages });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching chat list', error: err.message });
  }
};

// Get messages between two users
exports.getMessages = async (req, res) => {
  const { mobile, otherMobile } = req.body;
  if (!mobile || !otherMobile) {
    return res.status(400).json({ message: 'mobile and otherMobile are required in body.' });
  }
  try {
    const messages = await Message.find({
      $or: [
        { senderMobile: mobile, receiverMobile: otherMobile },
        { senderMobile: otherMobile, receiverMobile: mobile }
      ]
    }).sort({ createdAt: 1 });
    const otherUser = await User.findOne({ mobile: otherMobile }, 'name mobile');
    res.json({ messages, user: otherUser });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching messages', error: err.message });
  }
};

// Send a new message
exports.sendMessage = async (req, res) => {
  const { chatId, content, messageType, duration, senderMobile } = req.body;
  if (!chatId || !content || !messageType || !senderMobile) {
    return res.status(400).json({ message: 'chatId, content, messageType, and senderMobile are required.' });
  }
  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    const receiverMobile = chat.participants.find(mobile => mobile !== senderMobile);
    if (!receiverMobile) {
      return res.status(400).json({ message: 'Receiver not found in chat.' });
    }
    const message = new Message({
      chatId,
      senderMobile,
      receiverMobile,
      messageType,
      content,
      duration,
      hideAfter: null
    });
    await message.save();
    res.status(201).json({ message: 'Message sent successfully', data: message });
  } catch (err) {
    res.status(500).json({ message: 'Error sending message', error: err.message });
  }
};

// Start a chat between two users and return chatId
exports.startChat = async (req, res) => {
  const { sender, receiver } = req.body;
  if (!sender || !receiver) {
    return res.status(400).json({ message: 'Sender and receiver are required.' });
  }
  try {
    // Check if chat already exists
    let chat = await Chat.findOne({
      participants: { $all: [sender, receiver] }
    });
    if (!chat) {
      chat = new Chat({
        participants: [sender, receiver]
      });
      await chat.save();
    }
    return res.status(200).json({ chatId: chat._id });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};
// Update message status (delivered/seen)
exports.updateMessageStatus = async (req, res) => {
  const { messageId } = req.params;
  const { status } = req.body;

  try {
    const message = await Message.findByIdAndUpdate(
      messageId,
      { status },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json({ message: 'Status updated successfully', data: message });
  } catch (err) {
    res.status(500).json({ message: 'Error updating status', error: err.message });
  }
};

// Set chat settings (disappearing messages)
exports.setChatSettings = async (req, res) => {
  const { userId } = req.params;
  const { hours, minutes, seconds, currentUserId } = req.body;
  if (!currentUserId) {
    return res.status(400).json({ message: 'currentUserId is required in body.' });
  }
  try {
    const hideAfter = (hours * 60) + minutes + (seconds / 60);
    await Message.updateMany(
      {
        $or: [
          { sender: currentUserId, receiver: userId },
          { sender: userId, receiver: currentUserId }
        ],
        createdAt: { $gte: new Date() }
      },
      { hideAfter }
    );
    res.json({ message: 'Chat settings updated successfully', settings: { hours, minutes, seconds } });
  } catch (err) {
    res.status(500).json({ message: 'Error updating chat settings', error: err.message });
  }
};

// Delete expired messages
exports.deleteExpiredMessages = async () => {
  try {
    const messages = await Message.find({ hideAfter: { $ne: null } });
    
    for (const message of messages) {
      const expiryTime = new Date(message.createdAt);
      expiryTime.setMinutes(expiryTime.getMinutes() + message.hideAfter);
      
      if (new Date() >= expiryTime) {
        await Message.deleteOne({ _id: message._id });
      }
    }
  } catch (err) {
    console.error('Error deleting expired messages:', err);
  }
};
