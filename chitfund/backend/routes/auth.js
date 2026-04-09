const express = require('express');
const router = express.Router();
const { login, register, getMe, changePassword, memberLogin, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/login', login);
router.post('/member-login', memberLogin);
router.post('/register', register);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);
router.put('/profile', protect, updateProfile);

module.exports = router;
