const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Member = require('../models/Member');

const generateToken = (id, role = 'user') => 
  jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret', { 
    expiresIn: process.env.JWT_EXPIRE || '7d' 
  });

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });
    const user = await User.create({ name, email, password, role });
    const token = generateToken(user._id, user.role);
    res.status(201).json({ success: true, token, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (!user.isActive) return res.status(401).json({ success: false, message: 'Account deactivated' });
    const token = generateToken(user._id, user.role);
    res.json({ success: true, token, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMe = async (req, res) => {
  if (req.member) {
    res.json({ success: true, user: req.member, role: 'member' });
  } else {
    res.json({ success: true, user: req.user, role: req.user?.role });
  }
};

exports.memberLogin = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: 'Phone number required' });
    
    // Exact match for now
    const member = await Member.findOne({ phone });
    if (!member) {
      return res.status(401).json({ success: false, message: 'Phone number not found in our records' });
    }
    if (!member.isActive) return res.status(401).json({ success: false, message: 'Member account deactivated' });
    
    const token = generateToken(member._id, 'member');
    res.json({ success: true, token, user: member, role: 'member' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    if (email && email !== user.email) {
      const exists = await User.findOne({ email });
      if (exists) return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    
    await user.save();
    res.json({ success: true, user, message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
