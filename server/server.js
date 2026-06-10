import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import dns from 'dns';
import crypto from 'crypto';

// Force Node.js to use Google public DNS to successfully resolve Atlas SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config();

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ke_ptw';

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB.');
    seedDatabase();
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

// Schemas & Models
const permitSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  status: { type: String, required: true },
  createdAt: { type: String, required: true },
  submittedBy: { type: String, required: true },
  approvedBy: String,
  approvedAt: String,
  formData: mongoose.Schema.Types.Mixed
});

const Permit = mongoose.model('Permit', permitSchema);

const notificationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  time: { type: String, required: true },
  type: { type: String, required: true }, // info, warning, alert
  read: { type: Boolean, default: false }
});

const Notification = mongoose.model('Notification', notificationSchema);

const userProfileSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }, // 'admin' or 'employee'
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, required: true }, // display role / job title
  badgeId: { type: String, required: true },
  department: { type: String, required: true },
  label: { type: String, enum: ['admin', 'employee'], default: 'employee' },
  avatarUrl: String,
});

const UserProfile = mongoose.model('UserProfile', userProfileSchema);

// Initial Seed Data
const initialMockPermits = [
  {
    id: 'KE-VI-384920',
    type: 'vehicle-inspection',
    title: 'Vehicle Inspection Checklist',
    status: 'approved',
    createdAt: new Date(Date.now() - 3600000 * 4).toLocaleString(), // 4 hours ago
    submittedBy: 'Arif Khan',
    approvedBy: 'Automated System Verification',
    approvedAt: new Date(Date.now() - 3600000 * 4).toLocaleString(),
    formData: {
      plateNo: 'JE-9382',
      vehicleType: 'Bucket Truck',
      driverName: 'Arif Khan',
      odometer: '14205',
      inspectionDate: new Date().toISOString().split('T')[0],
      checklist: {
        brakes: 'good',
        tires: 'good',
        lights: 'good',
        horn: 'good',
        wipers: 'good',
        seatbelts: 'good',
        extinguisher: 'good',
        firstaid: 'good',
        cones: 'good',
        winch: 'good',
      },
      signature: 'STAMP::GREEN::Arif Khan (KE-0284) - Authorized as Driver/Technician at 5/25/2026, 12:30:00 PM',
    },
  },
  {
    id: 'KE-LI-940284',
    type: 'line-isolation',
    title: 'Line Isolation PTW',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000 * 2).toLocaleString(), // 2 hours ago
    submittedBy: 'Kamran Malik',
    formData: {
      feederName: 'Feeder Clifton 11kV - B',
      voltage: '11 kV',
      isolatingSubstation: 'Clifton Grid Station',
      requestSection: 'Distribution Operations Division',
      checklist: {
        breakerOff: true,
        breakerRacked: true,
        isolatorOpen: true,
        redTagPlaced: true,
        earthSwitchClosed: false,
        dischargeVerified: false,
      },
      issuerSig: 'STAMP::ORANGE::Salim Qureshi (KE-9018) - Authorized as Control Room Isolation Officer at 5/25/2026, 2:30:00 PM',
      receiverSig: 'STAMP::ORANGE::Kamran Malik (KE-4820) - Authorized as Site Crew Leader / Lineman at 5/25/2026, 2:35:00 PM',
    },
  },
];

const initialNotifications = [
  {
    id: 'notif-1',
    title: 'High Wind Velocity Warning',
    message: 'Extreme wind speeds (>22 knots) forecast. Postpone high-work bucket deployments.',
    time: '15 mins ago',
    type: 'alert',
    read: false,
  },
  {
    id: 'notif-2',
    title: 'Outage Permit Awaiting Earth Switch',
    message: 'Permit KE-LI-940284 is pending line grounding confirmation.',
    time: '2 hours ago',
    type: 'warning',
    read: false,
  },
  {
    id: 'notif-3',
    title: 'Safety Drill Scheduled',
    message: 'Mandatory industrial rescue simulation drills this Friday 09:00 at Central Substation.',
    time: '1 day ago',
    type: 'info',
    read: true,
  },
];

const initialProfiles = [
  {
    username: 'admin',
    name: 'Maheen Mahad',
    role: 'Principal Safety Officer',
    badgeId: 'KE-7492',
    department: 'Transmission & Safety Division',
  },
  {
    username: 'employee',
    name: 'Arif Khan',
    role: 'Field Technician',
    badgeId: 'KE-0284',
    department: 'Distribution Operations Division',
  },
];

