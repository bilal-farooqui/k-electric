import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Overview } from './pages/Overview';
import { Profile } from './pages/Profile';
import { EmployeeHome } from './pages/EmployeeHome';
import { VehicleInspection } from './pages/forms/VehicleInspection';
import { ToolsPPE } from './pages/forms/ToolsPPE';
import { ShiftDispatch } from './pages/forms/ShiftDispatch';
import { ToolboxTalk } from './pages/forms/ToolboxTalk';
import { FaultExcavation } from './pages/forms/FaultExcavation';
import { LineIsolation } from './pages/forms/LineIsolation';
import { Excavation } from './pages/forms/Excavation';
import { ConfinedSpace } from './pages/forms/ConfinedSpace';
import { HeatShrink } from './pages/forms/HeatShrink';
import { Auth } from './pages/Auth';
import type { Permit, Notification, UserProfile } from './types/ptw';

// Mock baseline data for fresh load fallback
const initialMockPermits: Permit[] = [
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

const initialNotifications: Notification[] = [
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



function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [permits, setPermitsState] = useState<Permit[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // User profiles state
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  
  // Auth state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('ke_ptw_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Active role mode (determines view type for admins)
  const [activeRoleMode, setActiveRoleMode] = useState<'admin' | 'employee'>(() => {
    const saved = localStorage.getItem('ke_ptw_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.label;
    }
    return 'employee';
  });

  // Derive active user profile details
  const activeProfile = currentUser
    ? (profiles.find((p) => p.username === currentUser.username) || currentUser)
    : null;

  const setPermits = (value: React.SetStateAction<Permit[]>) => {
    setPermitsState((prev) => {
      const next = typeof value === 'function'
        ? (value as (prevState: Permit[]) => Permit[])(prev)
        : value;

      // Identify modified or new permits
      const changed = next.filter((n) => {
        const p = prev.find((x) => x.id === n.id);
        return !p || JSON.stringify(p) !== JSON.stringify(n);
      });

      // Synchronize with MongoDB backend
      changed.forEach((permit) => {
        fetch('/api/permits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(permit),
        })
          .then((res) => {
            if (!res.ok) {
              console.error('Failed to sync permit:', permit.id);
            }
          })
          .catch((err) => {
            console.error('Error syncing permit:', permit.id, err);
          });
      });

      // Keep localStorage for local redundancy
      localStorage.setItem('ke_ptw_permits', JSON.stringify(next));
      return next;
    });
  };

  // Load backend database data on mount or user change
  useEffect(() => {
    if (!currentUser) return;

    // 1. Fetch Permits
    fetch('/api/permits')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch permits');
        return res.json();
      })
      .then((data) => {
        setPermitsState(data);
      })
      .catch((err) => {
        console.error('Error loading permits from API, falling back to localStorage:', err);
        const localData = localStorage.getItem('ke_ptw_permits');
        if (localData) {
          try {
            setPermitsState(JSON.parse(localData));
          } catch (e) {
            setPermitsState(initialMockPermits);
          }
        } else {
          setPermitsState(initialMockPermits);
          localStorage.setItem('ke_ptw_permits', JSON.stringify(initialMockPermits));
        }
      });

    // 2. Fetch Notifications
    fetch('/api/notifications')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch notifications');
        return res.json();
      })
      .then((data) => {
        setNotifications(data);
      })
      .catch((err) => {
        console.error('Error loading notifications from API, falling back to initial values:', err);
        setNotifications(initialNotifications);
      });

    // 3. Fetch User Profiles
    fetch('/api/profiles')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch profiles');
        return res.json();
      })
      .then((data) => {
        if (data && data.length > 0) {
          setProfiles(data);
        }
      })
      .catch((err) => {
        console.error('Error loading profiles from API:', err);
      });
  }, [currentUser]);

  const handleMarkAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    
    fetch('/api/notifications/read-all', {
      method: 'POST',
    })
      .then((res) => {
        if (!res.ok) {
          console.error('Failed to mark notifications read on server');
        }
      })
      .catch((err) => {
        console.error('Error updating notifications status on server:', err);
      });
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setActiveRoleMode(user.label);
    localStorage.setItem('ke_ptw_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ke_ptw_user');
  };

  const handleSwitchRole = (roleMode: string) => {
    if (currentUser?.label === 'admin') {
      setActiveRoleMode(roleMode as 'admin' | 'employee');
    }
  };

  const handleUpdateProfile = async (username: string, updatedFields: Partial<UserProfile>) => {
    // Update locally first
    const updatedProfiles = profiles.map((p) => {
      if (p.username === username) {
        return { ...p, ...updatedFields };
      }
      return p;
    });
    setProfiles(updatedProfiles);

    if (currentUser && currentUser.username === username) {
      const updatedUser = { ...currentUser, ...updatedFields };
      setCurrentUser(updatedUser);
      localStorage.setItem('ke_ptw_user', JSON.stringify(updatedUser));
    }

    const fullProfile = updatedProfiles.find((p) => p.username === username);
    if (!fullProfile) return;

    // Save to database
    const res = await fetch(`/api/profiles/${username}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullProfile),
    });
    if (!res.ok) {
      throw new Error('Failed to sync profile change with MongoDB backend');
    }
  };

  // If not authenticated, render Login/Signup Screen
  if (!currentUser || !activeProfile) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  const isAdminAccount = currentUser.label === 'admin';
  const showAdminDashboard = isAdminAccount && activeRoleMode === 'admin';

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-gray-100 font-sans antialiased text-gray-800">
        <Header
          notifications={notifications}
          onMarkAllAsRead={handleMarkAllRead}
          currentUser={activeProfile}
          activeUsername={activeRoleMode}
          onSwitchRole={handleSwitchRole}
          onLogout={handleLogout}
        />

        <div className="flex-1 flex overflow-hidden">
          <Sidebar
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            currentUser={activeProfile}
            activeRoleMode={activeRoleMode}
          />

          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#F3F4F6] relative">
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-60" />
            
            <div className="relative z-10">
              <Routes>
                {/* Home Route: Redirect to /admin for Admins in admin mode, else render EmployeeHome */}
                <Route
                  path="/"
                  element={
                    showAdminDashboard ? (
                      <Navigate to="/admin" replace />
                    ) : (
                      <EmployeeHome currentUser={activeProfile} />
                    )
                  }
                />

                {/* Admin Dashboard: Protected for Admin label accounts only */}
                <Route
                  path="/admin"
                  element={
                    isAdminAccount ? (
                      <Overview permits={permits} onSetPermits={setPermits} currentUser={activeProfile} />
                    ) : (
                      <Navigate to="/" replace />
                    )
                  }
                />

                {/* Profile Details Page */}
                <Route
                  path="/profile"
                  element={
                    <Profile
                      currentUser={activeProfile}
                      currentUserUsername={currentUser.username}
                      onUpdateProfile={handleUpdateProfile}
                    />
                  }
                />

                {/* Operational Forms with Dynamic Submissions */}
                <Route
                  path="/vehicle-inspection"
                  element={
                    <VehicleInspection
                      key={currentUser.username}
                      permits={permits}
                      onSetPermits={setPermits}
                      currentUser={activeProfile}
                    />
                  }
                />
                <Route
                  path="/tools-ppe"
                  element={
                    <ToolsPPE
                      key={currentUser.username}
                      permits={permits}
                      onSetPermits={setPermits}
                      currentUser={activeProfile}
                    />
                  }
                />
                <Route
                  path="/shift-dispatch"
                  element={
                    <ShiftDispatch
                      key={currentUser.username}
                      permits={permits}
                      onSetPermits={setPermits}
                      currentUser={activeProfile}
                    />
                  }
                />
                <Route
                  path="/toolbox-talk"
                  element={
                    <ToolboxTalk
                      key={currentUser.username}
                      permits={permits}
                      onSetPermits={setPermits}
                      currentUser={activeProfile}
                    />
                  }
                />
                <Route
                  path="/fault-excavation"
                  element={
                    <FaultExcavation
                      key={currentUser.username}
                      permits={permits}
                      onSetPermits={setPermits}
                      currentUser={activeProfile}
                    />
                  }
                />
                <Route
                  path="/line-isolation"
                  element={
                    <LineIsolation
                      key={currentUser.username}
                      permits={permits}
                      onSetPermits={setPermits}
                      currentUser={activeProfile}
                    />
                  }
                />
                <Route
                  path="/excavation"
                  element={
                    <Excavation
                      key={currentUser.username}
                      permits={permits}
                      onSetPermits={setPermits}
                      currentUser={activeProfile}
                    />
                  }
                />
                <Route
                  path="/confined-space"
                  element={
                    <ConfinedSpace
                      key={currentUser.username}
                      permits={permits}
                      onSetPermits={setPermits}
                      currentUser={activeProfile}
                    />
                  }
                />
                <Route
                  path="/heat-shrink"
                  element={
                    <HeatShrink
                      key={currentUser.username}
                      permits={permits}
                      onSetPermits={setPermits}
                      currentUser={activeProfile}
                    />
                  }
                />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
export default App;
