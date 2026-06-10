import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
  ChevronRight,
  FileSpreadsheet,
  Users,
  UserCheck,
  UserX
} from 'lucide-react';
import type { Permit, UserProfile } from '../types/ptw';

interface OverviewProps {
  permits: Permit[];
  onSetPermits: React.Dispatch<React.SetStateAction<Permit[]>>;
  currentUser?: UserProfile | null;
}

export const Overview: React.FC<OverviewProps> = ({ permits, onSetPermits, currentUser }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'permits' | 'users'>('permits');
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    draft: 0,
    failed: 0,
  });

  // Calculate statistics
  useEffect(() => {
    const total = permits.length;
    const approved = permits.filter((p) => p.status === 'approved').length;
    const pending = permits.filter((p) => p.status === 'pending').length;
    const draft = permits.filter((p) => p.status === 'draft').length;
    const rejected = permits.filter((p) => p.status === 'rejected').length;

    setStats({
      total,
      approved,
      pending,
      draft,
      failed: rejected,
    });
  }, [permits]);

  // Fetch users when the Users Directory tab is active
  useEffect(() => {
    if (activeTab === 'users') {
      fetch('/api/users')
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch users');
          return res.json();
        })
        .then((data) => {
          setUsersList(data);
        })
        .catch((err) => {
          console.error('Error fetching users:', err);
        });
    }
  }, [activeTab]);

  const ptwForms = [
    { name: 'Vehicle Inspection Checklist', path: '/vehicle-inspection', code: 'KE-PTW-VI-01' },
    { name: 'Tools & PPE Checklist', path: '/tools-ppe', code: 'KE-PTW-TP-02' },
    { name: 'Shift Dispatching Checklist', path: '/shift-dispatch', code: 'KE-PTW-SD-03' },
    { name: 'Site TBT (Toolbox Talk)', path: '/toolbox-talk', code: 'KE-PTW-TBT-04' },
    { name: 'Receiving Fault & Excavation Request', path: '/fault-excavation', code: 'KE-PTW-FE-05' },
    { name: 'Line Isolation PTW', path: '/line-isolation', code: 'KE-PTW-LI-06' },
    { name: 'Excavation PTW', path: '/excavation', code: 'KE-PTW-EX-07' },
    { name: 'Confined Space PTW', path: '/confined-space', code: 'KE-PTW-CS-08' },
    { name: 'Heat Shrink PTW', path: '/heat-shrink', code: 'KE-PTW-HS-09' },
  ];

  const handleApprove = (id: string) => {
    const updated = permits.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          status: 'approved' as const,
          approvedBy: currentUser ? `${currentUser.name} (${currentUser.role})` : 'Maheen Mahad (Principal Safety Engineer)',
          approvedAt: new Date().toLocaleString(),
        };
      }
      return p;
    });
    onSetPermits(updated);
    localStorage.setItem('ke_ptw_permits', JSON.stringify(updated));
  };

  const handleReject = (id: string) => {
    const updated = permits.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          status: 'rejected' as const,
        };
      }
      return p;
    });
    onSetPermits(updated);
    localStorage.setItem('ke_ptw_permits', JSON.stringify(updated));
  };

  const handleToggleUserLabel = async (username: string, currentLabel: 'admin' | 'employee') => {
    const nextLabel = currentLabel === 'admin' ? 'employee' : 'admin';
    try {
      const res = await fetch('/api/users/update-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, label: nextLabel }),
      });
      if (!res.ok) throw new Error('Failed to update user authorization level');
      
      setUsersList((prev) =>
        prev.map((u) => (u.username === username ? { ...u, label: nextLabel } : u))
      );
    } catch (err) {
      console.error(err);
      alert('Error updating user clearance: Failed to synchronize with database.');
    }
  };

  const getFormName = (type: string) => {
    const item = ptwForms.find((f) => f.path.includes(type));
    return item ? item.name : type.replace('-', ' ');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-navy font-display uppercase">
            KE Safety & Control Administration
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Real-time safety checks, authorization statuses, and user clearance governance.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-white/60 backdrop-blur p-1 rounded-xl border border-gray-200 w-fit shrink-0">
          <button
            onClick={() => setActiveTab('permits')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'permits'
                ? 'bg-brand-navy text-white shadow'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" /> Permit Dashboard
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'users'
                ? 'bg-brand-navy text-white shadow'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="h-3.5 w-3.5" /> User & Role Directory
          </button>
        </div>
      </div>

      {activeTab === 'permits' ? (
        <>
          {/* Stats Cards Row */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs relative overflow-hidden flex flex-col justify-between h-28">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Total Permits</span>
                <span className="text-2xl font-extrabold text-brand-navy mt-1 font-display block">{stats.total}</span>
              </div>
              <div className="absolute right-4 top-4 bg-gray-50 p-2 rounded-xl text-gray-400">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs relative overflow-hidden flex flex-col justify-between h-28">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block font-sans">Active & Approved</span>
                <span className="text-2xl font-extrabold text-emerald-600 mt-1 font-display block">{stats.approved}</span>
              </div>
              <div className="absolute right-4 top-4 bg-emerald-50 p-2 rounded-xl text-emerald-500">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs relative overflow-hidden flex flex-col justify-between h-28">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block font-sans">Pending Sign-off</span>
                <span className="text-2xl font-extrabold text-amber-500 mt-1 font-display block">{stats.pending}</span>
              </div>
              <div className="absolute right-4 top-4 bg-amber-50 p-2 rounded-xl text-amber-500">
                <Clock className="h-5 w-5 animate-pulse" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs relative overflow-hidden flex flex-col justify-between h-28">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block font-sans">Draft Permits</span>
                <span className="text-2xl font-extrabold text-gray-500 mt-1 font-display block">{stats.draft}</span>
              </div>
              <div className="absolute right-4 top-4 bg-gray-50 p-2 rounded-xl text-gray-500">
                <FileText className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs relative overflow-hidden flex flex-col justify-between h-28 col-span-2 lg:col-span-1">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block font-sans">Failed Safety checks</span>
                <span className="text-2xl font-extrabold text-red-650 mt-1 font-display block">{stats.failed}</span>
              </div>
              <div className="absolute right-4 top-4 bg-red-50 p-2 rounded-xl text-red-500">
                <ShieldAlert className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Main Grid: Performance charts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-xs p-5 lg:col-span-12 flex flex-col justify-between">
              <h2 className="text-sm font-bold text-brand-navy tracking-wider uppercase flex items-center gap-1.5 border-b border-gray-150 pb-2.5">
                <AlertTriangle className="h-4.5 w-4.5 text-brand-orange" /> Safety Permit Distribution
              </h2>
              
              <div className="flex-1 flex flex-col justify-center items-center py-4">
                {permits.length === 0 ? (
                  <div className="text-xs text-gray-400 italic">No permits generated yet to render statistics chart.</div>
                ) : (
                  <div className="w-full space-y-4">
                    {(['vehicle-inspection', 'tools-ppe', 'line-isolation', 'excavation'] as const).map((type) => {
                      const count = permits.filter((p) => p.type === type).length;
                      const pct = permits.length > 0 ? (count / permits.length) * 100 : 0;
                      const label = getFormName(type);
                      return (
                        <div key={type} className="space-y-1">
                          <div className="flex justify-between text-[11px] font-bold text-gray-650">
                            <span>{label}</span>
                            <span className="font-mono text-brand-navy">{count} ({Math.round(pct)}%)</span>
                          </div>
                          <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full bg-brand-navy transition-all duration-500 ${
                                pct > 0 ? 'border-r-2 border-brand-accent' : ''
                              }`}
                              style={{ width: `${pct}%` }} 
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-150 text-[10px] text-gray-500 leading-normal">
                <strong>System Standard</strong>: Outages, excavation tasks, and tools checklists must be submitted and approved prior to team deployment.
              </div>
            </div>
          </div>

          {/* Active and Recent Permit Operations */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-sm font-bold text-brand-navy tracking-wider uppercase font-display">
                Recent Permit Operations
              </h2>
              <span className="bg-gray-100 border border-gray-200 text-gray-600 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold">
                {permits.length} Records
              </span>
            </div>

            {permits.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400 italic">
                No permit reports currently created in the logs. Click a form above to submit your first permit.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-[10px] font-bold text-gray-555 uppercase border-b border-gray-250 tracking-wider">
                      <th className="px-5 py-3">Permit Ref</th>
                      <th className="px-5 py-3">Task Name</th>
                      <th className="px-5 py-3">Created By</th>
                      <th className="px-5 py-3">Timestamp</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-xs">
                    {permits.map((permit) => {
                      const statusColors = {
                        draft: 'bg-gray-100 text-gray-800 border-gray-305',
                        pending: 'bg-amber-100 text-amber-800 border-amber-305',
                        approved: 'bg-emerald-100 text-emerald-800 border-emerald-305',
                        rejected: 'bg-red-100 text-red-800 border-red-305',
                      };

                      return (
                        <tr key={permit.id} className="hover:bg-gray-55/30 transition-colors">
                          <td className="px-5 py-3.5 font-mono font-bold text-brand-navy">{permit.id}</td>
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-brand-navy">{getFormName(permit.type)}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5 font-semibold">Electrical Utility Division</div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="font-semibold text-gray-700">{permit.submittedBy}</div>
                            <div className="text-[10px] text-gray-450 font-semibold">Badge: Verified</div>
                          </td>
                          <td className="px-5 py-3.5 text-gray-500 font-mono">{permit.createdAt}</td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2.5 py-0.5 border text-[10px] font-bold rounded-full uppercase ${statusColors[permit.status]}`}>
                              {permit.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => navigate(ptwForms.find((f) => f.path.includes(permit.type))?.path || '/')}
                              className="text-[10px] bg-white border border-gray-300 hover:bg-gray-55 text-gray-700 px-2.5 py-1 rounded-md font-bold transition-all inline-flex items-center gap-1 cursor-pointer shadow-xs"
                            >
                              View/Fill <ChevronRight className="h-3 w-3" />
                            </button>
                            
                            {permit.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApprove(permit.id)}
                                  className="text-[10px] bg-emerald-650 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer shadow-xs"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleReject(permit.id)}
                                  className="text-[10px] bg-red-650 hover:bg-red-700 text-white px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer shadow-xs"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* User & Label Directory */
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-brand-navy tracking-wider uppercase font-display">
                User & System Access Directory
              </h2>
              <p className="text-[11px] text-gray-400 mt-0.5 font-semibold">
                Manage K-Electric portal profiles and elevate account authorization levels.
              </p>
            </div>
            <span className="bg-gray-100 border border-gray-200 text-gray-600 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold">
              {usersList.length} Accounts Registered
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-55 text-[10px] font-bold text-gray-555 uppercase border-b border-gray-250 tracking-wider">
                  <th className="px-5 py-3">Employee Details</th>
                  <th className="px-5 py-3">Username</th>
                  <th className="px-5 py-3">Badge ID</th>
                  <th className="px-5 py-3">Portal Clearance Level</th>
                  <th className="px-5 py-3 text-right">Access Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-xs">
                {usersList.map((user) => {
                  const isUserAdmin = user.label === 'admin';
                  return (
                    <tr key={user.username} className="hover:bg-gray-55/30 transition-colors">
                      <td className="px-5 py-3.5 flex items-center gap-3">
                        <div className="h-8 w-8 bg-brand-navy text-brand-accent font-extrabold flex items-center justify-center rounded-lg text-xs border border-brand-accent/20">
                          {user.name ? user.name.split(' ').map((n) => n[0]).join('') : 'U'}
                        </div>
                        <div>
                          <div className="font-bold text-brand-navy">{user.name}</div>
                          <div className="text-[10px] text-gray-400 mt-0.5 font-semibold">{user.role}</div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-gray-600">{user.username}</td>
                      <td className="px-5 py-3.5 font-mono text-gray-600">{user.badgeId}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-0.5 border text-[10px] font-bold rounded-full uppercase ${
                          isUserAdmin 
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-305' 
                            : 'bg-gray-100 text-gray-600 border-gray-305'
                        }`}>
                          {isUserAdmin ? 'Lvl 4 Admin' : 'Lvl 2 Operator'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleToggleUserLabel(user.username, user.label)}
                          disabled={user.username === currentUser?.username}
                          className={`text-[10px] px-3 py-1.5 rounded-lg font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs ${
                            isUserAdmin
                              ? 'bg-red-50 hover:bg-red-100 text-red-650 border border-red-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-650 border border-emerald-200'
                          }`}
                          title={user.username === currentUser?.username ? 'You cannot demote your own account' : ''}
                        >
                          {isUserAdmin ? (
                            <>
                              <UserX className="h-3 w-3" /> Demote to Operator
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-3 w-3" /> Promote to Admin
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div className="bg-gray-50 p-4 border-t border-gray-200 text-[10px] text-gray-500 leading-normal flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 text-brand-orange shrink-0 mt-0.5" />
            <div>
              <strong>System Governance Protocol</strong>: Administrative clearance allows users to perform final safety approvals, view audit checklists, and modify operator roles. Do not grant admin level clearance unless personnel have completed Level 4 Safety Signatory certifications.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
