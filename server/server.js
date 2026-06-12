import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import dns from 'dns';
import crypto from 'crypto';
import fs from 'fs';

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
    status: 'APPROVED',
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
    status: 'PENDING_APPROVAL',
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
  },
  {
    username: 'employee',
    name: 'Arif Khan',
    role: 'Field Technician',
    badgeId: 'KE-0284',
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

    // Seed default profiles if they do not exist
    for (const pInfo of initialProfiles) {
      const exists = await UserProfile.findOne({ username: pInfo.username });
      if (!exists) {
        const password = hashPassword(pInfo.username === 'admin' ? 'admin123' : 'employee123');
        const label = pInfo.username === 'admin' ? 'admin' : 'employee';
        const newProfile = new UserProfile({
          ...pInfo,
          password,
          label
        });
        await newProfile.save();
        console.log(`Seeded default profile for: ${pInfo.username}`);
      }
    }

    // Ensure all existing user profiles have password and label updates
    const profiles = await UserProfile.find();
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
    const userRole = req.headers['x-user-role'];
    const username = req.headers['x-user-username'];

    if (!userRole) {
      return res.status(401).json({ error: 'Unauthorized: User role is missing in headers' });
    }

    const permitData = req.body;
    if (!permitData.id) {
      return res.status(400).json({ error: 'Permit id is required' });
    }

    // Capture existing state to detect status modifications
    const existingPermit = await Permit.findOne({ id: permitData.id });

    // Validate permission and status transitions
    if (!existingPermit) {
      // Create / Submit: Only employees can create new records
      if (userRole !== 'employee') {
        return res.status(403).json({ error: 'Forbidden: Only Employees can create or submit new permits' });
      }
      if (permitData.status !== 'DRAFT' && permitData.status !== 'PENDING_APPROVAL') {
        return res.status(400).json({ error: 'Forbidden: Initial permit status must be DRAFT or PENDING_APPROVAL' });
      }
      if (!permitData.formData) permitData.formData = {};
      permitData.formData.submittedByUsername = username;
    } else {
      if (existingPermit.status !== 'DRAFT' && existingPermit.status !== 'draft') {
        // Permit is locked. Only Admin can update status to APPROVED or REJECTED.
        if (userRole !== 'admin') {
          return res.status(403).json({ error: 'Forbidden: Permits cannot be modified by employees after submission' });
        }
        if (permitData.status !== 'APPROVED' && permitData.status !== 'REJECTED') {
          return res.status(400).json({ error: 'Forbidden: Admin can only transition status to APPROVED or REJECTED' });
        }
        // Strict lockdown of employee details
        permitData.type = existingPermit.type;
        permitData.title = existingPermit.title;
        permitData.submittedBy = existingPermit.submittedBy;
        permitData.createdAt = existingPermit.createdAt;
        permitData.formData = {
          ...existingPermit.formData,
          approverSignature: permitData.formData?.approverSignature || existingPermit.formData?.approverSignature
        };
      } else {
        // Permit is still draft, only employees can edit
        if (userRole !== 'employee') {
          return res.status(403).json({ error: 'Forbidden: Only Employees can edit draft permits' });
        }
        if (permitData.status !== 'DRAFT' && permitData.status !== 'PENDING_APPROVAL') {
          return res.status(400).json({ error: 'Forbidden: Draft permits can only be saved or submitted' });
        }
        if (!permitData.formData) permitData.formData = {};
        permitData.formData.submittedByUsername = username;
      }
    }

    const permit = await Permit.findOneAndUpdate(
      { id: permitData.id },
      permitData,
      { new: true, upsert: true }
    );

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Generate dynamic notifications
    if (!existingPermit) {
      // Fresh permit created
      let title = 'Permit Draft Saved';
      let message = `Permit ${permit.id} (${permit.type.replace('-', ' ')}) was saved as draft.`;
      let type = 'info';

      if (permit.status === 'PENDING_APPROVAL' || permit.status === 'pending') {
        title = 'New Permit Pending Sign-off';
        message = `Permit ${permit.id} submitted by ${permit.submittedBy} is awaiting approval.`;
        type = 'warning';
      }

      await Notification.create({
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        message,
        time: timeString,
        type,
        read: false,
      });
    } else if (existingPermit.status !== permit.status) {
      // Status transition
      let title = 'Permit Status Updated';
      let message = `Permit ${permit.id} status changed from ${existingPermit.status} to ${permit.status}.`;
      let type = 'info';

      if (permit.status === 'APPROVED' || permit.status === 'approved') {
        title = 'Permit Sign-off Approved';
        message = `Permit ${permit.id} has been approved by ${permit.approvedBy || 'Control Room'}.`;
        type = 'info';
      } else if (permit.status === 'REJECTED' || permit.status === 'rejected') {
        title = 'Permit Safety Check Failed';
        message = `Permit ${permit.id} safety checklist verification failed (Rejected).`;
        type = 'alert';
      } else if (permit.status === 'PENDING_APPROVAL' || permit.status === 'pending') {
        title = 'Permit Resubmitted';
        message = `Permit ${permit.id} resubmitted by ${permit.submittedBy} is awaiting approval.`;
        type = 'warning';
      }

      await Notification.create({
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        message,
        time: timeString,
        type,
        read: false,
      });
    }

    res.json(permit);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save/update permit', details: err.message });
  }
});

app.get('/api/notifications', async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ _id: -1 }).limit(30);
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
    const { username, password, name, role, badgeId } = req.body;
    if (!username || !password || !name || !role || !badgeId) {
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
    try {
      fs.appendFileSync('login_attempts.log', `${new Date().toISOString()} - Login Attempt: username="${username}" (len=${username?.length}, codes=[${username ? Array.from(username).map(c => c.charCodeAt(0)).join(',') : ''}]), password="${password}" (len=${password?.length}, codes=[${password ? Array.from(password).map(c => c.charCodeAt(0)).join(',') : ''}])\n`);
    } catch (e) {
      console.error('Logging failed:', e);
    }
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

// DELETE USER PROFILE (Admin privilege)
app.delete('/api/users/:username', async (req, res) => {
  try {
    const { username } = req.params;

    // Prevent deleting the root admin account
    if (username.toLowerCase() === 'admin') {
      return res.status(400).json({ error: 'Cannot delete the main admin account' });
    }

    const user = await UserProfile.findOneAndDelete({ username: username.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: `User ${username} deleted successfully` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user', details: err.message });
  }
});


if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Backend server is running on port ${PORT}`);
  });
}

export default app;
