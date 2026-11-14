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
  Camera,
  Edit3,
  CreditCard,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import CompleteProfileModal from '../../components/driver/CompleteProfileModal';

const DriverProfile: React.FC = () => {
  const navigate = useNavigate();
  const { driver, profile, signOut, updateDriverPassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

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
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-tr from-green-primary to-green-secondary text-white font-black text-xl flex items-center justify-center shadow-md border-2 border-emerald-500">
                {driver?.photo_url || profile?.avatar_url ? (
                  <img src={driver?.photo_url || profile?.avatar_url} alt="Driver" className="w-full h-full object-cover" />
                ) : (
                  <span>{driver?.full_name?.charAt(0) || profile?.full_name?.charAt(0) || 'D'}</span>
                )}
              </div>
              <button
                onClick={() => setShowEditModal(true)}
                className="absolute -bottom-1 -right-1 p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-sm"
                title="Change Photo"
              >
                <Camera className="w-3 h-3" />
              </button>
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">{driver?.full_name || profile?.full_name || 'Driver'}</h2>
              <p className="text-xs text-green-primary font-semibold">
                ID: {driver?.employee_id || '-'} • {driver?.employment_status?.toUpperCase() || 'ACTIVE'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowEditModal(true)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors"
            title="Edit Full Profile"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
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
            <span className="text-text-secondary">Driving Licence No:</span>
            <span className="font-mono font-bold text-slate-900">
              {driver?.driving_licence_no && driver.driving_licence_no !== 'N/A' && driver.driving_licence_no !== 'PENDING'
                ? driver.driving_licence_no
                : <span className="text-amber-600 font-semibold">Pending Verification</span>}
            </span>
          </div>

          {driver?.licence_expiry && (
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Licence Expiry:</span>
              <span className="font-medium text-text-primary">{driver.licence_expiry}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Assigned Vehicle:</span>
            <span className="font-mono font-bold text-text-primary">{driver?.vehicle_number || '-'}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Address:</span>
            <span className="font-medium text-text-primary">{driver?.address || '-'}</span>
          </div>
        </div>

        <button
          onClick={() => setShowEditModal(true)}
          className="w-full mt-2 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-emerald-200"
        >
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span>Update Licence, Photo & Vehicle</span>
        </button>
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

      {/* Complete / Edit Profile Modal */}
      <CompleteProfileModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
      />
    </div>
  );
};

export default DriverProfile;

