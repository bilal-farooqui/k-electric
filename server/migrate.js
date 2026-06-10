import mongoose from 'mongoose';
import dns from 'dns';

// Force Node.js to use Google public DNS to successfully resolve Atlas SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

const LOCAL_URI = 'mongodb://127.0.0.1:27017/ke_ptw';
const CLOUD_URI = 'mongodb+srv://admin:admin123@k-electric.gdu6uit.mongodb.net/ke_ptw?appName=K-electric';

async function migrate() {
  console.log('Starting data migration...');
  
  // 1. Connect to local DB and retrieve all data
  console.log(`Connecting to local MongoDB: ${LOCAL_URI}...`);
  const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
  console.log('Connected to local MongoDB successfully.');

  const PermitModel = localConn.model('Permit', new mongoose.Schema({}, { strict: false, collection: 'permits' }));
  const NotificationModel = localConn.model('Notification', new mongoose.Schema({}, { strict: false, collection: 'notifications' }));
  const ProfileModel = localConn.model('UserProfile', new mongoose.Schema({}, { strict: false, collection: 'userprofiles' }));

  console.log('Retrieving records from local database...');
  const permits = await PermitModel.find().lean();
  const notifications = await NotificationModel.find().lean();
  const profiles = await ProfileModel.find().lean();

  console.log(`Found: ${permits.length} permits, ${notifications.length} notifications, ${profiles.length} profiles.`);
  await localConn.close();

  // 2. Connect to cloud DB and save all data
  console.log(`Connecting to MongoDB Atlas: ${CLOUD_URI}...`);
  const cloudConn = await mongoose.createConnection(CLOUD_URI).asPromise();
  console.log('Connected to MongoDB Atlas successfully.');

  const CloudPermitModel = cloudConn.model('Permit', new mongoose.Schema({}, { strict: false, collection: 'permits' }));
  const CloudNotificationModel = cloudConn.model('Notification', new mongoose.Schema({}, { strict: false, collection: 'notifications' }));
  const CloudProfileModel = cloudConn.model('UserProfile', new mongoose.Schema({}, { strict: false, collection: 'userprofiles' }));

  console.log('Writing permits to cloud Atlas...');
  for (const permit of permits) {
    // Delete _id to avoid duplicate key issues if mongoose generated new IDs or we want clean insert
    const cleanPermit = { ...permit };
    delete cleanPermit._id;
    await CloudPermitModel.findOneAndUpdate({ id: permit.id }, cleanPermit, { upsert: true, new: true });
  }

  console.log('Writing notifications to cloud Atlas...');
  for (const notif of notifications) {
    const cleanNotif = { ...notif };
    delete cleanNotif._id;
    await CloudNotificationModel.findOneAndUpdate({ id: notif.id }, cleanNotif, { upsert: true, new: true });
  }

  console.log('Writing user profiles to cloud Atlas...');
  for (const profile of profiles) {
    const cleanProfile = { ...profile };
    delete cleanProfile._id;
    await CloudProfileModel.findOneAndUpdate({ username: profile.username }, cleanProfile, { upsert: true, new: true });
  }

  console.log('Migration completed successfully!');
  await cloudConn.close();
  console.log('All connections closed.');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
