import React, { useState, useEffect } from 'react';
import { Bell, Search, User, LogOut, FileText, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Notification, UserProfile } from '../types/ptw';

interface HeaderProps {
  notifications: Notification[];
  onMarkAllAsRead: () => void;
  currentUser: UserProfile;
  activeUsername: string;
  onSwitchRole: (username: string) => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  notifications,
  onMarkAllAsRead,
  currentUser,
  activeUsername,
  onSwitchRole,
  onLogout,
}) => {
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getShiftInfo = (date: Date) => {
    const hours = date.getHours();
    if (hours >= 6 && hours < 14) {
      return { name: 'Morning Shift', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
    } else if (hours >= 14 && hours < 22) {
      return { name: 'Evening Shift', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
    } else {
      return { name: 'Night Shift', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' };
    }
  };

  const shift = getShiftInfo(time);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  return (
    <header className="sticky top-0 z-40 bg-brand-primary border-b border-gray-800 text-white px-6 py-3.5 flex items-center justify-between shadow-md print:hidden">
      {/* Brand Info */}
      <div className="flex items-center gap-3">
        <div 
          onClick={() => navigate('/')} 
          className="h-9 w-9 bg-brand-accent rounded-lg flex items-center justify-center font-extrabold text-black cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.25)] hover:scale-105 transition-transform"
        >
          KE
        </div>
        <div>
          <span 
            onClick={() => navigate('/')} 
            className="font-display font-bold text-base md:text-lg tracking-tight cursor-pointer hover:text-brand-accent transition-colors"
          >
            KE Enterprise PTW Portal
          </span>
          <span className="hidden md:inline-block ml-3 px-2 py-0.5 bg-white/10 text-[10px] text-gray-300 font-mono rounded-sm border border-white/5 uppercase">
            Powering Utility Safety
          </span>
        </div>
      </div>

      {/* Clock & Shift Indicator */}
      <div className="hidden lg:flex items-center gap-4 bg-gray-900/60 px-4 py-1.5 rounded-xl border border-gray-800/80 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">{formatDate(time)}</span>
          <span className="h-1.5 w-1.5 rounded-full bg-gray-700" />
          <span className="text-brand-accent font-semibold tabular-nums">{formatTime(time)}</span>
        </div>
        <span className="h-3 w-px bg-gray-800" />
        <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold tracking-wide uppercase ${shift.color}`}>
          {shift.name}
        </span>
      </div>

      {/* Action Tray */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden sm:block">
          <input
            type="text"
            placeholder="Search Permit ID or site..."
            className="bg-gray-900 border border-gray-800 focus:border-brand-accent text-white text-xs rounded-xl pl-9 pr-4 py-2 w-48 focus:w-64 transition-all duration-300 outline-none placeholder-gray-500"
          />
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-500" />
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifDropdown(!showNotifDropdown);
              setShowProfileDropdown(false);
            }}
            className="p-2 hover:bg-gray-800 rounded-xl relative transition-all"
            title="Notifications"
          >
            <Bell className="h-5 w-5 text-gray-400 hover:text-white transition-colors" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-brand-orange text-[9px] font-extrabold flex items-center justify-center rounded-full text-white animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-2.5 w-80 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden py-1 z-50">
              <div className="px-4 py-2.5 border-b border-gray-800 flex justify-between items-center bg-gray-950">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-300">Safety Alerts</span>
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllAsRead}
                    className="text-[10px] text-brand-accent hover:underline font-bold"
                  >
                    Mark read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-500">No active alerts</div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className={`p-3 border-b border-gray-850 hover:bg-gray-850 flex gap-2.5 transition-colors ${
                        !n.read ? 'bg-gray-850/40' : ''
                      }`}
                    >
                      {n.type === 'alert' ? (
                        <AlertTriangle className="h-4.5 w-4.5 text-red-500 shrink-0 mt-0.5" />
                      ) : (
                        <FileText className="h-4.5 w-4.5 text-blue-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className={`text-xs font-bold ${!n.read ? 'text-white' : 'text-gray-400'}`}>
                          {n.title}
                        </div>
                        <div className="text-[11px] text-gray-450 mt-0.5">{n.message}</div>
                        <div className="text-[9px] text-gray-600 font-mono mt-1">{n.time}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <span className="h-5 w-px bg-gray-800" />

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileDropdown(!showProfileDropdown);
              setShowNotifDropdown(false);
            }}
            className="flex items-center gap-2 hover:bg-gray-800 p-1.5 rounded-xl transition-all"
          >
            <div className="h-8.5 w-8.5 bg-brand-accent text-black font-extrabold flex items-center justify-center rounded-xl font-display text-sm tracking-tight border border-brand-accent/20">
              {currentUser.name ? currentUser.name.split(' ').map(n => n[0]).join('') : 'U'}
            </div>
            <div className="text-left hidden md:block">
              <div className="text-xs font-bold text-white block max-w-28 truncate">{currentUser.name || 'Sign In'}</div>
              <div className="text-[9px] text-gray-500 font-mono tracking-wide uppercase">{currentUser.role || 'Guest'}</div>
            </div>
          </button>

          {showProfileDropdown && (
            <div className="absolute right-0 mt-2.5 w-60 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden py-1.5 z-50 text-xs">
              <div className="px-4 py-2 border-b border-gray-850">
                <p className="font-bold text-white">{currentUser.name || 'Guest User'}</p>
                <p className="text-[10px] text-gray-500 font-mono mt-0.5">{currentUser.role || 'Visitor'}</p>
              </div>
              
              <button
                onClick={() => {
                  setShowProfileDropdown(false);
                  navigate('/profile');
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-800 flex items-center gap-2 text-gray-300 hover:text-white"
              >
                <User className="h-3.5 w-3.5 text-gray-400" /> Profile Details
              </button>

              {currentUser.label === 'admin' && (
                <>
                  <div className="px-4 py-1.5 border-t border-gray-850 bg-black/20 text-[9px] text-gray-550 font-mono font-bold uppercase tracking-wider">
                    Switch Role / Profile
                  </div>

                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      onSwitchRole('admin');
                    }}
                    className={`w-full text-left px-4 py-2.5 hover:bg-gray-800 flex items-center justify-between transition-colors ${
                      activeUsername === 'admin' ? 'text-brand-accent font-bold bg-white/5' : 'text-gray-300'
                    }`}
                  >
                    <span>Safety Officer (Admin)</span>
                    {activeUsername === 'admin' && <span className="h-1.5 w-1.5 rounded-full bg-brand-accent shadow-[0_0_8px_#f59e0b]" />}
                  </button>

                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      onSwitchRole('employee');
                    }}
                    className={`w-full text-left px-4 py-2.5 hover:bg-gray-800 flex items-center justify-between transition-colors ${
                      activeUsername === 'employee' ? 'text-brand-accent font-bold bg-white/5' : 'text-gray-300'
                    }`}
                  >
                    <span>Field Employee (Operator)</span>
                    {activeUsername === 'employee' && <span className="h-1.5 w-1.5 rounded-full bg-brand-accent shadow-[0_0_8px_#f59e0b]" />}
                  </button>
                </>
              )}

              <button
                onClick={() => {
                  setShowProfileDropdown(false);
                  onLogout();
                  navigate('/');
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-800 flex items-center gap-2 text-red-400 hover:text-red-300 border-t border-gray-850"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
