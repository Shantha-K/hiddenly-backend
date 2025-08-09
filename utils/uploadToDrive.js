const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

// Google Drive API configuration
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const CREDENTIALS_PATH = path.join(__dirname, '../config/credentials.json');

let auth = null;

// Initialize the Google Drive API client
const initializeGoogleDrive = async () => {
  try {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    const { client_id, client_secret, redirect_uris } = credentials.web;

    auth = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );

    return auth;
  } catch (error) {
    console.error('Error initializing Google Drive:', error);
    throw error;
  }
};

// Generate authentication URL
const getAuthUrl = async () => {
  if (!auth) {
    await initializeGoogleDrive();
  }
  return auth.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
};

// Set credentials using the code received from frontend
const setCredentials = async (code) => {
  try {
    if (!auth) {
      await initializeGoogleDrive();
    }
    const { tokens } = await auth.getToken(code);
    auth.setCredentials(tokens);
    return tokens;
  } catch (error) {
    console.error('Error setting credentials:', error);
    throw error;
  }
};

// Upload file to Google Drive
const uploadFile = async (fileBuffer, fileName, mimeType, accessToken) => {
  try {
    if (!auth) {
      await initializeGoogleDrive();
    }

    // Set the access token
    auth.setCredentials({
      access_token: accessToken
    });

    const drive = google.drive({ version: 'v3', auth });

    const fileMetadata = {
      name: fileName,
      parents: ['root'] // Upload to root folder
    };

    const media = {
      mimeType,
      body: fs.createReadStream(fileBuffer)
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink'
    });

    return {
      fileId: response.data.id,
      webViewLink: response.data.webViewLink
    };
  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    throw error;
  }
};

// Refresh access token
const refreshAccessToken = async (refreshToken) => {
  try {
    if (!auth) {
      await initializeGoogleDrive();
    }
    auth.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await auth.refreshAccessToken();
    return credentials;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw error;
  }
};

module.exports = {
  getAuthUrl,
  setCredentials,
  uploadFile,
  refreshAccessToken
};
