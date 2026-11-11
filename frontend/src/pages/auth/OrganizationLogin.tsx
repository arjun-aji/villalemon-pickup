import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, Lock, MapPin, Building, Building2 } from 'lucide-react';
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
    <div className="min-h-screen bg-[#F5F8FC] flex flex-col justify-between items-center px-4 py-8 relative overflow-hidden select-none font-sans">
      {/* Background coastal scenery */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30 pointer-events-none"
        style={{
          backgroundImage: `url('/assets/varkala-desktop-bg.jpg')`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#F5F8FC]/60 via-[#F5F8FC]/90 to-[#F5F8FC] pointer-events-none" />

      {/* Top back navigation */}
      <div className="w-full max-w-md relative z-10 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#10243A] hover:text-[#1E3A8A] bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-sm border border-slate-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Portal Selection</span>
        </Link>

        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
          <MapPin className="h-3.5 w-3.5 text-[#00875A]" />
          <span>Varkala, Kerala</span>
        </div>
      </div>

      {/* Organization Login Card */}
      <div className="w-full max-w-md relative z-10 my-6">
        <div className="bg-white rounded-[28px] shadow-[0_20px_50px_rgba(16,36,58,0.08)] overflow-hidden border border-slate-100">
          {/* Card Header */}
          <div className="pt-8 pb-4 px-8 text-center bg-gradient-to-b from-slate-50/70 to-white">
            <OrgBuildingBadge />
            <h1 className="text-2xl font-black tracking-tight text-[#10243A]">Partner Portal</h1>
            <p className="text-xs text-[#64748B] mt-1">
              Hotels, homestays, tour operators & corporate partner management
            </p>
          </div>

          <form onSubmit={handleLogin} className="p-8 pt-4 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-expense text-xs rounded-xl font-medium leading-relaxed">
                {error}
              </div>
            )}

            <div>
              <label className="label">Organization Email or Username</label>
              <div className="relative">
                <input
                  type="text"
                  value={emailOrUsername}
                  onChange={e => setEmailOrUsername(e.target.value)}
                  placeholder="e.g. villalemonhometay@gmail.com"
                  required
                  className="input-field pl-10"
                />
                <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">Password</label>
                <button
                  type="button"
                  onClick={() => alert('Please contact VillaLemon management to reset your organization credentials.')}
                  className="text-xs text-[#1E3A8A] hover:underline font-semibold"
                >
                  Need Help?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="input-field pl-10 pr-10"
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1E3A8A] hover:bg-[#172554] active:bg-[#0F172A] text-white font-extrabold text-xs tracking-wider uppercase py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#1E3A8A]/25 transition-all mt-2 disabled:opacity-50"
            >
              {loading ? (
                <LoadingSpinner size="sm" className="border-white border-t-transparent" />
              ) : (
                <>
                  <span>LOGIN TO PARTNER PORTAL</span>
                  <Lock className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center relative z-10 text-xs text-slate-400">
        <p>VillaLemon Pickup | Partner Portal • Varkala</p>
      </div>
    </div>
  );
};

export default OrganizationLogin;