async function seedDatabase() {
  try {
    const permitCount = await Permit.countDocuments();
    if (permitCount === 0) {
      await Permit.insertMany(initialMockPermits);
      console.log('Seeded database with initial permits.');
    }

    const notificationCount = await Notification.countDocuments();
    if (notificationCount === 0) {
      await Notification.insertMany(initialNotifications);
      console.log('Seeded database with initial notifications.');
    }

    const profiles = await UserProfile.find();
    if (profiles.length === 0) {
      const saltedProfiles = initialProfiles.map(p => ({
        ...p,
        password: hashPassword(p.username === 'admin' ? 'admin123' : 'employee123'),
        label: p.username === 'admin' ? 'admin' : 'employee'
      }));
      await UserProfile.insertMany(saltedProfiles);
      console.log('Seeded database with initial user profiles.');
    } else {
      // Ensure existing profiles have passwords and labels
      for (const p of profiles) {
        let updated = false;
        if (!p.password) {
          p.password = hashPassword(p.username === 'admin' ? 'admin123' : 'employee123');
          updated = true;
        }
        if (p.username === 'admin' && p.label !== 'admin') {
          p.label = 'admin';
          updated = true;
        } else if (p.username !== 'admin' && !p.label) {
          p.label = 'employee';
          updated = true;
        }
        if (updated) {
          await p.save();
        }
      }
      console.log('Verified user profiles and updated credentials/labels.');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// API Routes
app.get('/api/permits', async (req, res) => {
  try {
    const permits = await Permit.find().sort({ createdAt: -1 });
    res.json(permits);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve permits' });
  }
});

app.post('/api/permits', async (req, res) => {
  try {
    const permitData = req.body;
    if (!permitData.id) {
      return res.status(400).json({ error: 'Permit id is required' });
    }

    const permit = await Permit.findOneAndUpdate(
      { id: permitData.id },
      permitData,
      { new: true, upsert: true }
    );
    res.json(permit);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save/update permit', details: err.message });
  }
});

app.get('/api/notifications', async (req, res) => {
  try {
    const notifications = await Notification.find();
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve notifications' });
  }
});

app.post('/api/notifications/read-all', async (req, res) => {
  try {
    await Notification.updateMany({}, { read: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

app.get('/api/profiles', async (req, res) => {
  try {
    const profiles = await UserProfile.find({}, { password: 0 }); // omit password
    res.json(profiles);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve user profiles' });
  }
});

app.post('/api/profiles/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const profileData = req.body;
    // Omit updating password/label fields via this endpoint to prevent accidental overwrite
    if (profileData.password) delete profileData.password;
    
    const profile = await UserProfile.findOneAndUpdate(
      { username },
      profileData,
      { new: true, upsert: true }
    );
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile', details: err.message });
  }
});

// AUTH SIGNUP
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, password, name, role, badgeId, department } = req.body;
    if (!username || !password || !name || !role || !badgeId || !department) {
      return res.status(400).json({ error: 'All profile registration fields are required' });
    }

    const existingUser = await UserProfile.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    const label = username.toLowerCase() === 'admin' ? 'admin' : 'employee';
    const newUser = new UserProfile({
      username: username.toLowerCase(),
      password: hashPassword(password),
      name,
      role, // job title
      badgeId,
      department,
      label,
    });

    await newUser.save();

    const userResponse = newUser.toObject();
    delete userResponse.password;
    res.json(userResponse);
  } catch (err) {
    res.status(500).json({ error: 'Registration failed', details: err.message });
  }
});

// AUTH LOGIN
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await UserProfile.findOne({ username: username.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const hashedPassword = hashPassword(password);
    if (user.password !== hashedPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const userResponse = user.toObject();
    delete userResponse.password;
    res.json(userResponse);
  } catch (err) {
    res.status(500).json({ error: 'Login failed', details: err.message });
  }
});

// GET USERS (Admin dashboard)
app.get('/api/users', async (req, res) => {
  try {
    const users = await UserProfile.find({}, { password: 0 }).sort({ name: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve users directory' });
  }
});

// UPDATE USER ROLE LABEL (Admin dashboard promotion/demotion)
app.post('/api/users/update-label', async (req, res) => {
  try {
    const { username, label } = req.body;
    if (!username || !label || !['admin', 'employee'].includes(label)) {
      return res.status(400).json({ error: 'Username and valid label (admin/employee) are required' });
    }

    const user = await UserProfile.findOneAndUpdate(
      { username },
      { label },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userResponse = user.toObject();
    delete userResponse.password;
    res.json(userResponse);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user label', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});
