const ChitGroup = require('../models/ChitGroup');
const Member = require('../models/Member');
const Payment = require('../models/Payment');

exports.getAll = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { status } : {};
    const total = await ChitGroup.countDocuments(query);
    const groups = await ChitGroup.find(query)
      .populate('members.member', 'name phone email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, data: groups, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const group = await ChitGroup.findById(req.params.id)
      .populate('members.member', 'name phone email address');
    if (!group) return res.status(404).json({ success: false, message: 'Chit group not found' });
    res.json({ success: true, data: group });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const group = await ChitGroup.create(req.body);
    res.status(201).json({ success: true, data: group });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const group = await ChitGroup.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!group) return res.status(404).json({ success: false, message: 'Chit group not found' });
    res.json({ success: true, data: group });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const groupId = req.params.id;
    
    // Completely cascade delete all related database records
    await ChitGroup.findByIdAndDelete(groupId);
    await Payment.deleteMany({ chitGroup: groupId });
    
    const Winner = require('../models/Winner');
    await Winner.deleteMany({ chitGroup: groupId });
    
    res.json({ success: true, message: 'Chit group and all related records completely deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addMember = async (req, res) => {
  try {
    const { memberId } = req.body;
    const group = await ChitGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Chit group not found' });
    if (group.members.length >= group.totalMembers) {
      return res.status(400).json({ success: false, message: 'Group is full' });
    }
    const alreadyAdded = group.members.find(m => m.member.toString() === memberId);
    if (alreadyAdded) return res.status(400).json({ success: false, message: 'Member already in group' });

    const ticketNumber = group.members.length + 1;
    group.members.push({ member: memberId, ticketNumber });
    if (group.members.length === group.totalMembers) group.status = 'active';
    await group.save();

    await Member.findByIdAndUpdate(memberId, { $addToSet: { chitGroups: group._id } });

    // Create payment records for all months
    const payments = [];
    const now = new Date(group.startDate);
    for (let i = 1; i <= group.totalMonths; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i - 1, 1);
      payments.push({
        chitGroup: group._id,
        member: memberId,
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        monthIndex: i,
        amount: group.monthlyAmount,
        status: 'unpaid',
      });
    }
    await Payment.insertMany(payments, { ordered: false }).catch(() => {});

    const updated = await ChitGroup.findById(group._id).populate('members.member', 'name phone email');
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const group = await ChitGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Chit group not found' });

    group.members = group.members.filter(m => m.member.toString() !== memberId);
    await group.save();
    await Member.findByIdAndUpdate(memberId, { $pull: { chitGroups: group._id } });
    await Payment.deleteMany({ chitGroup: group._id, member: memberId });

    res.json({ success: true, message: 'Member removed from group' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
