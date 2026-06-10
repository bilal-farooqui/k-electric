import React, { useState, useEffect } from 'react';
import { Award, Shield, MapPin, Building, Key, Save } from 'lucide-react';
import type { UserProfile } from '../types/ptw';

interface ProfileProps {
  currentUser: UserProfile;
  currentUserUsername: string;
  onUpdateProfile: (username: string, updated: Partial<UserProfile>) => Promise<void>;
}

export const Profile: React.FC<ProfileProps> = ({
  currentUser,
  currentUserUsername,
  onUpdateProfile,
}) => {
  const [name, setName] = useState(currentUser.name);
  const [badgeId, setBadgeId] = useState(currentUser.badgeId);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state if currentUser changes
  useEffect(() => {
    setName(currentUser.name);
    setBadgeId(currentUser.badgeId);
  }, [currentUser]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !badgeId) {
      alert('All profile fields must be filled.');
      return;
    }
    setIsSaving(true);
    try {
      await onUpdateProfile(currentUserUsername, {
        name,
        badgeId,
      });
      alert('Profile details successfully synchronized with MongoDB database!');
    } catch (err) {
      console.error(err);
      alert('Failed to save profile details.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand-navy font-display uppercase">
          Profile Settings
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Edit your security clearance details, badge ID, and department settings synced with MongoDB.
        </p>
      </div>

      {/* Main Profile Card Grid */}
      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Avatar & Digital ID Card */}
        <div className="bg-brand-primary text-white p-6 rounded-2xl shadow-md flex flex-col items-center justify-between text-center relative overflow-hidden border border-gray-800 h-[380px]">
          {/* Subtle design element */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="space-y-4 flex flex-col items-center w-full">
            <div className="h-20 w-20 bg-brand-accent text-black font-extrabold flex items-center justify-center rounded-2xl font-display text-2xl border-4 border-white/10 shadow-lg mt-3">
              {name ? name.split(' ').map(n => n[0]).join('') : 'U'}
            </div>
            
            <div>
              <h2 className="text-lg font-bold font-display">{name || 'Guest User'}</h2>
              <span className="inline-block mt-1 px-3 py-1 bg-white/10 border border-white/5 text-[10px] font-mono tracking-wider text-brand-accent rounded-full uppercase">
                {currentUser.role || 'Field Operator'}
              </span>
            </div>
          </div>

          <div className="w-full bg-black/30 border border-white/5 rounded-xl p-4 mt-4 text-left space-y-2 text-xs font-mono">
            <div className="flex justify-between border-b border-white/5 pb-1.5">
              <span className="text-gray-400">Badge ID:</span>
              <span className="text-brand-accent font-bold">{badgeId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Clearance:</span>
              <span className="text-emerald-400 font-bold uppercase flex items-center gap-0.5">
                <Shield className="h-3 w-3" /> {currentUser.role === 'Principal Safety Officer' ? 'Lvl 4 Admin' : 'Lvl 2 Field'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Contact Details & Workspace Roles */}
        <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-xs md:col-span-2 flex flex-col justify-between gap-6">
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-gray-450 uppercase tracking-widest border-b border-gray-150 pb-2 flex items-center gap-1.5">
              <Building className="h-4 w-4 text-brand-navy" /> Edit Profile Details (MongoDB Synced)
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-550 block mb-1">FULL NAME</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-brand-orange"
                  placeholder="e.g. Arif Khan"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-550 block mb-1">BADGE ID</label>
                <input
                  type="text"
                  value={badgeId}
                  onChange={(e) => setBadgeId(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-brand-orange"
                  placeholder="e.g. KE-0284"
                />
              </div>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-gray-600 pt-2">
              <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <MapPin className="h-4.5 w-4.5 text-gray-400 shrink-0" />
                <div>
                  <span className="text-gray-400 block text-[9px] uppercase tracking-wider">Subdivision / Grid</span>
                  <span className="text-brand-navy">KE Central Grid Station</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <Award className="h-4.5 w-4.5 text-gray-400 shrink-0" />
                <div>
                  <span className="text-gray-400 block text-[9px] uppercase tracking-wider">Clearance Status</span>
                  <span className="text-brand-navy">{currentUser.role === 'Principal Safety Officer' ? 'Approver & Signatory' : 'Submitter & Operator'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center border-t border-gray-150 pt-4 mt-auto">
            <div className="text-[11px] text-gray-450 flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5 text-brand-navy" /> Role is managed by utility security systems.
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 bg-brand-navy hover:bg-brand-primary text-brand-accent px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> {isSaving ? 'Syncing...' : 'Save to Database'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
