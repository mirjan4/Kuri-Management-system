const mongoose = require('mongoose');
require('dotenv').config();
const Member = require('../models/Member');

const members = [
  { name: 'Salman', phone: '8113035362' },
  { name: 'Junaid', phone: '7034911822' },
  { name: 'Arshad', phone: '7356785076' },
  { name: 'Shameem', phone: '9745623848' },
  { name: 'Aslam', phone: '9497882731' },
  { name: 'Fasal', phone: '8593028758' },
  { name: 'Shihab', phone: '9645854278' },
  { name: 'Haseeb', phone: '9605295314' }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
    
    // Format capitalize for names
    const toCapitalize = str => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    
    for (const m of members) {
       // Check if exists
       const exists = await Member.findOne({ phone: m.phone });
       if (!exists) {
         await Member.create({
           name: toCapitalize(m.name),
           phone: m.phone,
           isActive: true
         });
         console.log(`Added: ${toCapitalize(m.name)}`);
       } else {
         console.log(`Skipped (already exists): ${m.name}`);
       }
    }
    
    console.log('Done!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
