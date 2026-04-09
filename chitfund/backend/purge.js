const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/.env' });
const Winner = require('./models/Winner');
const Payment = require('./models/Payment');
const ChitGroup = require('./models/ChitGroup');

async function purge() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');
  
  const groups = await ChitGroup.find({}, '_id');
  const groupIds = groups.map(g => g._id.toString());
  
  const pRet = await Payment.deleteMany({ chitGroup: { $nin: groupIds } });
  const wRet = await Winner.deleteMany({ chitGroup: { $nin: groupIds } });
  
  console.log('Purged Payments:', pRet.deletedCount);
  console.log('Purged Winners:', wRet.deletedCount);
  process.exit(0);
}
purge();
