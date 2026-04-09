const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/group/:groupId', ctrl.getByGroup);
router.get('/summary/:groupId/:monthIndex', ctrl.getMonthlySummary);
router.put('/bulk', ctrl.bulkUpdate);
router.put('/:id', ctrl.updateStatus);

module.exports = router;
