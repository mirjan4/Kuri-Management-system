const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const Member = require('../models/Member');
const ChitGroup = require('../models/ChitGroup');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Create admin
  const existing = await User.findOne({ email: 'admin@chitfund.com' });
  if (!existing) {
    await User.create({ name: 'Super Admin', email: 'admin@chitfund.com', password: 'admin123', role: 'superadmin' });
    console.log('✅ Admin created: admin@chitfund.com / admin123');
  } else {
    console.log('Admin already exists');
  }

  // Sample members
  const memberData = [
    { name: 'Rajesh Kumar', phone: '9876543210', email: 'rajesh@example.com', address: 'Chennai, TN' },
    { name: 'Priya Nair', phone: '9876543211', email: 'priya@example.com', address: 'Kochi, KL' },
    { name: 'Suresh Babu', phone: '9876543212', email: 'suresh@example.com', address: 'Bangalore, KA' },
    { name: 'Anitha Devi', phone: '9876543213', email: 'anitha@example.com', address: 'Hyderabad, TS' },
    { name: 'Mohammed Ali', phone: '9876543214', email: 'ali@example.com', address: 'Kozhikode, KL' },
  ];

  for (const m of memberData) {
    const exists = await Member.findOne({ phone: m.phone });
    if (!exists) await Member.create(m);
  }
  console.log('✅ Sample members created');

  console.log('🎉 Seeding complete!');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
