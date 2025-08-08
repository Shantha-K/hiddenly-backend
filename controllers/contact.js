const User = require('../models/User');

// Search contacts by name
exports.searchContacts = async (req, res) => {
  const { search } = req.query;
  try {
    let query = {};
    if (search) {
      query = { name: { $regex: search, $options: 'i' } };
    }
    const users = await User.find(query);
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all contacts
exports.getAllContacts = async (req, res) => {
  try {
    const users = await User.find();
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get contact details by ID
exports.getContactById = async (req, res) => {
  const { contactId } = req.params;
  try {
    const user = await User.findById(contactId);
    if (!user) {
      return res.status(404).json({ message: 'Contact not found.' });
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Add new contact
exports.addContact = async (req, res) => {
  const { name, mobile } = req.body;
  if (!name || !mobile) {
    return res.status(400).json({ message: 'Name and mobile are required.' });
  }
  try {
    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      return res.status(409).json({ message: 'Contact already exists.' });
    }
    const user = new User({ name, mobile });
    await user.save();
    res.status(201).json({ message: 'Contact added successfully.', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
