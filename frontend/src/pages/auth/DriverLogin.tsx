import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, User, Lock, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

// Pale green circular icon with Emerald car matching the reference landing card
const DriverCarBadge: React.FC = () => (
  <div className="w-16 h-16 rounded-full bg-[#E6F7F0] flex items-center justify-center mx-auto mb-3 shadow-inner">
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
      <path
        d="M11 22C11 19.6 12.6 17.6 14.8 17L19.5 15.6C21 15.2 27 15.2 28.5 15.6L33.2 17C35.4 17.6 37 19.6 37 22V32C37 33.7 35.7 35 34 35H33V36.5C33 37.9 31.9 39 30.5 39C29.1 39 28 37.9 28 36.5V35H20V36.5C20 37.9 18.9 39 17.5 39C16.1 39 15 37.9 15 36.5V35H14C12.3 35 11 33.7 11 32V22Z"
        fill="#00875A"
      />
      <path
        d="M15 24.5C15 23.1 16.1 22 17.5 22H30.5C31.9 22 33 23.1 33 24.5V26.5H15V24.5Z"
        fill="white"
        fillOpacity="0.92"
      />
      <circle cx="16.5" cy="31" r="2" fill="white" />
      <circle cx="31.5" cy="31" r="2" fill="white" />
      <rect x="21" y="30.5" width="6" height="1.8" rx="0.9" fill="#005A3C" />
    </svg>
  </div>
);

const DriverLogin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signInDriver } = useAuth();
  const navigate = useNavigate();

  // Reset fields on mount to prevent any browser autofill carryover
  useEffect(() => {
    setUsername('');
    setPassword('');
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: err } = await signInDriver(username, password);
      if (err) {
        setError(err);
      } else {
        navigate('/driver/dashboard');
      }
    } catch (err: any) {
      setError(err?.message || 'Driver login failed. Please verify your credentials.');
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
      <div className="w-full max-w-sm relative z-10 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#10243A] hover:text-[#00875A] bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-sm border border-slate-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Selection</span>
        </Link>

        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
          <MapPin className="h-3.5 w-3.5 text-[#00875A]" />
          <span>Varkala, Kerala</span>
        </div>
      </div>

      {/* Driver Login Card (Styled to match the reference driver card) */}
      <div className="w-full max-w-sm relative z-10 my-6">
        <div className="bg-white rounded-[28px] shadow-[0_20px_50px_rgba(16,36,58,0.08)] overflow-hidden border border-slate-100">
          {/* Card Header */}
          <div className="pt-8 pb-4 px-8 text-center bg-gradient-to-b from-slate-50/70 to-white">
            <DriverCarBadge />
            <h1 className="text-2xl font-black tracking-tight text-[#10243A]">Driver Portal</h1>
            <p className="text-xs text-[#64748B] mt-1 max-w-[240px] mx-auto">
              Access upcoming trips, enroll in available trips and update trip expenses.
            </p>
          </div>

          {/* Form with autofill protection */}
          <form onSubmit={handleLogin} className="p-8 pt-2 space-y-4" autoComplete="off">
            {/* Hidden dummy fields to absorb aggressive browser autofill */}
            <input type="text" style={{ display: 'none' }} tabIndex={-1} />
            <input type="password" style={{ display: 'none' }} tabIndex={-1} />

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-expense text-xs rounded-xl font-medium leading-relaxed">
                {error}
              </div>
            )}

            <div>
              <label className="label">Driver Username</label>
              <div className="relative">
                <input
                  type="text"
                  name="driver_portal_username_field"
                  id="driver_portal_username_field"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter assigned driver username"
                  required
                  className="input-field pl-10"
                  autoComplete="off"
                  data-lpignore="true"
                  data-form-type="other"
                />
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">Password</label>
                <button
                  type="button"
                  onClick={() => alert('Please contact VillaLemon management to reset your driver login credentials.')}
                  className="text-xs text-[#00875A] hover:underline font-semibold"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="driver_portal_password_field"
                  id="driver_portal_password_field"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter driver password"
                  required
                  className="input-field pl-10 pr-10"
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-form-type="other"
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
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
                  <span>LOGIN TO DRIVER PORTAL</span>
                  <Lock className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 text-center text-xs text-[#94A3B8] pb-4">
        VillaLemon Pickup | Pickup & Driver Management • Varkala
      </footer>
    </div>
  );
};

export default DriverLogin;
