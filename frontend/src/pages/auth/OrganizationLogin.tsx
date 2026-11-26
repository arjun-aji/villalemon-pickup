import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, Lock, Building, Building2, User, KeyRound, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const OrgBuildingBadge: React.FC = () => (
  <div className="w-16 h-16 rounded-full bg-[#EEF2FF] flex items-center justify-center mx-auto mb-3 shadow-inner">
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
      <path
        d="M10 40V14C10 12.9 10.9 12 12 12H26C27.1 12 28 12.9 28 14V40H10Z"
        fill="#1E3A8A"
      />
      <path
        d="M28 22H36C37.1 22 38 22.9 38 24V40H28V22Z"
        fill="#3B82F6"
      />
      <rect x="14" y="17" width="3.5" height="3.5" rx="0.75" fill="white" />
      <rect x="20.5" y="17" width="3.5" height="3.5" rx="0.75" fill="white" />
      <rect x="14" y="24" width="3.5" height="3.5" rx="0.75" fill="white" />
      <rect x="20.5" y="24" width="3.5" height="3.5" rx="0.75" fill="white" />
      <rect x="14" y="31" width="3.5" height="3.5" rx="0.75" fill="white" />
      <rect x="20.5" y="31" width="3.5" height="3.5" rx="0.75" fill="white" />
      <rect x="31" y="26" width="3.5" height="3.5" rx="0.75" fill="white" />
      <rect x="31" y="32" width="3.5" height="3.5" rx="0.75" fill="white" />
      <line x1="8" y1="40" x2="40" y2="40" stroke="#1E3A8A" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  </div>
);

const OrganizationLogin: React.FC = () => {
  // Login state
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { signInOrganization } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: err } = await signInOrganization(emailOrUsername, password);
      if (err) {
        setError(err);
      } else {
        navigate('/org/dashboard');
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check your partner credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0A1128] flex items-center justify-center p-4">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(#1E3A8A_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Top Back Link */}
        <div className="mb-4">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Portal Selection</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
          {/* Card Header */}
          <div className="p-8 pb-4 text-center">
            <OrgBuildingBadge />
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-[#1E3A8A] mb-1">
              B2B Partner Portal
            </span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Organization & Client Sign In
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Hotel, Homestay & Travel Partner direct booking and live trip tracking portal
            </p>
          </div>

          {/* Admin Managed Credentials Notice */}
          <div className="mx-8 mb-3 p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-900 text-xs">
            <div className="flex items-start gap-2">
              <KeyRound className="w-4 h-4 text-[#1E3A8A] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[11px] text-[#1E3A8A]">Admin Provisioned Access</p>
                <p className="text-[11px] text-blue-800 leading-snug mt-0.5">
                  Partner credentials (username & password) are issued by Varkala Holidays Admin. Login passwords can only be changed or reset by Administration.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="p-8 pt-2 space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-medium text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="label">Username, Email, or Phone Number *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={emailOrUsername}
                  onChange={e => setEmailOrUsername(e.target.value)}
                  placeholder="e.g. cliffstories, hotel@domain.com, or phone"
                  className="input-field pl-9 font-medium"
                  autoComplete="username"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="label">Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter partner password"
                  className="input-field pl-9 pr-10"
                  autoComplete="current-password"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 active:scale-98 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Verifying Partner Credentials...</span>
                </>
              ) : (
                <>
                  <Building2 className="w-4 h-4" />
                  <span>Sign In to Partner Portal</span>
                </>
              )}
            </button>

            <div className="text-center pt-2 text-[11px] text-slate-400">
              Need access or lost your password? Please contact <span className="font-bold text-slate-600">Varkala Holidays Office Admin</span>.
            </div>
          </form>

          {/* Footer badge */}
          <div className="bg-slate-50 px-8 py-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Varkala Holidays B2B Engine
            </span>
            <span>24/7 Operations</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationLogin;
