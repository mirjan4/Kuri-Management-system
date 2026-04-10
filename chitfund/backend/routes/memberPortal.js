const express = require('express');
const router = express.Router();
const { getMemberDashboard } = require('../controllers/memberPortalController');
const { protect, memberOnly } = require('../middleware/auth');

router.get('/dashboard', protect, memberOnly, getMemberDashboard);

module.exports = router;
