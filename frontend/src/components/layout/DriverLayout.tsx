import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  Calendar,
  Wallet,
  User,
  LogOut,
  Car,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import VillaLemonLogo from '../ui/VillaLemonLogo';

// Bottom Navigation items for mobile
const mobileBottomNavItems = [
  { to: '/driver/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/driver/available-trips', icon: MapPin, label: 'Available' },
  { to: '/driver/upcoming-trips', icon: Calendar, label: 'My Trips' },
  { to: '/driver/settlements', icon: Wallet, label: 'Settlement' },
  { to: '/driver/profile', icon: User, label: 'Profile' },
];

// Desktop sidebar items
const desktopDriverNav = [
  { to: '/driver/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/driver/available-trips', icon: MapPin, label: 'Available Trips' },
  { to: '/driver/upcoming-trips', icon: Calendar, label: 'My Upcoming Trips' },
  { to: '/driver/enrolled-trips', icon: Clock, label: 'My Enrolled Trips' },
  { to: '/driver/completed-trips', icon: CheckCircle2, label: 'Completed Trips' },
  { to: '/driver/settlements', icon: Wallet, label: 'My Settlements' },
  { to: '/driver/profile', icon: User, label: 'My Profile' },
];

const DriverLayout: React.FC = () => {
  const { signOut, driver, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const displayName = driver?.full_name || profile?.full_name || 'Driver';

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col md:flex-row">
      {/* ========================================================= */}
      {/* 1. FIXED TOP NAVBAR (MOBILE & DESKTOP - NEVER SCROLLS)   */}
      {/* ========================================================= */}
      <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-navy-sidebar text-white border-b border-[#152B44] flex items-center justify-between px-4 md:px-6 md:left-64 shadow-md">
        {/* Brand & Driver Status */}
        <div className="flex items-center gap-3">
          <VillaLemonLogo size="sm" variant="light" showSubtitle={false} />
          <div className="hidden sm:block border-l border-[#152B44] pl-3">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-primary/20 text-green-primary border border-green-primary/30 uppercase">
              Driver Portal
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-primary animate-pulse" />
              <span>{driver?.vehicle_number || driver?.phone || 'Driver Employee'}</span>
              <span>•</span>
              <span className="text-slate-300 font-semibold">{displayName}</span>
            </p>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-red-500/20 text-slate-300 hover:text-expense border border-white/10 transition-colors text-xs font-semibold"
            title="Sign Out"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. FIXED DESKTOP DRIVER SIDEBAR (NEVER SCROLLS)          */}
      {/* ========================================================= */}
      <aside className="hidden md:flex fixed top-0 bottom-0 left-0 z-50 w-64 bg-navy-sidebar text-white flex-col justify-between border-r border-[#152B44] select-none">
        <div>
          {/* Top Brand */}
          <div className="h-16 flex items-center px-4 border-b border-[#152B44]">
            <VillaLemonLogo size="sm" variant="light" />
          </div>

          {/* Links */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)] scrollbar-hide">
            {desktopDriverNav.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/driver/dashboard'}
                className={({ isActive }) =>
                  `sidebar-link group ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}`
                }
              >
                <item.icon className="h-4.5 w-4.5 shrink-0" />
                <span className="flex-1 text-xs tracking-wide font-semibold truncate">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Driver Profile Tag */}
        <div className="p-3 border-t border-[#152B44] bg-[#081524]">
          <div className="flex items-center gap-3 p-1.5 rounded-xl">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-green-primary to-emerald-400 flex items-center justify-center font-bold text-white text-xs shadow shrink-0 border border-emerald-500/30">
              {driver?.photo_url || profile?.avatar_url ? (
                <img src={driver.photo_url || profile?.avatar_url} alt="Driver" className="w-full h-full object-cover" />
              ) : (
                displayName.charAt(0)
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{displayName}</p>
              <p className="text-[10px] text-slate-400 font-mono truncate">
                {driver?.vehicle_number || driver?.phone || 'Driver Employee'}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="p-1.5 hover:bg-navy-light rounded-lg text-slate-400 hover:text-expense transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 3. MAIN CONTENT (PAD TOP FOR FIXED HEADER, BOTTOM FOR NAV) */}
      {/* ========================================================= */}
      <div className="flex-1 md:pl-64 pt-20 pb-24 md:pt-20 md:pb-12 w-full min-h-screen">
        <main className="max-w-lg md:max-w-3xl mx-auto px-4 sm:px-6">
          <Outlet />
        </main>
      </div>

      {/* ========================================================= */}
      {/* 4. FIXED BOTTOM NAVIGATION BAR FOR MOBILE (NEVER SCROLLS) */}
      {/* ========================================================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-navy-sidebar border-t border-[#152B44] flex items-center justify-around px-2 shadow-2xl safe-area-pb">
        {mobileBottomNavItems.map(item => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/driver/dashboard'}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                isActive ? 'text-green-primary font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  isActive ? 'bg-green-primary/20 scale-110' : ''
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? 'text-green-primary' : ''}`} />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default DriverLayout;
