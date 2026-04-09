const Payment = require('../models/Payment');
const ChitGroup = require('../models/ChitGroup');

exports.getByGroup = async (req, res) => {
  try {
    const { monthIndex } = req.query;
    const query = { chitGroup: req.params.groupId };
    if (monthIndex) query.monthIndex = Number(monthIndex);

    const payments = await Payment.find(query)
      .populate('member', 'name phone email')
      .populate('chitGroup', 'name monthlyAmount')
      .sort({ monthIndex: 1 });

    res.json({ success: true, data: payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status, paymentDate, paymentMode, notes } = req.body;
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      {
        status,
        paymentDate: status === 'paid' ? (paymentDate || new Date()) : null,
        paymentMode,
        notes,
        recordedBy: req.user._id,
      },
      { new: true }
    ).populate('member', 'name phone').populate('chitGroup', 'name');

    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({ success: true, data: payment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMonthlySummary = async (req, res) => {
  try {
    const { groupId, monthIndex } = req.params;
    const payments = await Payment.find({ chitGroup: groupId, monthIndex: Number(monthIndex) })
      .populate('member', 'name phone');

    const paid = payments.filter(p => p.status === 'paid');
    const unpaid = payments.filter(p => p.status === 'unpaid');
    const totalCollected = paid.reduce((sum, p) => sum + p.amount, 0);
    const totalPending = unpaid.reduce((sum, p) => sum + p.amount, 0);

    res.json({
      success: true,
      data: { payments, paid: paid.length, unpaid: unpaid.length, totalCollected, totalPending },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.bulkUpdate = async (req, res) => {
  try {
    const { paymentIds, status, paymentDate, paymentMode } = req.body;
    const update = { status, recordedBy: req.user._id };
    if (status === 'paid') update.paymentDate = paymentDate || new Date();
    if (paymentMode) update.paymentMode = paymentMode;

    await Payment.updateMany({ _id: { $in: paymentIds } }, update);
    res.json({ success: true, message: `${paymentIds.length} payments updated` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
