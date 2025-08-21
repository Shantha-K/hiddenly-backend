const User = require('../models/User');

// Helper to generate a 6-digit OTP
function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Sign in: generate OTP and save device
const { v4: uuidv4 } = require('uuid');

exports.signUp = async (req, res) => {
  console.log("api hit in browser");
  const { mobile, deviceId, name } = req.body;
  if (!mobile) {
    return res.status(400).json({ message: 'Mobile is required.' });
  }
  try {
    let user = await User.findOne({ mobile });
    if (user) {
      return res.status(409).json({ message: 'User already exists.' });
    }
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry
    let finalDeviceId = deviceId || uuidv4();
    user = new User({ mobile, deviceId: finalDeviceId, otp, otpExpires, name });
    const savedata = await user.save();
    console.log("savedata==>",savedata)
    // TODO: Send OTP via SMS provider here
    res.json({ message: 'OTP sent', otp, deviceId: finalDeviceId, name }); // For demo, return OTP, deviceId, name
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Verify OTP
// const jwt = require('jsonwebtoken');

exports.verifyOtp = async (req, res) => {
  const { mobile, otp } = req.body;
  if (!mobile || !otp) {
    return res.status(400).json({ message: 'Mobile and OTP are required.' });
  }
  // Ensure OTP is exactly 4 digits
  if (!/^\d{4}$/.test(otp)) {
    return res.status(400).json({ message: 'OTP must be a 4-digit number.' });
  }
  try {
    const user = await User.findOne({ mobile });
    if (!user || user.otp !== otp || user.otpExpires < new Date()) {
      return res.status(401).json({ message: 'Invalid or expired OTP.' });
    }
    
  // JWT token generation removed
    
    // Clear OTP
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.json({ 
      message: 'Sign in successful', 
      user: {
        id: user._id,
        name: user.name,
        mobile: user.mobile
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Resend OTP
exports.resendOtp = async (req, res) => {
  const { mobile } = req.body;
  if (!mobile) {
    return res.status(400).json({ message: 'Mobile is required.' });
  }
  try {
    let user = await User.findOne({ mobile });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();
    // TODO: Send OTP via SMS provider here
    res.json({ message: 'OTP resent', otp }); // For demo, return OTP
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Sign in: check if user exists by mobile and generate OTP for login
exports.signIn = async (req, res) => {
  const { mobile } = req.body;
  if (!mobile) {
    return res.status(400).json({ message: 'Mobile is required.' });
  }
  try {
    const user = await User.findOne({ mobile });
    if (user) {
      // Generate OTP for login
      const otp = generateOTP();
      const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();
      // TODO: Send OTP via SMS provider here
      res.json({ message: 'OTP sent for login', otp, userId: user.userId }); // For demo, return OTP and userId
    } else {
      res.status(404).json({ message: 'User not found.' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all users
exports.logout = (req, res) => {
  // If using cookies for JWT
  res.clearCookie('token');
  return res.status(200).json({ message: 'Logged out successfully' });
};
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('name mobile deviceId otp otpExpires userId');
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
