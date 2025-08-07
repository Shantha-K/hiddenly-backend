const Qr = require('../models/Qr');
const QRCode = require('qrcode');

// Generate QR code from text and email
exports.generateQr = async (req, res) => {
  const { email, qrText } = req.body;
  if (!email || !qrText) {
    return res.status(400).json({ message: 'Email and QR text are required.' });
  }
  try {
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
