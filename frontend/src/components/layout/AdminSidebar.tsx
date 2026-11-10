import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Car,
  PlusCircle,
  Users,
  ClipboardCheck,
  Wallet,
  BarChart3,
  FileSpreadsheet,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

import VillaLemonLogo from '../ui/VillaLemonLogo';

interface NavItem {
  to: string;
  icon: any;
  label: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/admin/trips', icon: Car, label: 'Trips' },
  { to: '/admin/trips/create', icon: PlusCircle, label: 'Add Trip' },
  { to: '/admin/drivers', icon: Users, label: 'Driver Employees' },
  { to: '/admin/enrollment-requests', icon: ClipboardCheck, label: 'Enrollment Requests' },
  { to: '/admin/settlements', icon: Wallet, label: 'Settlements' },
  { to: '/admin/profit-analytics', icon: BarChart3, label: 'Profit Analytics' },
  { to: '/admin/monthly-reports', icon: FileSpreadsheet, label: 'Monthly Reports' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

interface AdminSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onCloseMobile?: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  collapsed = false,
  onToggleCollapse,
  onCloseMobile,
}) => {
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <aside className="h-full flex flex-col justify-between bg-navy-sidebar text-white select-none border-r border-[#152B44]">
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#152B44]">
          {!collapsed ? (
            <VillaLemonLogo size="sm" variant="light" />
          ) : (
            <div className="mx-auto">
              <VillaLemonLogo size="sm" variant="light" showSubtitle={false} />
            </div>
          )}

          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className={`p-1.5 rounded-lg hover:bg-navy-light text-slate-400 hover:text-white transition-colors ${
                collapsed ? 'hidden' : 'block'
              }`}
              title="Collapse menu"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Navigation items */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)] scrollbar-hide">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin/dashboard'}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `sidebar-link group ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'} ${
                  collapsed ? 'justify-center px-0' : ''
                }`
              }
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" />
              {!collapsed && (
                <span className="flex-1 text-xs tracking-wide font-semibold truncate">{item.label}</span>
              )}
              {!collapsed && item.badge && (
                <span className="bg-expense text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shadow-sm">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer / Profile Pill */}
      <div className="p-3 border-t border-[#152B44] bg-[#081524]">
        {!collapsed ? (
          <div className="flex items-center gap-3 p-1.5 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-green-primary to-emerald-400 flex items-center justify-center font-bold text-white text-xs shadow-md shrink-0">
              {profile?.full_name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {profile?.full_name || 'Admin Manager'}
              </p>
              <p className="text-[10px] text-green-primary font-semibold truncate">
                Super Administrator
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
        ) : (
          <button
            onClick={handleSignOut}
            className="p-2 hover:bg-navy-light rounded-xl text-slate-400 hover:text-expense transition-colors w-full flex justify-center"
            title="Sign Out"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        )}
      </div>
    </aside>
  );
};

export default AdminSidebar;
