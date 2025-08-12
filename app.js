const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });



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

  socket.on('joinChat', (chatId) => {
    socket.join(chatId);
  });

  // Instant message event
  socket.on('sendMessage', async (data) => {
    // data: { chatId, content, senderMobile }
    try {
      const message = await chatController.saveInstantMessageToDB(data);
      io.to(data.chatId).emit('receiveMessage', message);
    } catch (err) {
      socket.emit('errorMessage', { message: err.message });
    }
  });

  // Add more events as needed
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
