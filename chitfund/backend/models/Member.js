const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  address: { type: String, trim: true },
  joinDate: { type: Date, default: Date.now },
  aadhar: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
  chitGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ChitGroup' }],
}, { timestamps: true });

memberSchema.index({ name: 'text', phone: 'text', email: 'text' });

module.exports = mongoose.model('Member', memberSchema);
