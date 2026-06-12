import mongoose from 'mongoose';

const LOCAL_URI = 'mongodb://127.0.0.1:27017/ke_ptw';

async function checkLocalUsers() {
  console.log('Connecting to local database...');
  await mongoose.connect(LOCAL_URI);
  console.log('Connected.');

  const UserProfile = mongoose.model('UserProfile', new mongoose.Schema({}, { strict: false, collection: 'userprofiles' }));
  
  const users = await UserProfile.find().lean();
  console.log('\n--- Local User Profiles in DB ---');
  users.forEach(u => {
    console.log(`- Username: "${u.username}"`);
    console.log(`  Name: "${u.name}"`);
    console.log(`  Role: "${u.role}"`);
    console.log(`  Label: "${u.label}"`);
    console.log(`  Password Hash: "${u.password}"`);
    console.log('---------------------------');
  });

  await mongoose.disconnect();
  console.log('Disconnected.');
}

checkLocalUsers().catch(console.error);
