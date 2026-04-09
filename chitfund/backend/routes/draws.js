const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/drawController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', ctrl.getWinners);
router.post('/:groupId/conduct', ctrl.conductDraw);
router.get('/:groupId/eligible', ctrl.getEligible);

module.exports = router;
