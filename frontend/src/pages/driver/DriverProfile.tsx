import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Phone,
  Car,
  KeyRound,
  Shield,
  ArrowLeft,
  CheckCircle2,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const DriverProfile: React.FC = () => {
  const navigate = useNavigate();
  const { driver, profile, signOut, updateDriverPassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [updating, setUpdating] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }

    setUpdating(true);
    await updateDriverPassword(newPassword);
    setUpdating(false);
    setPasswordSuccess(true);
    setNewPassword('');
    setTimeout(() => setPasswordSuccess(false), 2500);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="max-w-md mx-auto space-y-4 pb-12">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/driver/dashboard')}
          className="p-2 hover:bg-gray-100 rounded-xl text-text-secondary"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Driver Profile</h1>
          <p className="text-xs text-text-secondary">Employee account & security credentials</p>
        </div>
      </div>

      {passwordSuccess && (
        <div className="p-3.5 bg-green-light border border-green-primary text-green-primary rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>Password updated successfully!</span>
        </div>
      )}

      {/* Profile Details Card */}
      <div className="card p-6 border border-border space-y-4 shadow-card">
        <div className="flex items-center gap-4 pb-4 border-b border-border">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-green-primary to-green-secondary text-white font-black text-xl flex items-center justify-center shadow-md">
            {driver?.full_name?.charAt(0) || profile?.full_name?.charAt(0) || 'D'}
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary">{driver?.full_name || profile?.full_name || 'Driver'}</h2>
            <p className="text-xs text-green-primary font-semibold">
              ID: {driver?.employee_id || '-'} • {driver?.employment_status?.toUpperCase() || 'ACTIVE'}
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Username:</span>
            <span className="font-mono font-bold text-navy-primary">{driver?.username || '-'}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Phone Number:</span>
            <span className="font-semibold text-text-primary">{driver?.phone || '-'}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Assigned Vehicle:</span>
            <span className="font-mono font-bold text-text-primary">{driver?.vehicle_number || '-'}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Address:</span>
            <span className="font-medium text-text-primary">{driver?.address || '-'}</span>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <form onSubmit={handlePasswordChange} className="card p-6 border border-border space-y-3.5 shadow-card">
        <h3 className="text-sm font-bold text-navy-primary uppercase tracking-wider flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-green-primary" />
          Update Password
        </h3>
        <p className="text-xs text-text-secondary">
          Set a new private password for your driver portal login
        </p>

        <div>
          <label className="label">New Password</label>
          <input
            type="password"
            required
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="Min 6 characters"
            className="input-field"
          />
        </div>

        <button
          type="submit"
          disabled={updating}
          className="btn-primary text-xs py-2.5 px-4 rounded-xl justify-center w-full shadow-sm"
        >
          {updating ? 'Updating...' : 'Update Password'}
        </button>
      </form>

      {/* Sign Out Action */}
      <button
        onClick={handleSignOut}
        className="w-full p-3 bg-red-50 hover:bg-red-100 text-expense border border-red-200 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
      >
        <LogOut className="h-4 w-4" />
        <span>SIGN OUT OF DRIVER PORTAL</span>
      </button>
    </div>
  );
};

export default DriverProfile;

