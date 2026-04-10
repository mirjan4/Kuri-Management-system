const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Member = require('../models/Member');

const JWT_SECRET = process.env.JWT_SECRET || 'chitfund_super_secret_jwt_key_2024';

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
      }
      return res.status(401).json({ success: false, message: 'Invalid token. Please log in again.' });
    }

    if (decoded.role === 'member') {
      const member = await Member.findById(decoded.id).select('-__v');
      if (!member) return res.status(401).json({ success: false, message: 'Member account not found.' });
      if (!member.isActive) return res.status(401).json({ success: false, message: 'Member account is deactivated.' });
      req.member = member;
    } else {
      const user = await User.findById(decoded.id).select('-password -__v');
      if (!user) return res.status(401).json({ success: false, message: 'User account not found.' });
      if (!user.isActive) return res.status(401).json({ success: false, message: 'User account is deactivated.' });
      req.user = user;
    }

    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    return res.status(500).json({ success: false, message: 'Authentication error.' });
  }
};

// Admin-only: blocks member tokens from accessing admin routes
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(403).json({ success: false, message: 'Admin access required. Member tokens are not allowed here.' });
  }
  if (!['admin', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }
  next();
};

// Member-only: blocks admin tokens from accessing member portal
const memberOnly = (req, res, next) => {
  if (!req.member) {
    return res.status(403).json({ success: false, message: 'Member access required.' });
  }
  next();
};

module.exports = { protect, adminOnly, memberOnly };
