const Message = require('../models/Message');
const User = require('../models/User');

// Get chat list for a user
exports.getChatList = async (req, res) => {
  const currentUserMobile = req.user.mobile; // From auth middleware

  try {
    // Find all messages where user is either sender or receiver
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderMobile: currentUserMobile },
            { receiverMobile: currentUserMobile }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$senderMobile", currentUserMobile] },
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
                    { $eq: ["$receiverMobile", currentUserMobile] },
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
  const { mobile } = req.params; // Mobile number of the other user
  const currentUserMobile = req.user.mobile; // From auth middleware

  try {
    const messages = await Message.find({
      $or: [
        { senderMobile: currentUserMobile, receiverMobile: mobile },
        { senderMobile: mobile, receiverMobile: currentUserMobile }
      ]
    })
    .sort({ createdAt: 1 });

    // Get user details
    const otherUser = await User.findOne({ mobile }, 'name mobile');

    res.json({ 
      messages,
      user: otherUser
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching messages', error: err.message });
  }
};

// Send a new message
exports.sendMessage = async (req, res) => {
  const { receiverMobile, messageType, content, duration } = req.body;
  const senderMobile = req.user.mobile; // From auth middleware

  try {
    // Check if receiver exists
    const receiver = await User.findOne({ mobile: receiverMobile });
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    const message = new Message({
      senderMobile,
      receiverMobile,
      messageType,
      content,
      duration,
      hideAfter: null // Will be set by chat settings
    });

    await message.save();
    
    res.status(201).json({ 
      message: 'Message sent successfully',
      data: message
    });
  } catch (err) {
    res.status(500).json({ message: 'Error sending message', error: err.message });
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
  const { hours, minutes, seconds } = req.body;
  const currentUserId = req.user._id;

  try {
    // Convert time to minutes for storage
    const hideAfter = (hours * 60) + minutes + (seconds / 60);

    // Update all future messages between these users to have this setting
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

    res.json({ 
      message: 'Chat settings updated successfully',
      settings: { hours, minutes, seconds }
    });
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
