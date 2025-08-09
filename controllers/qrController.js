const Qr = require('../models/Qr');
const QRCode = require('qrcode');
const Jimp = require('jimp');
const QrReader = require('qrcode-reader');
const User = require('../models/User');

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

// Scan and validate QR code
exports.validateQr = async (req, res) => {
  try {
    console.log('Starting QR code validation...');
    
    // Handle uploaded file via multer or base64 string
    if (!req.file && !req.body.qrCodeBase64) {
      return res.status(400).json({ 
        success: false, 
        message: 'QR image file or base64 is required.' 
      });
    }

    let inputData;
    
    if (req.file) {
      console.log('Processing uploaded file...');
      inputData = req.file.buffer;
    } else {
      console.log('Processing base64 data...');
      try {
        let base64Data = req.body.qrCodeBase64;
        console.log('Received base64 length:', base64Data ? base64Data.length : 0);

        // Handle different base64 formats
        if (!base64Data) {
          throw new Error('No base64 data provided');
        }

        // Clean up the base64 string
        if (base64Data.includes(',')) {
          // Handle data URI format
          base64Data = base64Data.split(',')[1];
        }
        
        // Remove any whitespace
        base64Data = base64Data.replace(/\s/g, '');
        
        if (base64Data.length % 4 !== 0) {
          // Add padding if needed
          base64Data += '='.repeat(4 - (base64Data.length % 4));
        }

        console.log('Processing base64 of length:', base64Data.length);
        inputData = Buffer.from(base64Data, 'base64');
        console.log('Converted to buffer of size:', inputData.length);

        if (inputData.length === 0) {
          throw new Error('Decoded buffer is empty');
        }
      } catch (error) {
        console.error('Base64 processing error:', error);
        return res.status(400).json({
          success: false,
          message: 'Invalid base64 image data. Please ensure you are sending a valid base64 encoded image.'
        });
      }
    }

    // Read the image using Jimp
    console.log('Reading image with Jimp...');
    let image;
    try {
      image = await Jimp.read(inputData);
      
      // Basic image validation
      if (image.bitmap.width === 0 || image.bitmap.height === 0) {
        throw new Error('Invalid image dimensions');
      }
      
      console.log('Image loaded successfully:', {
        width: image.bitmap.width,
        height: image.bitmap.height,
        format: image.getMIME()
      });
    } catch (error) {
      console.error('Error reading image with Jimp:', error);
      return res.status(400).json({
        success: false,
        message: 'Unable to process image. Please ensure you are sending a valid QR code image.'
      });
    }
    
    // Create QR code reader instance
    const qrReader = new QrReader();
    
    // Decode QR code
    const qrResult = await new Promise((resolve, reject) => {
      try {
        console.log('Starting QR code decode...');
        const qrReader = new QrReader();
        
        qrReader.callback = function(err, value) {
          if (err) {
            console.error('QR code reading error:', err);
            reject(new Error('Failed to read QR code from image'));
            return;
          }
          
          if (!value || !value.result) {
            console.log('No QR code data found in image');
            reject(new Error('No QR code found in image'));
            return;
          }
          
          console.log('Successfully read QR code:', value.result);
          resolve(value);
        };
        
        console.log('Attempting to decode QR code...');
        qrReader.decode(image.bitmap);
      } catch (err) {
        console.error('Error in QR decoding process:', err);
        reject(new Error('Error processing QR code'));
      }
    }).catch(error => {
      console.error('QR code reading failed:', error);
      throw error;
    });

    if (!qrResult || !qrResult.result) {
      return res.status(400).json({
        success: false,
        message: 'No valid QR code found in image'
      });
    }

    const decodedText = qrResult.result;
    console.log('Successfully decoded QR text:', decodedText);

    // Find QR in database
    const qrInDb = await Qr.findOne({ qrText: decodedText });
    if (!qrInDb) {
      return res.status(404).json({
        success: false,
        message: 'QR code not found in our records'
      });
    }

    // Return success with QR details
    return res.status(200).json({
      success: true,
      message: 'QR code validated successfully',
      data: {
        email: qrInDb.email,
        qrText: qrInDb.qrText,
        validatedAt: new Date().toISOString()
      }
    });

  } catch (err) {
    console.error('Validation error:', err);
    return res.status(400).json({
      success: false,
      message: err.message || 'Unable to process QR code'
    });
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
