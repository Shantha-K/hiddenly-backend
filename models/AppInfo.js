const mongoose = require('mongoose');

const AppInfoSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  logo: {
    type: String, // URL or path to logo image
    required: false,
  },
  description: {
    type: String,
    required: false,
  }
});

module.exports = mongoose.model('AppInfo', AppInfoSchema);
