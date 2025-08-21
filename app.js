// const express = require('express');
// const cors = require('cors');
// const http = require('http');
// const connectDB = require('./config/db');

// const app = express();
// const server = http.createServer(app);

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Additional headers for Google Drive API
// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Credentials', 'true');
//   res.header('Access-Control-Expose-Headers', 'Content-Disposition');
//   next();
// });

// // Connect to MongoDB
// connectDB();

// // Routes
// app.use('/api', require('./routes/index'));

//   const { getIO, initIO } = require('./socket');
// // Initialize custom socket.io logic
// const socket = require('./socket');
// const httpServer = createServer(app);
//   initIO(httpServer)
// socket.initIO(server);

// const PORT = process.env.PORT || 5000;
// server.listen(PORT, '0.0.0.0', () => {
//   console.log(`REST API and Socket.io server running on port ${PORT}`);
// });

// getIO();

const express = require('express');
const cors = require('cors');
const http = require('http');
const connectDB = require('./config/db');
const { initIO, getIO } = require('./socket');

const app = express();
const server = http.createServer(app);

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

// Initialize Socket.IO (✅ Only once)
initIO(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`REST API and Socket.io server running on port ${PORT}`);
});

// Example: safely get IO instance later
getIO();
