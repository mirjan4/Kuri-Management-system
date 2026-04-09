const express = require('express');
const router = express.Router();
const { getMemberDashboard } = require('../controllers/memberPortalController');
const { protect } = require('../middleware/auth');

router.get('/dashboard', protect, getMemberDashboard);

module.exports = router;
