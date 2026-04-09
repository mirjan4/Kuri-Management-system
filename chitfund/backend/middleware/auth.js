const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Member = require('../models/Member');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return res.status(401).json({ success: false, message: 'Not authorized' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role === 'member') {
      const member = await Member.findById(decoded.id);
      if (!member || !member.isActive) return res.status(401).json({ success: false, message: 'Member not found or inactive' });
      req.member = member;
    } else {
      const user = await User.findById(decoded.id);
      if (!user || !user.isActive) return res.status(401).json({ success: false, message: 'User not found or inactive' });
      req.user = user;
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

const adminOnly = (req, res, next) => {
  if (!['admin', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

module.exports = { protect, adminOnly };
