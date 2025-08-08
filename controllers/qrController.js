const Qr = require('../models/Qr');
const QRCode = require('qrcode');

// Generate QR code from text and email
exports.generateQr = async (req, res) => {
  const { email, qrText } = req.body;
  if (!email || !qrText) {
    return res.status(400).json({ message: 'Email and QR text are required.' });
  }
  try {
    // Check if QR already exists for email
    const existingQr = await Qr.findOne({ email });
    if (existingQr) {
      return res.status(409).json({ message: 'QR code already exists for this email.' });
    }
    // Generate QR code as base64
    const qrCode = await QRCode.toDataURL(qrText);
    const qr = new Qr({ email, qrText, qrCode });
    await qr.save();
    res.json({ message: 'QR code generated', qrCode, qr });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get QR code by email
exports.getQrByEmail = async (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }
  try {
    const qr = await Qr.findOne({ email });
    if (!qr) {
      return res.status(404).json({ message: 'QR code not found.' });
    }
    res.json({ qrCode: qr.qrCode, qr });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Scan QR code (accepts qrText and returns decoded text)
exports.scanQr = async (req, res) => {
  const { qrText } = req.body;
  if (!qrText) {
    return res.status(400).json({ message: 'QR text is required.' });
  }
  try {
    // For demo, just return the text. In real use, decode image or base64 if needed.
    res.json({ message: 'QR code scanned', decodedText: qrText });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all QR codes
exports.getAllQr = async (req, res) => {
  try {
    const qrs = await Qr.find();
    res.json({ qrs });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get QR code by userId
exports.getQrByUserId = async (req, res) => {
  const { _id } = req.query;
  if (!_id) {
    return res.status(400).json({ message: 'User ID is required.' });
  }
  try {
    const qr = await Qr.findOne({ _id });
    if (!qr) {
      return res.status(404).json({ message: 'QR code not found.' });
    }
    res.json({ qrCode: qr.qrCode, qr });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
