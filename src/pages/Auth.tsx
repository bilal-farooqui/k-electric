import React, { useState } from 'react';
import { Shield, Key, User, Building, Eye, EyeOff, UserPlus, LogIn, Award } from 'lucide-react';

interface AuthProps {
  onLoginSuccess: (user: any) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [badgeId, setBadgeId] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    const payload = isLogin
      ? { username, password }
      : { username, password, name, role, badgeId, department };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onLoginSuccess(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-primary relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8 font-sans">
      {/* Background aesthetic blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-brand-accent/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-brand-orange/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none opacity-50" />

      {/* Main card */}
      <div className="w-full max-w-lg bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 shadow-2xl relative z-10">
        
        {/* Brand identity */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="h-14 w-14 bg-brand-accent text-black font-extrabold flex items-center justify-center rounded-2xl font-display text-2xl shadow-[0_0_25px_rgba(245,158,11,0.3)] mb-4 animate-pulse">
            KE
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white font-display uppercase">
            KE Enterprise PTW Portal
          </h2>
          <p className="text-gray-400 text-xs mt-1 max-w-xs font-mono uppercase tracking-wider">
            Utility Safety & Authorization Gateway
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-black/40 p-1.5 rounded-xl border border-gray-800/80 mb-6">
          <button
            onClick={() => {
              setIsLogin(true);
              setError(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              isLogin ? 'bg-brand-accent text-black shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            <LogIn className="h-3.5 w-3.5" /> Sign In
          </button>
          <button
            onClick={() => {
              setIsLogin(false);
              setError(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              !isLogin ? 'bg-brand-accent text-black shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" /> Create Account
          </button>
        </div>

        {/* Error Alerts */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-xs font-semibold mb-6 flex items-start gap-2.5">
            <Shield className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* USERNAME */}
          <div>
            <label className="text-[10px] font-bold text-gray-450 block mb-1 uppercase tracking-wider">Username</label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black/30 border border-gray-800 focus:border-brand-accent text-white rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold outline-none transition-all placeholder-gray-600"
                placeholder="e.g. arifkhan"
              />
              <User className="absolute left-3.5 top-3 h-4 w-4 text-gray-500" />
            </div>
          </div>

          {/* PASSWORD */}
          <div>
            <label className="text-[10px] font-bold text-gray-450 block mb-1 uppercase tracking-wider">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/30 border border-gray-800 focus:border-brand-accent text-white rounded-xl pl-10 pr-10 py-2.5 text-xs font-semibold outline-none transition-all placeholder-gray-600"
                placeholder="••••••••"
              />
              <Key className="absolute left-3.5 top-3 h-4 w-4 text-gray-500" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-gray-500 hover:text-gray-400 focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* SIGNUP EXTRA FIELDS */}
          {!isLogin && (
            <div className="space-y-4 pt-2 border-t border-gray-800/60 mt-4 animate-fadeIn">
              
              {/* FULL NAME */}
              <div>
                <label className="text-[10px] font-bold text-gray-450 block mb-1 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-black/30 border border-gray-800 focus:border-brand-accent text-white rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold outline-none transition-all placeholder-gray-600"
                    placeholder="e.g. Arif Khan"
                  />
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-gray-500" />
                </div>
              </div>

              {/* BADGE ID & JOB TITLE */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-450 block mb-1 uppercase tracking-wider">Badge ID</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={badgeId}
                      onChange={(e) => setBadgeId(e.target.value)}
                      className="w-full bg-black/30 border border-gray-800 focus:border-brand-accent text-white rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold outline-none transition-all placeholder-gray-600"
                      placeholder="KE-XXXX"
                    />
                    <Shield className="absolute left-3.5 top-3 h-4 w-4 text-gray-500" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-450 block mb-1 uppercase tracking-wider">Job Role</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full bg-black/30 border border-gray-800 focus:border-brand-accent text-white rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold outline-none transition-all placeholder-gray-600"
                      placeholder="e.g. Field Technician"
                    />
                    <Award className="absolute left-3.5 top-3 h-4 w-4 text-gray-500" />
                  </div>
                </div>
              </div>

              {/* DEPARTMENT */}
              <div>
                <label className="text-[10px] font-bold text-gray-450 block mb-1 uppercase tracking-wider">Department / Division</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-black/30 border border-gray-800 focus:border-brand-accent text-white rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold outline-none transition-all placeholder-gray-600"
                    placeholder="e.g. Distribution Operations"
                  />
                  <Building className="absolute left-3.5 top-3 h-4 w-4 text-gray-500" />
                </div>
              </div>

            </div>
          )}

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-accent hover:bg-amber-500 text-black py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-lg shadow-brand-accent/15 transition-all mt-6 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : isLogin ? (
              <>
                <LogIn className="h-4 w-4" /> Authenticate & Enter Portal
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" /> Register & Configure Account
              </>
            )}
          </button>
        </form>

        {/* System seed note */}
        <div className="mt-6 text-center text-[10px] text-gray-550 border-t border-gray-800/60 pt-4 flex flex-col gap-1">
          <p className="font-mono">Default Testing Accounts:</p>
          <div className="flex justify-center gap-4 text-gray-400 mt-1">
            <span>Admin: <strong>admin</strong> / <strong>admin123</strong></span>
            <span>Employee: <strong>employee</strong> / <strong>employee123</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
