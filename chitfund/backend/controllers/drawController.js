const Winner = require('../models/Winner');
const ChitGroup = require('../models/ChitGroup');
const Payment = require('../models/Payment');

exports.conductDraw = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { monthIndex } = req.body;

    const group = await ChitGroup.findById(groupId).populate('members.member', 'name phone');
    if (!group) return res.status(404).json({ success: false, message: 'Chit group not found' });

    // Check if draw already done for this month
    const existingWinner = await Winner.findOne({ chitGroup: groupId, monthIndex });
    if (existingWinner) return res.status(400).json({ success: false, message: 'Draw already conducted for this month' });

    // Get previous winners
    const previousWinners = await Winner.find({ chitGroup: groupId }).select('member');
    const previousWinnerIds = previousWinners.map(w => w.member.toString());

    // Get paid members for this month
    const paidPayments = await Payment.find({ chitGroup: groupId, monthIndex, status: 'paid' }).select('member');
    const paidMemberIds = paidPayments.map(p => p.member.toString());

    // Eligible members = not yet won AND HAS PAID
    const eligible = group.members.filter(m => 
      !previousWinnerIds.includes(m.member._id.toString()) &&
      paidMemberIds.includes(m.member._id.toString())
    );
    
    if (eligible.length === 0) return res.status(400).json({ success: false, message: 'No fully eligible (un-won & paid) members for draw' });

    // Random selection
    const winnerEntry = eligible[Math.floor(Math.random() * eligible.length)];
    const now = new Date();
    const prizeAmount = group.monthlyAmount * group.totalMembers * (1 - group.commission / 100);

    const winner = await Winner.create({
      chitGroup: groupId,
      member: winnerEntry.member._id,
      monthIndex,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      prizeAmount,
      conductedBy: req.user._id,
    });

    // Update group current month
    if (monthIndex >= group.currentMonth) {
      group.currentMonth = monthIndex + 1;
      if (group.currentMonth > group.totalMonths) group.status = 'completed';
      await group.save();
    }

    const populated = await Winner.findById(winner._id)
      .populate('member', 'name phone email address')
      .populate('chitGroup', 'name monthlyAmount')
      .populate('conductedBy', 'name');

    res.status(201).json({ success: true, data: populated, message: `🎉 Winner: ${winnerEntry.member.name}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getWinners = async (req, res) => {
  try {
    const { groupId } = req.query;
    const query = groupId ? { chitGroup: groupId } : {};
    const winners = await Winner.find(query)
      .populate('member', 'name phone email')
      .populate('chitGroup', 'name monthlyAmount')
      .populate('conductedBy', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: winners });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getEligible = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { monthIndex } = req.query;
    
    const group = await ChitGroup.findById(groupId).populate('members.member', 'name phone email');
    if (!group) return res.status(404).json({ success: false, message: 'Chit group not found' });

    const previousWinners = await Winner.find({ chitGroup: groupId }).select('member');
    const previousWinnerIds = previousWinners.map(w => w.member.toString());
    
    let validIds = null;
    if (monthIndex) {
      const paidPayments = await Payment.find({ chitGroup: groupId, monthIndex: Number(monthIndex), status: 'paid' }).select('member');
      validIds = paidPayments.map(p => p.member.toString());
    }

    const eligible = group.members.filter(m => {
      const notWon = !previousWinnerIds.includes(m.member._id.toString());
      const hasPaid = validIds ? validIds.includes(m.member._id.toString()) : true;
      return notWon && hasPaid;
    });

    res.json({ success: true, data: eligible, totalEligible: eligible.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
