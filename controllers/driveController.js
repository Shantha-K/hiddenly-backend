const drive = require('../utils/uploadToDrive');

// Get Google Drive auth URL
exports.getAuthUrl = async (req, res) => {
  try {
    const url = await drive.getAuthUrl();
    res.json({ authUrl: url });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error generating auth URL',
      error: error.message 
    });
  }
};

// Handle Google OAuth callback
exports.handleCallback = async (req, res) => {
  const { code } = req.body;
  
  try {
    const tokens = await drive.setCredentials(code);
    res.json({ 
      message: 'Authentication successful',
      tokens 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error handling callback',
      error: error.message 
    });
  }
};

// Upload file to Google Drive
exports.uploadFile = async (req, res) => {
  const { fileBuffer, fileName, mimeType } = req.body;
  const accessToken = req.headers.authorization?.split(' ')[1];

  if (!accessToken) {
    return res.status(401).json({ message: 'Access token is required' });
  }

  try {
    const result = await drive.uploadFile(fileBuffer, fileName, mimeType, accessToken);
    res.json({
      message: 'File uploaded successfully',
      fileId: result.fileId,
      webViewLink: result.webViewLink
    });
  } catch (error) {
    if (error.message.includes('invalid_grant') || error.message.includes('Invalid Credentials')) {
      res.status(401).json({ 
        message: 'Invalid or expired access token',
        error: error.message 
      });
    } else {
      res.status(500).json({ 
        message: 'Error uploading file',
        error: error.message 
      });
    }
  }
};

// Refresh access token
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token is required' });
  }

  try {
    const credentials = await drive.refreshAccessToken(refreshToken);
    res.json({ 
      message: 'Token refreshed successfully',
      credentials 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error refreshing token',
      error: error.message 
    });
  }
};
