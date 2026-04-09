const Payment = require('../models/Payment');
const Winner = require('../models/Winner');
const ChitGroup = require('../models/ChitGroup');
const Member = require('../models/Member');
const XLSX = require('xlsx');

exports.memberPaymentReport = async (req, res) => {
  try {
    const { memberId } = req.params;
    const payments = await Payment.find({ member: memberId })
      .populate('chitGroup', 'name monthlyAmount')
      .sort({ year: -1, month: -1 });

    const member = await Member.findById(memberId);
    const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
    const totalPending = payments.filter(p => p.status === 'unpaid').reduce((s, p) => s + p.amount, 0);

    res.json({ success: true, data: { member, payments, totalPaid, totalPending } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.monthlyCollectionReport = async (req, res) => {
  try {
    const { groupId, monthIndex } = req.params;
    const payments = await Payment.find({ chitGroup: groupId, monthIndex: Number(monthIndex) })
      .populate('member', 'name phone email')
      .populate('chitGroup', 'name');

    const group = await ChitGroup.findById(groupId);
    const totalCollected = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
    const totalPending = payments.filter(p => p.status === 'unpaid').reduce((s, p) => s + p.amount, 0);
    const winner = await Winner.findOne({ chitGroup: groupId, monthIndex: Number(monthIndex) })
      .populate('member', 'name phone');

    res.json({ success: true, data: { group, payments, totalCollected, totalPending, winner } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.winnerHistory = async (req, res) => {
  try {
    const { groupId } = req.query;
    const query = groupId ? { chitGroup: groupId } : {};
    const winners = await Winner.find(query)
      .populate('member', 'name phone email')
      .populate('chitGroup', 'name monthlyAmount')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: winners });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.exportToExcel = async (req, res) => {
  try {
    const { type, groupId } = req.query;
    let data = [], sheetName = 'Report';

    if (type === 'payments') {
      const query = groupId ? { chitGroup: groupId } : {};
      const payments = await Payment.find(query)
        .populate('member', 'name phone')
        .populate('chitGroup', 'name');
      data = payments.map(p => ({
        'Member': p.member?.name, 'Phone': p.member?.phone,
        'Chit Group': p.chitGroup?.name, 'Month Index': p.monthIndex,
        'Amount': p.amount, 'Status': p.status,
        'Payment Date': p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '',
        'Mode': p.paymentMode,
      }));
      sheetName = 'Payments';
    } else if (type === 'winners') {
      const query = groupId ? { chitGroup: groupId } : {};
      const winners = await Winner.find(query)
        .populate('member', 'name phone')
        .populate('chitGroup', 'name');
      data = winners.map(w => ({
        'Winner': w.member?.name, 'Phone': w.member?.phone,
        'Chit Group': w.chitGroup?.name, 'Month': w.monthIndex,
        'Prize Amount': w.prizeAmount,
        'Draw Date': new Date(w.drawDate).toLocaleDateString(),
      }));
      sheetName = 'Winners';
    } else if (type === 'members') {
      const members = await Member.find({ isActive: true });
      data = members.map(m => ({
        'Name': m.name, 'Phone': m.phone, 'Email': m.email,
        'Address': m.address, 'Join Date': new Date(m.joinDate).toLocaleDateString(),
      }));
      sheetName = 'Members';
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${sheetName}-report.xlsx"`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
