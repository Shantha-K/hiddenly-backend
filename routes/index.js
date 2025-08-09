const express = require('express');
const router = express.Router();
const multer = require('multer');

// Configure multer for handling file uploads
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

const appInfoController = require('../controllers/appInfoController');
const userController = require('../controllers/userController');
const qrController = require('../controllers/qrController');
const contactController = require('../controllers/contact');
const chatController = require('../controllers/chatController');
const driveController = require('../controllers/driveController');

// Contact APIs
router.get('/contacts', contactController.getAllContacts);
router.get('/contacts/:contactId', contactController.getContactById);
router.post('/contacts', contactController.addContact);
router.get('/contacts/search', contactController.searchContacts);
router.post('/contacts/check-exist', contactController.checkContactsExist);

// Splash screen app info
router.get('/app-info', appInfoController.getAppInfo);
router.post('/app-info', appInfoController.setAppInfo);

// User sign-in and OTP
router.post('/sign-in', userController.signIn);
router.post('/sign-up', userController.signUp);
router.post('/verify-otp', userController.verifyOtp);

// Resend OTP
router.post('/resend-otp', userController.resendOtp);

// QR code APIs
router.post('/generate-qr', qrController.generateQr);
router.post('/get-qr', qrController.getQrByUserId);
router.get('/get-all-qr', qrController.getAllQr);
router.get('/getAllUser', userController.getAllUsers);
router.post('/validate-qr', upload.single('file'), qrController.validateQr);

// Google Drive Integration APIs
router.get('/drive/auth', driveController.getAuthUrl);
router.post('/drive/callback', driveController.handleCallback);
router.post('/drive/upload', driveController.uploadFile);
router.post('/drive/refresh-token', driveController.refreshToken);

const auth = require('../middleware/auth');

// Chat APIs (protected with auth middleware)
router.get('/chats', auth, chatController.getChatList); // Get all chats
router.get('/chat/:mobile', auth, chatController.getMessages); // Get messages with specific user
router.post('/chat/message', auth, chatController.sendMessage);
router.patch('/chat/message/:messageId/status', auth, chatController.updateMessageStatus);
router.post('/chat/:mobile/settings', auth, chatController.setChatSettings);

module.exports = router;
