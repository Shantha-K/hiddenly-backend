// Sample Socket.io client test script for Node.js
// Usage: node test-socket.js

const { io } = require('socket.io-client');

const SOCKET_URL = 'http://localhost:6000';
const socket = io(SOCKET_URL, {
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log('Connected to Socket.io server:', socket.id);
  // Join a chat room (replace with a real chatId if needed)
  socket.emit('joinChat', 'testChatRoom');
  // Send a test message (replace chatId and senderMobile as needed)
  socket.emit('saveInstantMessage', {
    chatId: '689aeefa1d58e49e8f18a2ed',
    content: 'Hello from test script!',
    senderMobile: '9788683381'
  });
});

socket.on('receiveMessage', (msg) => {
  console.log('Received message:', msg);
});

socket.on('errorMessage', (err) => {
  console.error('Error from server:', err);
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});