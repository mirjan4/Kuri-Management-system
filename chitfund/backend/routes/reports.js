const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/member/:memberId', ctrl.memberPaymentReport);
router.get('/monthly/:groupId/:monthIndex', ctrl.monthlyCollectionReport);
router.get('/winners', ctrl.winnerHistory);
router.get('/export', ctrl.exportToExcel);

module.exports = router;
