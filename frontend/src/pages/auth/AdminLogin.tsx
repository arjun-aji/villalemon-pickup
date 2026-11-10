import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, Lock, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

// Pale blue circular icon with Navy shield matching the reference landing card
const AdminShieldBadge: React.FC = () => (
  <div className="w-16 h-16 rounded-full bg-[#EBF3FE] flex items-center justify-center mx-auto mb-3 shadow-inner">
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
      <path
        d="M24 5L9 10.5V22.5C9 31.8 15.4 40.2 24 43C32.6 40.2 39 31.8 39 22.5V10.5L24 5Z"
        fill="#0F3870"
      />
      <rect x="18" y="17.5" width="5" height="5" rx="1" fill="white" />
      <rect x="25" y="17.5" width="5" height="5" rx="1" fill="white" />
      <rect x="18" y="24.5" width="5" height="5" rx="1" fill="white" />
      <rect x="25" y="24.5" width="5" height="5" rx="1" fill="white" />
    </svg>
  </div>
);

const AdminLogin: React.FC = () => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signInAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: err } = await signInAdmin(emailOrUsername, password);
      if (err) {
        setError(err);
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check credentials.');
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
          className="inline-flex items-center gap-2 text-xs font-bold text-[#10243A] hover:text-[#00875A] bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-sm border border-slate-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Portal Selection</span>
        </Link>

        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
          <MapPin className="h-3.5 w-3.5 text-[#00875A]" />
          <span>Varkala, Kerala</span>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md relative z-10 my-6">
        <div className="bg-white rounded-[28px] shadow-[0_20px_50px_rgba(16,36,58,0.08)] overflow-hidden border border-slate-100">
          {/* Card Header */}
          <div className="pt-8 pb-4 px-8 text-center bg-gradient-to-b from-slate-50/70 to-white">
            <AdminShieldBadge />
            <h1 className="text-2xl font-black tracking-tight text-[#10243A]">Admin Portal</h1>
            <p className="text-xs text-[#64748B] mt-1 max-w-[280px] mx-auto">
              Manage drivers, trips, expenses, settlements and business insights.
            </p>
          </div>

          {/* Login Form */}
          <div className="px-8 pb-8 pt-4">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-expense text-xs rounded-xl font-medium leading-relaxed">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="label">Admin Email or Username</label>
                <input
                  type="text"
                  value={emailOrUsername}
                  onChange={e => setEmailOrUsername(e.target.value)}
                  placeholder="Enter admin email or username"
                  required
                  className="input-field"
                  autoComplete="username"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label mb-0">Password</label>
                  <button
                    type="button"
                    onClick={() =>
                      alert('Please check your registered Master Admin credentials or Supabase Auth dashboard.')
                    }
                    className="text-xs text-[#00875A] hover:underline font-semibold"
                  >
                    Need Help?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    required
                    className="input-field pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#007A50] hover:bg-[#006642] active:bg-[#005738] text-white font-extrabold text-xs sm:text-sm tracking-wider uppercase py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[#007A50]/25 transition-all mt-6"
              >
                {loading ? (
                  <LoadingSpinner size="sm" className="border-white border-t-transparent" />
                ) : (
                  <>
                    <span>LOGIN TO ADMIN PORTAL</span>
                    <Lock className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 text-center text-xs text-[#94A3B8] pb-4">
        VillaLemon Pickup | Pickup & Driver Management • Varkala
      </footer>
    </div>
  );
};

export default AdminLogin;
