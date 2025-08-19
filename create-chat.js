// Script to create a chat and print the chatId for testing
// Usage: node create-chat.js

const axios = require('axios');

const API_URL = 'http://localhost:5000/api/chat/start';

// Replace with two real mobile numbers from your users collection
const sender = '9788683381';
const receiver = '8524930080';

axios.post(API_URL, { sender, receiver })
  .then(res => {
    console.log('Chat created! chatId:', res.data.chatId);
  })
  .catch(err => {
    if (err.response) {
      console.error('Error:', err.response.data);
    } else {
      console.error('Error:', err.message);
    }
  });
