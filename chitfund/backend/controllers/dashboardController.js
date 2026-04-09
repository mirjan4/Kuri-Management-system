const Member = require('../models/Member');
const ChitGroup = require('../models/ChitGroup');
const Payment = require('../models/Payment');
const Winner = require('../models/Winner');

exports.getStats = async (req, res) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const [totalMembers, totalGroups, activeGroups, completedGroups] = await Promise.all([
      Member.countDocuments({ isActive: true }),
      ChitGroup.countDocuments(),
      ChitGroup.countDocuments({ status: 'active' }),
      ChitGroup.countDocuments({ status: 'completed' }),
    ]);

    const monthlyPayments = await Payment.find({ month: currentMonth, year: currentYear, status: 'paid' });
    const totalMonthlyCollection = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);

    const pendingPayments = await Payment.countDocuments({ month: currentMonth, year: currentYear, status: 'unpaid' });

    // Fetch extra to safely filter orphans
    const rawWinners = await Winner.find()
      .populate('member', 'name phone')
      .populate('chitGroup', 'name')
      .sort({ createdAt: -1 })
      .limit(20);

    const recentWinners = rawWinners.filter(w => w.chitGroup && w.member).slice(0, 5);

    const monthlyTrend = await Payment.aggregate([
      { $match: { status: 'paid', year: currentYear } },
      { $group: { _id: '$month', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const groupStats = await ChitGroup.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: {
        totalMembers, totalGroups, activeGroups, completedGroups,
        totalMonthlyCollection, pendingPayments,
        recentWinners, monthlyTrend, groupStats,
        currentMonth, currentYear,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
