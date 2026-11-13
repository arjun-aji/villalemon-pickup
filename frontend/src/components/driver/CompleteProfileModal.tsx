import React, { useState } from 'react';
import {
  Camera,
  Shield,
  KeyRound,
  User,
  CreditCard,
  Calendar,
  Car,
  MapPin,
  CheckCircle2,
  AlertCircle,
  X,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { compressImage } from '../../utils/imageHelper';

interface CompleteProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CompleteProfileModal: React.FC<CompleteProfileModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { driver, profile, completeDriverProfile } = useAuth();

  const [photoPreview, setPhotoPreview] = useState<string>(
    driver?.photo_url || profile?.avatar_url || ''
  );
  const [licenceNumber, setLicenceNumber] = useState(
    driver?.driving_licence_no && driver.driving_licence_no !== 'N/A' && driver.driving_licence_no !== 'PENDING'
      ? driver.driving_licence_no
      : ''
  );
  const [licenceExpiry, setLicenceExpiry] = useState(driver?.licence_expiry || '');
  const [vehicleNumber, setVehicleNumber] = useState(driver?.vehicle_number || '');
  const [address, setAddress] = useState(driver?.address || '');
  const [phone, setPhone] = useState(driver?.phone || profile?.phone || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);

  if (!isOpen) return null;

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 400, 0.8);
      setPhotoPreview(compressed);
    } catch (err) {
      console.error('Failed to compress image:', err);
      alert('Could not read image file. Please try another image.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!licenceNumber.trim()) {
      setErrorMsg('Please enter your Driving Licence Number.');
      return;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        setErrorMsg('New password must be at least 6 characters.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('Passwords do not match. Please re-enter.');
        return;
      }
    }

    try {
      setSaving(true);
      const res = await completeDriverProfile({
        drivingLicenceNo: licenceNumber.trim().toUpperCase(),
        licenceExpiry: licenceExpiry || undefined,
        avatarUrl: photoPreview || undefined,
        newPassword: newPassword || undefined,
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        vehicleNumber: vehicleNumber.trim().toUpperCase() || undefined,
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Failed to update profile. Please try again.');
        return;
      }

      setSuccessMsg(true);
      setTimeout(() => {
        setSuccessMsg(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error completing profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 max-h-[92vh] flex flex-col">
        {/* Header with decorative badge */}
        <div className="p-5 bg-gradient-to-r from-emerald-600 via-teal-700 to-navy-primary text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Shield className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight leading-tight">Complete Driver Profile</h2>
              <p className="text-[11px] text-emerald-100 font-medium">
                Verify credentials, photo & security password
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 flex items-center gap-2.5 font-bold shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Driver profile completed successfully! Activating your account...</span>
            </div>
          )}

          {/* 1. Driver Photo Upload */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
            <div className="relative group cursor-pointer mb-2">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-200 border-2 border-emerald-500 shadow-md flex items-center justify-center">
                {photoPreview ? (
                  <img src={photoPreview} alt="Driver avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-slate-400" />
                )}
              </div>
              <label
                htmlFor="driverPhotoInput"
                className="absolute bottom-0 right-0 p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-md cursor-pointer transition-transform active:scale-90"
                title="Upload or take photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </label>
              <input
                id="driverPhotoInput"
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </div>
            <label
              htmlFor="driverPhotoInput"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
            >
              {photoPreview ? 'Change Profile Photo' : 'Upload Driver Photo'}
            </label>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Clear front-facing photo shown on duty Placard and ID
            </p>
          </div>

          {/* 2. Licence & Identification Details */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
              <span>Driving Licence & Cab Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Driving Licence No. <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KL-16-2024-0012345"
                  value={licenceNumber}
                  onChange={e => setLicenceNumber(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Licence Expiry Date
                </label>
                <input
                  type="date"
                  value={licenceExpiry}
                  onChange={e => setLicenceExpiry(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Assigned / Personal Vehicle No.
                </label>
                <input
                  type="text"
                  placeholder="e.g. KL 16 Q 7965"
                  value={vehicleNumber}
                  onChange={e => setVehicleNumber(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Residential Address
              </label>
              <input
                type="text"
                placeholder="e.g. Temple Road, Varkala, Trivandrum"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* 3. Security Password Setup */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
              <span>Set Your Private Strong Password</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Replace the temporary password provided by admin with your own private login password.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  New Strong Password
                </label>
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            {newPassword && confirmPassword && (
              <p className={`text-[10px] font-bold ${newPassword === confirmPassword ? 'text-emerald-600' : 'text-red-500'}`}>
                {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
              </p>
            )}
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 text-xs font-semibold py-2 px-3"
            >
              Remind Me Later
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{saving ? 'Saving Profile...' : 'Save & Activate Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfileModal;
