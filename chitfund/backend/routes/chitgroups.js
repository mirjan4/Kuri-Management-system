const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/chitGroupController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', ctrl.getAll);
router.post('/', ctrl.create);
router.get('/:id', ctrl.getOne);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.delete);
router.post('/:id/members', ctrl.addMember);
router.delete('/:id/members/:memberId', ctrl.removeMember);

module.exports = router;
