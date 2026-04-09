const mongoose = require('mongoose');

const chitGroupSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  totalMembers: { type: Number, required: true, min: 2 },
  monthlyAmount: { type: Number, required: true, min: 100 },
  totalMonths: { type: Number, required: true, min: 2 },
  startDate: { type: Date, required: true },
  status: { type: String, enum: ['active', 'completed', 'pending'], default: 'pending' },
  members: [{
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    joinedAt: { type: Date, default: Date.now },
    ticketNumber: { type: Number },
  }],
  currentMonth: { type: Number, default: 1 },
  description: { type: String },
  commission: { type: Number, default: 5 }, // percentage
}, { timestamps: true });

chitGroupSchema.virtual('totalChitValue').get(function() {
  return this.totalMembers * this.monthlyAmount * this.totalMonths;
});

chitGroupSchema.virtual('monthlyPool').get(function() {
  return this.totalMembers * this.monthlyAmount;
});

chitGroupSchema.set('toJSON', { virtuals: true });
chitGroupSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ChitGroup', chitGroupSchema);
