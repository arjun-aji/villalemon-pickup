import React, { useState } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import {
  Menu,
  X,
  Car,
  Bell,
  Plus,
  FileSpreadsheet,
  ChevronDown,
  LogOut,
  Calendar,
} from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import VillaLemonLogo from '../ui/VillaLemonLogo';
import { useAuth } from '../../context/AuthContext';

const AdminLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col">
      {/* ========================================================= */}
      {/* 1. FIXED TOP NAVBAR (DESKTOP & MOBILE - NEVER SCROLLS AWAY) */}
      {/* ========================================================= */}
      <header
        className={`fixed top-0 right-0 left-0 z-40 h-16 bg-navy-sidebar text-white border-b border-[#152B44] flex items-center justify-between px-4 md:px-6 transition-all duration-300 ${
          sidebarCollapsed ? 'md:left-20' : 'md:left-64'
        }`}
      >
        {/* Left: Mobile Toggle & Page Indicator */}
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-navy-light transition-colors"
            title="Toggle Menu"
          >
            {mobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Mobile brand indicator */}
          <div className="md:hidden flex items-center">
            <VillaLemonLogo size="sm" variant="light" showSubtitle={false} />
          </div>

          {/* Desktop breadcrumb tag */}
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-green-primary animate-pulse" />
            <span className="text-white font-bold">Varkala Operations</span>
            <span>•</span>
            <span className="text-slate-400">Live Dashboard</span>
          </div>
        </div>

        {/* Right: Quick Actions, Notifications & Profile */}
        <div className="flex items-center gap-2.5">
          {/* Month selector button */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#152B44]/80 border border-[#234266] text-xs font-semibold text-slate-200">
            <Calendar className="h-3.5 w-3.5 text-green-primary" />
            <span>{new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' })}</span>
          </div>

          {/* Quick Add Trip */}
          <button
            onClick={() => navigate('/admin/trips/create')}
            className="hidden sm:flex btn-primary text-xs py-1.5 px-3 rounded-xl shadow-md shadow-green-primary/20 items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Trip</span>
          </button>

          {/* Quick Export Excel */}
          <button
            onClick={() => navigate('/admin/monthly-reports')}
            className="hidden lg:flex px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white transition-colors items-center gap-1.5"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-green-primary" />
            <span>Excel</span>
          </button>

          {/* Notifications Bell with unread dot */}
          <button
            onClick={() => navigate('/admin/enrollment-requests')}
            className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-navy-light transition-colors"
            title="Driver Enrollment Requests"
          >
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-expense rounded-full ring-2 ring-navy-sidebar animate-pulse" />
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-[#152B44]">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-green-primary to-green-secondary text-white font-extrabold text-xs flex items-center justify-center shadow-md">
              {profile?.full_name?.charAt(0) || 'A'}
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <span className="text-xs font-bold text-white block truncate max-w-[120px]">
                {profile?.full_name || 'Admin'}
              </span>
              <span className="text-[10px] text-green-primary font-semibold block">Super Admin</span>
            </div>
            <button
              onClick={handleSignOut}
              className="p-1.5 rounded-lg text-slate-400 hover:text-expense hover:bg-navy-light transition-colors ml-1"
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. FIXED DESKTOP SIDEBAR (NEVER SCROLLS AWAY) */}
      {/* ========================================================= */}
      <div
        className={`hidden md:block fixed top-0 bottom-0 left-0 z-50 transition-all duration-300 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <AdminSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* ========================================================= */}
      {/* 3. MOBILE DRAWER SIDEBAR */}
      {/* ========================================================= */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative z-10 w-72 max-w-[80vw] bg-navy-sidebar h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
            <AdminSidebar onCloseMobile={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. MAIN SCROLLABLE CONTENT (PADDED FOR FIXED NAV & SIDEBAR) */}
      {/* ========================================================= */}
      <div
        className={`flex-1 transition-all duration-300 pt-16 ${
          sidebarCollapsed ? 'md:pl-20' : 'md:pl-64'
        }`}
      >
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
