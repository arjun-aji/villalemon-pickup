import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  Car,
  Receipt,
  LogOut,
  Menu,
  X,
  Building2,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import VillaLemonLogo from '../ui/VillaLemonLogo';

const navItems = [
  { path: '/org/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/org/trips/new', label: 'Request New Trip', icon: PlusCircle },
  { path: '/org/trips', label: 'My Trips', icon: Car },
  { path: '/org/invoices', label: 'Invoices & Statements', icon: Receipt },
];

const OrganizationLayout: React.FC = () => {
  const { profile, organization, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/org/login');
  };

  const orgName = organization?.name || profile?.full_name || 'Partner Organization';
  const orgType = organization?.type || 'Travel Partner';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#0F1E36] text-white border-b border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Portal Badge */}
            <div className="flex items-center gap-3">
              <VillaLemonLogo size="sm" variant="light" showSubtitle={false} />
              <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-700">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  PARTNER PORTAL
                </span>
                <span className="text-xs text-slate-300 truncate max-w-[200px]">
                  {orgName}
                </span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map(item => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Partner Info & Sign Out */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-bold text-white truncate max-w-[150px]">{orgName}</p>
                <p className="text-[10px] text-blue-300">{orgType}</p>
              </div>

              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-900/40 text-slate-300 hover:text-red-300 border border-slate-700 text-xs font-medium transition-colors"
                title="Sign out of Partner Portal"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>

              {/* Mobile Menu Trigger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-[#0F1E36] px-4 pt-2 pb-4 space-y-1">
            <div className="py-2 px-3 mb-2 rounded-lg bg-slate-800/60 border border-slate-700 text-xs">
              <p className="font-bold text-white">{orgName}</p>
              <p className="text-blue-300 text-[11px]">{orgType}</p>
            </div>
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Page Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>VillaLemon Pickup • Varkala Holidays Partner Portal</span>
          <span className="text-[11px] text-slate-400">Operations Hotline: +91 94470 00000</span>
        </div>
      </footer>
    </div>
  );
};

export default OrganizationLayout;
