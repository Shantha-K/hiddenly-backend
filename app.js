const groupController = require('./controllers/groupController');
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db');

const app = express();
// REST API server
const apiServer = http.createServer(app);

// Socket.io server (separate port)
const socketServer = http.createServer();
const io = socketIo(socketServer, { cors: { origin: '*' } });



// Middleware
app.use(cors());
app.use(express.json());

// Additional headers for Google Drive API
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Expose-Headers', 'Content-Disposition');
  next();
});

// Connect to MongoDB
connectDB();

// Routes
app.use('/api', require('./routes/index'));


// Socket.io instant messaging with DB persistence

const chatController = require('./controllers/chatController');
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  const Chat = require('./models/Chat');
  socket.on('joinChat', async (chatId) => {
    try {
      const chat = await Chat.findById(chatId);
      if (!chat) {
        socket.emit('errorMessage', { message: 'Invalid chatId. Chat not found.' });
        return;
      }
      socket.join(chatId);
    } catch (err) {
      socket.emit('errorMessage', { message: 'Error validating chatId.' });
    }
  });

  // Instant message event
  socket.on('saveInstantMessage', async (data) => {
    // data: { chatId, content, senderMobile }
    try {
      const message = await chatController.saveInstantMessageToDB(data);
      io.to(data.chatId).emit('receiveMessage', message);
    } catch (err) {
      socket.emit('errorMessage', { message: err.message });
    }
  });

  // Add more events as needed
  // Group chat: join group room
  socket.on('joinGroup', (groupId) => {
    socket.join(groupId);
  });

  // Group chat: send message
  socket.on('sendGroupMessage', async (data) => {
    // data: { groupId, sender, content, messageType }
    try {
      const message = await groupController.sendGroupMessageSocket(data);
      io.to(data.groupId).emit('receiveGroupMessage', message);
    } catch (err) {
      socket.emit('errorMessage', { message: err.message });
    }
  });
});


// Start REST API server
const API_PORT = process.env.API_PORT || 5000;
apiServer.listen(API_PORT, '0.0.0.0', () => {
  console.log(`REST API server running on port ${API_PORT}`);
});

// Start Socket.io server
const SOCKET_PORT = process.env.SOCKET_PORT || 3000;
socketServer.listen(SOCKET_PORT, '0.0.0.0', () => {
  console.log(`Socket.io server running on port ${SOCKET_PORT}`);
});
