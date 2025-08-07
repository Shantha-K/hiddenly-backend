const AppInfo = require('../models/AppInfo');

// Get app info (for splash screen)
exports.getAppInfo = async (req, res) => {
  try {
    // For demo, fetch the first app info document
    const appInfo = await AppInfo.findOne();
    if (!appInfo) {
      return res.status(404).json({ message: 'App info not found' });
    }
    res.json(appInfo);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Optionally, add a method to create/update app info
exports.setAppInfo = async (req, res) => {
  try {
    const { name, logo, description } = req.body;
    let appInfo = await AppInfo.findOne();
    if (appInfo) {
      appInfo.name = name;
      appInfo.logo = logo;
      appInfo.description = description;
      await appInfo.save();
    } else {
      appInfo = new AppInfo({ name, logo, description });
      await appInfo.save();
    }
    res.json(appInfo);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
