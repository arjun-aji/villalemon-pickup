import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, Lock, MapPin, Building, Building2, User, Phone, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
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
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'login' | 'signup'>(() => {
    return searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  });

  // Login state
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Sign up state
  const [signupForm, setSignupForm] = useState({
    name: '',
    type: 'hotel' as 'hotel' | 'homestay' | 'tour_operator' | 'corporate' | 'travel_agent',
    contact_person: '',
    phone: '',
    whatsapp: '',
    email: '',
    password: '',
    gst_number: '',
    billing_address: '',
  });

  const { signInOrganization } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!signupForm.name.trim() || !signupForm.contact_person.trim() || !signupForm.phone.trim() || !signupForm.email.trim() || !signupForm.password.trim()) {
      setError('Please fill in all required fields marked with *');
      return;
    }

    try {
      setLoading(true);

      // 1. Supabase Auth Sign Up
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: signupForm.email.trim().toLowerCase(),
        password: signupForm.password,
        options: {
          data: {
            role: 'organization',
            full_name: signupForm.name.trim(),
            contact_person: signupForm.contact_person.trim(),
            phone: signupForm.phone.trim(),
          },
        },
      });

      if (authErr && !authErr.message.includes('already registered')) {
        throw authErr;
      }

      // 2. Insert into organizations table
      const { error: orgErr } = await supabase
        .from('organizations')
        .insert({
          name: signupForm.name.trim(),
          type: signupForm.type,
          contact_person: signupForm.contact_person.trim(),
          phone: signupForm.phone.trim(),
          whatsapp: signupForm.whatsapp.trim() || null,
          email: signupForm.email.trim().toLowerCase(),
          gst_number: signupForm.gst_number.trim() || null,
          billing_address: signupForm.billing_address.trim() || null,
          status: 'active',
          payment_terms: 'Weekly settlement',
          credit_limit: 50000,
        });

      if (orgErr) {
        console.warn('Could not insert org row:', orgErr);
      }

      setSuccessMsg('Partner registration successful! Logging you in...');
      setTimeout(async () => {
        try {
          const { error: loginErr } = await signInOrganization(signupForm.email, signupForm.password);
          if (!loginErr) {
            navigate('/org/dashboard');
          } else {
            setMode('login');
            setEmailOrUsername(signupForm.email);
            setSuccessMsg('Account created! Please enter your password to sign in.');
          }
        } catch {
          setMode('login');
          setEmailOrUsername(signupForm.email);
        }
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again or contact support.');
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
      <div className="w-full max-w-lg relative z-10 flex items-center justify-between">
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
      <div className="w-full max-w-lg relative z-10 my-6">
        <div className="bg-white rounded-[28px] shadow-[0_20px_50px_rgba(16,36,58,0.08)] overflow-hidden border border-slate-100">
          {/* Card Header */}
          <div className="pt-7 pb-3 px-8 text-center bg-gradient-to-b from-slate-50/70 to-white">
            <OrgBuildingBadge />
            <h1 className="text-2xl font-black tracking-tight text-[#10243A]">Partner Portal</h1>
            <p className="text-xs text-[#64748B] mt-1">
              Hotels, homestays, tour operators & corporate partner management
            </p>

            {/* Mode Switcher Tabs */}
            <div className="mt-4 p-1 bg-slate-100 rounded-xl grid grid-cols-2 text-xs font-bold border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`py-2 rounded-lg transition-all ${
                  mode === 'login' ? 'bg-[#1E3A8A] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`py-2 rounded-lg transition-all ${
                  mode === 'signup' ? 'bg-[#1E3A8A] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Register Partner
              </button>
            </div>
          </div>

          {error && (
            <div className="mx-8 mt-2 p-3 bg-red-50 border border-red-200 text-expense text-xs rounded-xl font-medium leading-relaxed">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mx-8 mt-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* MODE 1: LOGIN */}
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="p-8 pt-3 space-y-4">
              <div>
                <label className="label">Organization Email or Username</label>
                <div className="relative">
                  <input
                    type="text"
                    value={emailOrUsername}
                    onChange={e => setEmailOrUsername(e.target.value)}
                    placeholder="e.g. villalemonhomestay@gmail.com"
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
                    onClick={() => alert('Please contact Varkala Holidays management to reset your organization credentials.')}
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

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-xs text-[#1E3A8A] hover:underline font-bold"
                >
                  New Partner? Create an Organization Account
                </button>
              </div>
            </form>
          ) : (
            /* MODE 2: REGISTER / SIGN UP */
            <form onSubmit={handleSignup} className="p-8 pt-3 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Organization / Hotel Name *</label>
                  <input
                    type="text"
                    required
                    value={signupForm.name}
                    onChange={e => setSignupForm({ ...signupForm, name: e.target.value })}
                    placeholder="e.g. Sunset Cliff Resort"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Organization Type *</label>
                  <select
                    value={signupForm.type}
                    onChange={e => setSignupForm({ ...signupForm, type: e.target.value as any })}
                    className="input-field font-semibold"
                  >
                    <option value="hotel">Hotel</option>
                    <option value="homestay">Homestay</option>
                    <option value="tour_operator">Tour Operator</option>
                    <option value="travel_agent">Travel Agent</option>
                    <option value="corporate">Corporate</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Contact Person Name *</label>
                  <input
                    type="text"
                    required
                    value={signupForm.contact_person}
                    onChange={e => setSignupForm({ ...signupForm, contact_person: e.target.value })}
                    placeholder="e.g. Anand Sharma"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={signupForm.phone}
                    onChange={e => setSignupForm({ ...signupForm, phone: e.target.value })}
                    placeholder="e.g. 9847123456"
                    className="input-field font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={signupForm.email}
                    onChange={e => setSignupForm({ ...signupForm, email: e.target.value })}
                    placeholder="manager@hotel.com"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Password *</label>
                  <input
                    type="password"
                    required
                    value={signupForm.password}
                    onChange={e => setSignupForm({ ...signupForm, password: e.target.value })}
                    placeholder="••••••••••••"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">WhatsApp Number (Optional)</label>
                  <input
                    type="tel"
                    value={signupForm.whatsapp}
                    onChange={e => setSignupForm({ ...signupForm, whatsapp: e.target.value })}
                    placeholder="+91..."
                    className="input-field font-mono"
                  />
                </div>
                <div>
                  <label className="label">GST Number (Optional)</label>
                  <input
                    type="text"
                    value={signupForm.gst_number}
                    onChange={e => setSignupForm({ ...signupForm, gst_number: e.target.value })}
                    placeholder="32AAAAA0000A1Z5 (Optional)"
                    className="input-field font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="label">Property / Billing Address (Optional)</label>
                <input
                  type="text"
                  value={signupForm.billing_address}
                  onChange={e => setSignupForm({ ...signupForm, billing_address: e.target.value })}
                  placeholder="North Cliff, Varkala, Kerala"
                  className="input-field"
                />
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
                    <span>REGISTER PARTNER ACCOUNT</span>
                    <Building2 className="h-3.5 w-3.5" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs text-slate-600 hover:text-slate-900 font-semibold"
                >
                  Already have an account? <span className="text-[#1E3A8A] font-bold">Sign In</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center relative z-10 text-xs text-slate-400">
        <p>Varkala Holidays | Partner Portal • Varkala</p>
      </div>
    </div>
  );
};

export default OrganizationLogin;

