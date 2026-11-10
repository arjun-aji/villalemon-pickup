import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Custom SVG Icons matching the reference design
const AdminShieldIcon: React.FC<{ className?: string }> = ({ className = 'w-9 h-9' }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Deep navy shield */}
    <path
      d="M24 5L9 10.5V22.5C9 31.8 15.4 40.2 24 43C32.6 40.2 39 31.8 39 22.5V10.5L24 5Z"
      fill="#0F3870"
    />
    {/* 4 Dashboard window squares */}
    <rect x="18" y="17.5" width="5" height="5" rx="1" fill="white" />
    <rect x="25" y="17.5" width="5" height="5" rx="1" fill="white" />
    <rect x="18" y="24.5" width="5" height="5" rx="1" fill="white" />
    <rect x="25" y="24.5" width="5" height="5" rx="1" fill="white" />
  </svg>
);

const DriverCarIcon: React.FC<{ className?: string }> = ({ className = 'w-9 h-9' }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Emerald green front-view car */}
    <path
      d="M11 22C11 19.6 12.6 17.6 14.8 17L19.5 15.6C21 15.2 27 15.2 28.5 15.6L33.2 17C35.4 17.6 37 19.6 37 22V32C37 33.7 35.7 35 34 35H33V36.5C33 37.9 31.9 39 30.5 39C29.1 39 28 37.9 28 36.5V35H20V36.5C20 37.9 18.9 39 17.5 39C16.1 39 15 37.9 15 36.5V35H14C12.3 35 11 33.7 11 32V22Z"
      fill="#00875A"
    />
    {/* Windshield */}
    <path
      d="M15 24.5C15 23.1 16.1 22 17.5 22H30.5C31.9 22 33 23.1 33 24.5V26.5H15V24.5Z"
      fill="white"
      fillOpacity="0.92"
    />
    {/* Headlights */}
    <circle cx="16.5" cy="31" r="2" fill="white" />
    <circle cx="31.5" cy="31" r="2" fill="white" />
    {/* Grill */}
    <rect x="21" y="30.5" width="6" height="1.8" rx="0.9" fill="#005A3C" />
  </svg>
);

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, loading } = useAuth();

  React.useEffect(() => {
    if (!loading && profile) {
      if (profile.role === 'admin') navigate('/admin/dashboard');
      else if (profile.role === 'driver') navigate('/driver/dashboard');
    }
  }, [profile, loading, navigate]);

  return (
    <div
      className="min-h-screen w-full relative flex flex-col justify-between font-sans overflow-x-hidden select-none bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url('/assets/varkala-desktop-bg.jpg')`,
      }}
    >
      {/* Soft ambient overlay to ensure highest contrast and legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/35 via-transparent to-black/35 pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col justify-between py-6 sm:py-8 lg:py-10">
        {/* ========================================================= */}
        {/* TOP BRAND & WELCOME HEADER (Centered)                    */}
        {/* ========================================================= */}
        <div className="text-center pt-2 sm:pt-4 max-w-2xl mx-auto">
          {/* Logo with Leaf-Sprout Emblem */}
          <div className="inline-flex items-center justify-center gap-3 mb-1">
            {/* Custom Leaf-Sprout Car Logo */}
            <div className="relative w-12 h-12 shrink-0 drop-shadow-sm">
              <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                {/* Leaf sprout growing from the roof */}
                <path
                  d="M32 20C32 10 44 8 47 7C47 10 46 19 35 21C34.2 21.1 33.1 20.7 32 20Z"
                  fill="#059669"
                />
                <path
                  d="M35 17C40 13 44 10 47 7"
                  stroke="#D1FAE5"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                {/* Car main body */}
                <path
                  d="M18 30C18 27.5 19.5 25.5 22 24.8L26.5 23.5C28 23.1 36 23.1 37.5 23.5L42 24.8C44.5 25.5 46 27.5 46 30V43C46 45.2 44.2 47 42 47H41V49C41 50.7 39.7 52 38 52C36.3 52 35 50.7 35 49V47H29V49C29 50.7 27.7 52 26 52C24.3 52 23 50.7 23 49V47H22C19.8 47 18 45.2 18 43V30Z"
                  fill="#00875A"
                />
                {/* Windshield */}
                <path
                  d="M23 33C23 31.3 24.3 30 26 30H38C39.7 30 41 31.3 41 33V35H23V33Z"
                  fill="white"
                  fillOpacity="0.9"
                />
                {/* Headlights */}
                <circle cx="23.5" cy="41.5" r="2.5" fill="white" />
                <circle cx="40.5" cy="41.5" r="2.5" fill="white" />
                <rect x="28" y="41" width="8" height="2" rx="1" fill="#006644" />
              </svg>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#10243A]">
              <span>VillaLemon </span>
              <span className="text-[#00875A]">Pickup</span>
            </h1>
          </div>

          {/* Subtitle with Flanking Green Lines matching screenshot */}
          <div className="flex items-center justify-center gap-2.5 text-xs font-semibold text-slate-700 tracking-wide mt-0.5 mb-3">
            <span className="w-8 sm:w-12 h-[1.5px] bg-[#00875A] rounded-full" />
            <span>Pickup & Driver Management System</span>
            <span className="w-8 sm:w-12 h-[1.5px] bg-[#00875A] rounded-full" />
          </div>

          {/* Welcome Headline */}
          <h2 className="text-2xl sm:text-3xl lg:text-[38px] font-black tracking-tight text-[#10243A] leading-tight">
            <span>Welcome to VillaLemon </span>
            <span className="text-[#00875A]">Pickup</span>
          </h2>

          <p className="text-xs sm:text-sm font-semibold text-slate-700 mt-1 max-w-lg mx-auto">
            Manage trips, drivers, expenses and business performance in one place.
          </p>
        </div>

        {/* ========================================================= */}
        {/* CENTERED DUAL CARDS (FROSTED GLASS EFFECT MATCHING IMAGE) */}
        {/* ========================================================= */}
        <div className="my-auto py-4 sm:py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 w-full max-w-2xl mx-auto">
            {/* CARD 1: ADMIN LOGIN */}
            <div
              onClick={() => navigate('/admin/login')}
              className="group bg-white/90 hover:bg-white backdrop-blur-md rounded-[26px] p-6 sm:p-7 shadow-[0_15px_40px_rgba(16,36,58,0.12)] border border-white/70 hover:border-[#00875A]/40 hover:shadow-[0_20px_50px_rgba(0,135,90,0.18)] hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 cursor-pointer flex flex-col justify-between text-center"
            >
              <div>
                {/* Pale Blue Circular Badge */}
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-[#EBF3FE] flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform duration-300 shadow-sm">
                  <AdminShieldIcon className="w-8 h-8 sm:w-9 sm:h-9" />
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-[#10243A] tracking-tight mb-2">
                  Admin Login
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed min-h-[40px] max-w-[220px] mx-auto mb-5">
                  Manage drivers, trips, expenses, settlements and business insights.
                </p>
              </div>

              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  navigate('/admin/login');
                }}
                className="w-full bg-[#007A50] hover:bg-[#006642] active:bg-[#005738] text-white font-extrabold text-xs sm:text-sm tracking-wider uppercase py-3.5 px-5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[#007A50]/25 transition-all"
              >
                <span>LOGIN AS ADMIN</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* CARD 2: DRIVER LOGIN */}
            <div
              onClick={() => navigate('/driver/login')}
              className="group bg-white/90 hover:bg-white backdrop-blur-md rounded-[26px] p-6 sm:p-7 shadow-[0_15px_40px_rgba(16,36,58,0.12)] border border-white/70 hover:border-[#00875A]/40 hover:shadow-[0_20px_50px_rgba(0,135,90,0.18)] hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 cursor-pointer flex flex-col justify-between text-center"
            >
              <div>
                {/* Pale Mint-Green Circular Badge */}
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-[#E6F7F0] flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform duration-300 shadow-sm">
                  <DriverCarIcon className="w-8 h-8 sm:w-9 sm:h-9" />
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-[#10243A] tracking-tight mb-2">
                  Driver Login
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed min-h-[40px] max-w-[220px] mx-auto mb-5">
                  Access upcoming trips, enroll in available trips and update trip expenses.
                </p>
              </div>

              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  navigate('/driver/login');
                }}
                className="w-full bg-[#007A50] hover:bg-[#006642] active:bg-[#005738] text-white font-extrabold text-xs sm:text-sm tracking-wider uppercase py-3.5 px-5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[#007A50]/25 transition-all"
              >
                <span>LOGIN AS DRIVER</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* FOOTER BAR (MATCHING SCREENSHOT WITH HORIZONTAL LINES)    */}
        {/* ========================================================= */}
        <div className="text-center pt-4 pb-2">
          <div className="inline-flex items-center justify-center flex-wrap gap-2.5 sm:gap-4 text-xs font-semibold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
            <span className="hidden sm:inline-block w-12 sm:w-20 h-px bg-white/60" />
            
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-white" />
              <span>Varkala • Kerala • India</span>
            </span>

            <span className="text-white/60">•</span>

            <span>VillaLemon Pickup | Pickup & Driver Management</span>

            <span className="hidden sm:inline-block w-12 sm:w-20 h-px bg-white/60" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
