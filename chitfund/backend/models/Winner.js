const mongoose = require('mongoose');

const winnerSchema = new mongoose.Schema({
  chitGroup: { type: mongoose.Schema.Types.ObjectId, ref: 'ChitGroup', required: true },
  member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
  monthIndex: { type: Number, required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  prizeAmount: { type: Number, required: true },
  drawDate: { type: Date, default: Date.now },
  conductedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String },
}, { timestamps: true });

winnerSchema.index({ chitGroup: 1, monthIndex: 1 }, { unique: true });
winnerSchema.index({ chitGroup: 1, member: 1 }, { unique: true });

module.exports = mongoose.model('Winner', winnerSchema);
