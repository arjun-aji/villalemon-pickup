import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Phone,
  Car,
  KeyRound,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Shield,
  Search,
  MessageCircle,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { driverService } from '../../services/driverService';
import { DriverEmployee } from '../../types';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import SearchInput from '../../components/ui/SearchInput';

const DriversPage: React.FC = () => {
  const [drivers, setDrivers] = useState<DriverEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add Driver Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [sendWhatsAppOnCreate, setSendWhatsAppOnCreate] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Success credential alert with full driver details for WhatsApp
  const [createdInfo, setCreatedInfo] = useState<{
    name: string;
    phone: string;
    username: string;
    pass: string;
  } | null>(null);

  const formatWhatsAppUrl = (phone: string, text: string) => {
    let clean = (phone || '').replace(/[^0-9]/g, '');
    if (clean.length === 10) clean = `91${clean}`;
    return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
  };

  const generateDriverLoginMessage = (name: string, username: string, pass: string, phone: string) => {
    const origin = window.location.origin;
    return `🚖 *VillaLemon Pickup — Driver Account Created*

Hello *${name}*,
Welcome to the VillaLemon Pickup team!

Here are your login credentials to access the Driver Portal:
🌐 *Driver Portal:* ${origin}/driver/login
👤 *Username / Phone:* ${username || phone}
🔑 *Temporary Password:* ${pass}

⚠️ *First Login Action:*
Please log in now to complete your driver profile:
1. Set your new private strong password
2. Upload your driver photo
3. Enter your Driving Licence number and details

Thank you,
*VillaLemon Pickup Operations*`;
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      setLoading(true);
      const list = await driverService.getAll();
      setDrivers(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setFormName('');
    setFormUsername('');
    setFormPhone('');
    setFormAddress('');
    setFormPassword('');
    setIsAddModalOpen(true);
  };

  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const cleanUsername = formUsername.trim().toLowerCase();
      await driverService.create(
        {
          full_name: formName.trim(),
          employee_id: `DRV-${Date.now().toString().slice(-4)}`,
          username: cleanUsername,
          phone: formPhone.trim(),
          email: `${cleanUsername}@villalemon.pickup`,
          vehicle_number: '',
          address: formAddress.trim(),
          driving_licence_no: 'N/A',
          employment_type: 'Per-trip payment',
          per_trip_payment: 500,
          monthly_salary: 0,
        },
        formPassword
      );

      setIsAddModalOpen(false);
      setCreatedInfo({
        name: formName.trim(),
        phone: formPhone.trim(),
        username: cleanUsername,
        pass: formPassword,
      });

      // If option is checked, automatically open WhatsApp with the credentials
      if (sendWhatsAppOnCreate) {
        const wpUrl = formatWhatsAppUrl(
          formPhone.trim(),
          generateDriverLoginMessage(formName.trim(), cleanUsername, formPassword, formPhone.trim())
        );
        window.open(wpUrl, '_blank');
      }

      loadDrivers();
    } catch (err: any) {
      alert(err.message || 'Failed to create driver account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (driver: DriverEmployee) => {
    const newStatus = driver.employment_status === 'active' ? 'inactive' : 'active';
    try {
      await driverService.updateStatus(driver.id, newStatus);
      loadDrivers();
    } catch (e: any) {
      alert(e.message || 'Failed to update status');
    }
  };

  const handleResetPassword = async (driver: DriverEmployee) => {
    try {
      const res = await driverService.resetPassword(driver.id);
      const tempPass = res.tempPassword || 'driver123';
      setCreatedInfo({
        name: driver.full_name,
        phone: driver.phone,
        username: driver.username || driver.phone,
        pass: tempPass,
      });
      alert(`Password reset for ${driver.full_name}!\nTemporary Password: ${tempPass}\nClick 'Send on WhatsApp' in the green alert above to share credentials directly with the driver.`);
    } catch (e: any) {
      alert(e.message || 'Failed to reset password');
    }
  };

  const filteredDrivers = drivers.filter(d => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (d.full_name || '').toLowerCase().includes(q) ||
      (d.username || '').toLowerCase().includes(q) ||
      (d.phone || '').includes(q) ||
      (d.vehicle_number && d.vehicle_number.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Driver Employees</h1>
          <p className="text-sm text-text-secondary">
            Manage driver profiles, authentication logins, vehicle assignments and active status
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="btn-primary rounded-xl text-xs py-2 px-3.5 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Add Driver</span>
        </button>
      </div>

      {/* Created credential notification with 1-click WhatsApp send */}
      {createdInfo && (
        <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div>
            <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-0.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Driver Account Created Successfully</span>
            </div>
            <p className="text-xs text-slate-600 mb-1.5">
              Driver: <span className="font-bold text-slate-800">{createdInfo.name}</span> ({createdInfo.phone})
            </p>
            <div className="font-mono text-xs bg-white px-3 py-1.5 rounded-xl border border-emerald-200 inline-flex items-center gap-2">
              <span>Username: <strong className="text-slate-900">{createdInfo.username}</strong></span>
              <span className="text-slate-300">|</span>
              <span>Password: <strong className="text-slate-900">{createdInfo.pass}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={formatWhatsAppUrl(
                createdInfo.phone,
                generateDriverLoginMessage(createdInfo.name, createdInfo.username, createdInfo.pass, createdInfo.phone)
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all active:scale-95"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Send on WhatsApp</span>
            </a>

            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  generateDriverLoginMessage(createdInfo.name, createdInfo.username, createdInfo.pass, createdInfo.phone)
                );
                alert('Credentials copied to clipboard!');
              }}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-sm transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </button>

            <button
              onClick={() => setCreatedInfo(null)}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600 px-2 py-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="card p-3.5">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search driver by name, username, phone or vehicle..."
        />
      </div>

      {/* Driver Employees Table (matching reference image) */}
      <div className="card p-0 overflow-hidden shadow-card">
        {loading ? (
          <div className="p-16 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredDrivers.length === 0 ? (
          <div className="p-12 text-center text-text-secondary text-sm">
            No driver employees found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-gray-50/80">
                  <th className="table-header">Name</th>
                  <th className="table-header">Username</th>
                  <th className="table-header">Phone</th>
                  <th className="table-header">Vehicle No.</th>
                  <th className="table-header">Trips</th>
                  <th className="table-header">Status</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDrivers.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs uppercase">
                          {d.full_name.substring(0, 2)}
                        </div>
                        <div>
                          <p className="font-bold text-text-primary text-sm">{d.full_name}</p>
                          <p className="text-[11px] text-text-secondary">{d.employee_id || d.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell font-mono text-xs text-text-secondary">
                      {d.username || '-'}
                    </td>
                    <td className="table-cell text-xs text-text-primary">
                      {d.phone}
                    </td>
                    <td className="table-cell font-mono text-xs font-semibold text-navy-primary">
                      {d.vehicle_number || '-'}
                    </td>
                    <td className="table-cell font-bold text-text-primary text-sm">
                      {d.total_trips || 0}
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={d.employment_status || d.status || 'Active'} type="driver" />
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={formatWhatsAppUrl(
                            d.phone,
                            `🚖 *VillaLemon Pickup — Driver Portal*\n\nHello *${d.full_name}*,\n\nYou can access your Driver Portal here:\n🌐 ${window.location.origin}/driver/login\n👤 Username / Phone: ${d.username || d.phone}\n\n*VillaLemon Pickup Operations*`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                          title="Share Driver Portal on WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span className="hidden md:inline">WhatsApp</span>
                        </a>

                        <button
                          onClick={() => handleResetPassword(d)}
                          className="px-2.5 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-text-primary font-medium rounded-lg transition-colors"
                          title="Reset Password"
                        >
                          Reset Pass
                        </button>
                        <button
                          onClick={() => handleToggleStatus(d)}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                            d.employment_status === 'active'
                              ? 'bg-red-50 hover:bg-red-100 text-expense'
                              : 'bg-green-light hover:bg-green-100 text-green-primary'
                          }`}
                        >
                          {d.employment_status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Driver Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Driver Employee"
        size="md"
      >
        <form onSubmit={handleCreateDriver} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Full Name</label>
              <input
                type="text"
                required
                value={formName}
                onChange={e => {
                  setFormName(e.target.value);
                  if (!formUsername) {
                    setFormUsername(e.target.value.toLowerCase().replace(/\s+/g, ''));
                  }
                }}
                placeholder="e.g. Ramesh Kumar"
                className="input-field"
              />
            </div>

            <div>
              <label className="label">Phone Number (Required)</label>
              <input
                type="text"
                required
                value={formPhone}
                onChange={e => setFormPhone(e.target.value)}
                placeholder="919048279460"
                className="input-field font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Login Username</label>
              <input
                type="text"
                required
                value={formUsername}
                onChange={e => setFormUsername(e.target.value.toLowerCase().trim())}
                placeholder="ramesh"
                className="input-field font-mono"
              />
            </div>

            <div>
              <label className="label">Initial Password</label>
              <input
                type="text"
                required
                value={formPassword}
                onChange={e => setFormPassword(e.target.value)}
                placeholder="Temporary password"
                className="input-field font-mono"
              />
            </div>
          </div>

          <div>
            <label className="label">Address (Optional)</label>
            <input
              type="text"
              value={formAddress}
              onChange={e => setFormAddress(e.target.value)}
              placeholder="Varkala, Trivandrum"
              className="input-field"
            />
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-xl">
            <span className="font-bold">Security Notice:</span> Drivers use their username and temporary password to log in via the Driver Portal. They will be prompted to complete their profile (upload photo, licence number, and new strong password) on first login.
          </div>

          <div className="flex items-center gap-2 pt-1 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
            <input
              type="checkbox"
              id="sendWhatsApp"
              checked={sendWhatsAppOnCreate}
              onChange={e => setSendWhatsAppOnCreate(e.target.checked)}
              className="rounded text-green-primary focus:ring-green-primary w-4 h-4 cursor-pointer"
            />
            <label htmlFor="sendWhatsApp" className="text-xs text-slate-800 font-semibold cursor-pointer flex items-center gap-1.5 select-none">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Send login credentials to driver on WhatsApp immediately</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary text-xs"
            >
              {submitting ? 'Creating...' : 'Create Driver Account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DriversPage;

