const ChitGroup = require('../models/ChitGroup');
const Payment = require('../models/Payment');
const Winner = require('../models/Winner');
const Member = require('../models/Member');

exports.getMemberDashboard = async (req, res) => {
  try {
    const memberId = req.member._id;

    // Fetch the groups this member is part of
    const groups = await ChitGroup.find({ 'members.member': memberId }).select('-__v');

    const groupIds = groups.map(g => g._id);

    // Fetch winners for these groups
    const winners = await Winner.find({ chitGroup: { $in: groupIds } })
      .populate('member', 'name phone')
      .populate('chitGroup', 'name')
      .sort('-drawDate');

    // Fetch payments of this member
    const payments = await Payment.find({ member: memberId }).populate('chitGroup', 'name monthlyAmount');

    res.json({
      success: true,
      data: {
        groups,
        winners,
        payments
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
