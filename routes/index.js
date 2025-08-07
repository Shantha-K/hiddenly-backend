const express = require('express');
const router = express.Router();

const appInfoController = require('../controllers/appInfoController');
const userController = require('../controllers/userController');
const qrController = require('../controllers/qrController');

// Splash screen app info
router.get('/app-info', appInfoController.getAppInfo);
router.post('/app-info', appInfoController.setAppInfo);

// User sign-in and OTP
router.post('/sign-in', userController.signIn);
router.post('/verify-otp', userController.verifyOtp);

// Resend OTP
router.post('/resend-otp', userController.resendOtp);

// QR code APIs
router.post('/generate-qr', qrController.generateQr);
router.get('/get-qr', qrController.getQrByEmail);

module.exports = router;
