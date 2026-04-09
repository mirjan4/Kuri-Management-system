const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  chitGroup: { type: mongoose.Schema.Types.ObjectId, ref: 'ChitGroup', required: true },
  member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  monthIndex: { type: Number, required: true }, // chit month number (1 to totalMonths)
  amount: { type: Number, required: true },
  status: { type: String, enum: ['paid', 'unpaid', 'partial'], default: 'unpaid' },
  paymentDate: { type: Date },
  paymentMode: { type: String, enum: ['cash', 'upi', 'bank', 'cheque'], default: 'cash' },
  notes: { type: String },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

paymentSchema.index({ chitGroup: 1, member: 1, monthIndex: 1 }, { unique: true });

module.exports = mongoose.model('Payment', paymentSchema);
