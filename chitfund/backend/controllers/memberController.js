const Member = require('../models/Member');
const Payment = require('../models/Payment');

exports.getAll = async (req, res) => {
  try {
    const { search, page = 1, limit = 20, status } = req.query;
    const query = {};
    if (search) query.$text = { $search: search };
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    const total = await Member.countDocuments(query);
    const members = await Member.find(query)
      .populate('chitGroups', 'name status')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, data: members, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id).populate('chitGroups', 'name status monthlyAmount');
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
    res.json({ success: true, data: member });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const member = await Member.create(req.body);
    res.status(201).json({ success: true, data: member });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const member = await Member.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
    res.json({ success: true, data: member });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

    const ChitGroup = require('../models/ChitGroup');
    const groupCount = await ChitGroup.countDocuments({ 'members.member': member._id });

    if (groupCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete: This member is enrolled in one or more active Chit Groups. Remove them from the groups first.' 
      });
    }

    // Clean up any orphan payments just in case
    await Payment.deleteMany({ member: member._id });
    
    // Hard delete
    await Member.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Member completely deleted from system' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ member: req.params.id })
      .populate('chitGroup', 'name monthlyAmount')
      .sort({ year: -1, month: -1 });
    res.json({ success: true, data: payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
