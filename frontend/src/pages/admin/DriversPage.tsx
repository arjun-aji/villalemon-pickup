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
  Edit2,
  Eye,
  EyeOff,
  CreditCard,
  Calendar,
  MapPin,
  User,
  Wallet,
  AlertCircle,
  Check,
} from 'lucide-react';
import { driverService } from '../../services/driverService';
import { DriverEmployee } from '../../types';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import SearchInput from '../../components/ui/SearchInput';
import { formatDate, formatINR } from '../../utils/formatters';

const DriversPage: React.FC = () => {
  const [drivers, setDrivers] = useState<DriverEmployee[]>([]);
  const [selectedViewDriver, setSelectedViewDriver] = useState<DriverEmployee | null>(null);
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

  // Edit Driver Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<DriverEmployee | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
    username: '',
    password: '',
    driving_licence_no: '',
    licence_expiry: '',
    employment_type: 'Per-trip payment' as 'Per-trip payment' | 'Salaried (monthly)',
    per_trip_payment: 500,
    monthly_salary: 0,
    vehicle_number: '',
    address: '',
    status: 'Active' as 'Active' | 'Inactive',
  });

  // Dedicated Set Driver Password Modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordModalDriver, setPasswordModalDriver] = useState<DriverEmployee | null>(null);
  const [customPassword, setCustomPassword] = useState('');
  const [customUsername, setCustomUsername] = useState('');
  const [showModalPassword, setShowModalPassword] = useState(true);
  const [settingPassword, setSettingPassword] = useState(false);

  const handleOpenPasswordModal = (d: DriverEmployee) => {
    setPasswordModalDriver(d);
    setCustomUsername(d.username || d.phone || '');
    setCustomPassword(d.password || '1234');
    setIsPasswordModalOpen(true);
  };

  const handleSaveCustomPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalDriver) return;
    if (!customPassword.trim()) {
      alert('Please type a password');
      return;
    }

    try {
      setSettingPassword(true);
      const res = await driverService.setDriverCredentials(
        passwordModalDriver.id,
        customPassword.trim(),
        customUsername.trim().toLowerCase()
      );

      if (!res.success) {
        alert(res.error || 'Failed to update driver password');
        return;
      }

      setIsPasswordModalOpen(false);
      setCreatedInfo({
        name: passwordModalDriver.full_name,
        phone: passwordModalDriver.phone,
        username: customUsername.trim().toLowerCase(),
        pass: customPassword.trim(),
      });

      await loadDrivers();
    } catch (err: any) {
      alert(err.message || 'Failed to set driver password');
    } finally {
      setSettingPassword(false);
    }
  };

  const handleOpenEdit = (d: DriverEmployee) => {
    setEditingDriver(d);
    setEditForm({
      full_name: d.full_name || '',
      phone: d.phone || '',
      username: d.username || d.phone || '',
      password: d.password || '',
      driving_licence_no: d.driving_licence_no || '',
      licence_expiry: d.licence_expiry || '',
      employment_type: (d.employment_type as any) || 'Per-trip payment',
      per_trip_payment: Number(d.per_trip_payment) || 500,
      monthly_salary: Number(d.monthly_salary) || 0,
      vehicle_number: d.vehicle_number || '',
      address: d.address || '',
      status: (d.status as any) || 'Active',
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDriver) return;
    try {
      setSubmitting(true);
      await driverService.updateDriver(editingDriver.id, editForm);
      setIsEditModalOpen(false);
      loadDrivers();
    } catch (err: any) {
      alert(err.message || 'Error updating driver');
    } finally {
      setSubmitting(false);
    }
  };

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
    return `🚖 *Varkala Holidays — Driver Login Credentials*

Hello *${name}*,
Here are your login credentials to access the Driver Portal:
🌐 *Driver Portal:* ${origin}/driver/login
👤 *Username:* ${username || phone}
🔑 *Password:* ${pass}

⚠️ *Notice:*
Please keep your password secure. Driver passwords can only be changed or reset by Varkala Holidays administration.

Thank you,
*Varkala Holidays Operations*`;
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
    handleOpenPasswordModal(driver);
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
              <span>Driver Credentials Ready / Updated</span>
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
                        <button
                          onClick={() => setSelectedViewDriver(d)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-semibold shadow-xs"
                          title="View Driver Details"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-600" />
                          <span>View</span>
                        </button>

                        <button
                          onClick={() => handleOpenEdit(d)}
                          className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                          title="Edit Driver Profile"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <a
                          href={formatWhatsAppUrl(
                            d.phone,
                            `🚖 *Varkala Holidays — Driver Portal*\n\nHello *${d.full_name}*,\n\nYou can access your Driver Portal here:\n🌐 ${window.location.origin}/driver/login\n👤 Username / Phone: ${d.username || d.phone}\n\n*Varkala Holidays Operations*`
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
                          onClick={() => handleOpenPasswordModal(d)}
                          className="px-2.5 py-1 text-xs bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-lg transition-colors flex items-center gap-1"
                          title="Set or Reset Driver Login Password"
                        >
                          <KeyRound className="w-3 h-3 text-amber-600" />
                          <span>Set Pass</span>
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
              <label className="label">Login Password (Set by Admin)</label>
              <input
                type="text"
                required
                value={formPassword}
                onChange={e => setFormPassword(e.target.value)}
                placeholder="Type password, e.g. 1234"
                className="input-field font-mono font-bold"
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
            <span className="font-bold">Security Rule:</span> You are setting this driver's login password. Drivers cannot edit or change their password. If they ever forget it, only an admin can reset or set a new password.
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

      {/* Edit Driver Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Driver Profile: ${editingDriver?.full_name}`}
        size="md"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Full Name *</label>
              <input
                type="text"
                required
                value={editForm.full_name}
                onChange={e => setEditForm({ ...editForm, full_name: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Phone Number *</label>
              <input
                type="tel"
                required
                value={editForm.phone}
                onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                className="input-field font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Username</label>
              <input
                type="text"
                value={editForm.username}
                onChange={e => setEditForm({ ...editForm, username: e.target.value })}
                className="input-field font-mono"
              />
            </div>
            <div>
              <label className="label">Set New Password (Optional)</label>
              <input
                type="text"
                value={editForm.password}
                onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                placeholder="Leave blank or type new password"
                className="input-field font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="label">Vehicle Number</label>
            <input
              type="text"
              value={editForm.vehicle_number}
              onChange={e => setEditForm({ ...editForm, vehicle_number: e.target.value })}
              placeholder="KL 16 Q 7965"
              className="input-field font-mono uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Driving Licence No</label>
              <input
                type="text"
                value={editForm.driving_licence_no}
                onChange={e => setEditForm({ ...editForm, driving_licence_no: e.target.value })}
                placeholder="KL-01-2020-0001234"
                className="input-field font-mono uppercase"
              />
            </div>
            <div>
              <label className="label">Licence Expiry</label>
              <input
                type="date"
                value={editForm.licence_expiry}
                onChange={e => setEditForm({ ...editForm, licence_expiry: e.target.value })}
                className="input-field font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Employment Type *</label>
              <select
                value={editForm.employment_type}
                onChange={e => setEditForm({ ...editForm, employment_type: e.target.value as any })}
                className="input-field"
              >
                <option value="Per-trip payment">Per-trip payment</option>
                <option value="Salaried (monthly)">Salaried (monthly)</option>
              </select>
            </div>
            <div>
              {editForm.employment_type === 'Per-trip payment' ? (
                <div>
                  <label className="label">Per-Trip Pay Rate (₹)</label>
                  <input
                    type="number"
                    value={editForm.per_trip_payment}
                    onChange={e => setEditForm({ ...editForm, per_trip_payment: Number(e.target.value) || 0 })}
                    className="input-field font-mono font-bold"
                  />
                </div>
              ) : (
                <div>
                  <label className="label">Monthly Salary (₹)</label>
                  <input
                    type="number"
                    value={editForm.monthly_salary}
                    onChange={e => setEditForm({ ...editForm, monthly_salary: Number(e.target.value) || 0 })}
                    className="input-field font-mono font-bold"
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="label">Address (Optional)</label>
            <input
              type="text"
              value={editForm.address}
              onChange={e => setEditForm({ ...editForm, address: e.target.value })}
              placeholder="Varkala, Trivandrum"
              className="input-field"
            />
          </div>

          <div>
            <label className="label">Account Status</label>
            <select
              value={editForm.status}
              onChange={e => setEditForm({ ...editForm, status: e.target.value as any })}
              className="input-field"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary text-xs"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Set Driver Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title={`Set Password: ${passwordModalDriver?.full_name || 'Driver'}`}
        size="md"
      >
        <form onSubmit={handleSaveCustomPassword} className="space-y-4 text-xs">
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-950 leading-relaxed">
            <span className="font-bold flex items-center gap-1.5 mb-1 text-emerald-800">
              <KeyRound className="w-4 h-4 text-emerald-600" />
              <span>Admin Controlled Password</span>
            </span>
            <span>You set the password for this driver. Drivers cannot edit or change their password. Type any password you wish to assign below and click save.</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Driver Name</label>
              <input
                type="text"
                disabled
                value={passwordModalDriver?.full_name || ''}
                className="input-field bg-slate-100 text-slate-700 font-bold"
              />
            </div>
            <div>
              <label className="label">Phone Number</label>
              <input
                type="text"
                disabled
                value={passwordModalDriver?.phone || ''}
                className="input-field bg-slate-100 text-slate-700 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="label">Login Username</label>
            <input
              type="text"
              required
              value={customUsername}
              onChange={e => setCustomUsername(e.target.value.toLowerCase().trim())}
              placeholder="e.g. bimal"
              className="input-field font-mono font-bold"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Driver can log in using either this username or their phone number.</span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label mb-0">New Password (Type whatever you want)</label>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400">Presets:</span>
                <button
                  type="button"
                  onClick={() => setCustomPassword('1234')}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-mono font-bold text-slate-700"
                >
                  1234
                </button>
                <button
                  type="button"
                  onClick={() => setCustomPassword('driver123')}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-mono font-bold text-slate-700"
                >
                  driver123
                </button>
              </div>
            </div>
            <div className="relative">
              <input
                type={showModalPassword ? 'text' : 'password'}
                required
                value={customPassword}
                onChange={e => setCustomPassword(e.target.value)}
                placeholder="Type password, e.g. 1234"
                className="input-field font-mono font-bold text-sm tracking-wider pr-10"
              />
              <button
                type="button"
                onClick={() => setShowModalPassword(!showModalPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                title={showModalPassword ? 'Hide Password' : 'Show Password'}
              >
                {showModalPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={settingPassword}
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              {settingPassword ? <LoadingSpinner size="sm" /> : <KeyRound className="w-3.5 h-3.5" />}
              <span>{settingPassword ? 'Saving Password...' : 'Save & Set Password'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* View Driver Details Modal */}
      {selectedViewDriver && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedViewDriver(null)}
          title="Driver Profile & Verification Details"
          size="lg"
        >
          <div className="space-y-5">
            {/* 1. Header Profile Banner */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 rounded-2xl text-white shadow-md">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-700 border-2 border-emerald-400 flex items-center justify-center shrink-0 shadow-md">
                      {selectedViewDriver.photo_url ? (
                        <img
                          src={selectedViewDriver.photo_url}
                          alt={selectedViewDriver.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-black text-lg text-emerald-300 uppercase">
                          {selectedViewDriver.full_name.substring(0, 2)}
                        </span>
                      )}
                    </div>
                    {selectedViewDriver.is_profile_completed && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-white" title="Profile Verified">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-black tracking-tight text-white">
                        {selectedViewDriver.full_name}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        selectedViewDriver.status === 'Active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' : 'bg-red-500/20 text-red-300 border border-red-400/30'
                      }`}>
                        {selectedViewDriver.status || 'Active'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-300 mt-1 flex-wrap font-mono">
                      <span>ID: <strong>{selectedViewDriver.employee_id || selectedViewDriver.id.slice(0, 8)}</strong></span>
                      <span>•</span>
                      <span>Username: <strong className="text-emerald-300">@{selectedViewDriver.username || selectedViewDriver.phone}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-end gap-1.5 self-stretch sm:self-auto justify-between sm:justify-start border-t sm:border-t-0 border-slate-700/60 pt-3 sm:pt-0">
                  <span className="text-[11px] text-slate-400 font-medium">Employment Model</span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-white/10 text-emerald-300 text-xs font-bold border border-white/10">
                    {selectedViewDriver.employment_type === 'Salaried (monthly)'
                      ? `Salary: ${formatINR(selectedViewDriver.monthly_salary)}/mo`
                      : `Per Trip: ${formatINR(selectedViewDriver.per_trip_payment || 500)}`}
                  </span>
                </div>
              </div>

              {/* Profile Setup Onboarding Status */}
              <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between flex-wrap gap-2 text-xs">
                {selectedViewDriver.is_profile_completed ? (
                  <div className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Driver completed onboarding profile setup on portal</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Driver has not completed profile setup yet (temporary credentials active)</span>
                  </div>
                )}
                {selectedViewDriver.created_at && (
                  <span className="text-slate-400 text-[11px]">
                    Joined: {formatDate(selectedViewDriver.created_at)}
                  </span>
                )}
              </div>
            </div>

            {/* 2. Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Box A: Credentials & Profile Details (Filled by Driver) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span>Licence & Onboarding Info</span>
                  </h4>
                  <span className="text-[10px] font-semibold text-slate-400">Driver Setup</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Driving Licence Number</span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="font-mono font-bold text-slate-900 bg-white px-2 py-1 rounded-lg border border-slate-200 text-xs">
                        {selectedViewDriver.driving_licence_no || 'Not provided'}
                      </span>
                      {selectedViewDriver.driving_licence_no && selectedViewDriver.driving_licence_no !== 'N/A' && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(selectedViewDriver.driving_licence_no);
                            alert('Licence number copied to clipboard!');
                          }}
                          className="text-slate-400 hover:text-slate-700 p-1"
                          title="Copy Licence"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Licence Expiry</span>
                      <span className="font-semibold text-slate-800">
                        {selectedViewDriver.licence_expiry ? formatDate(selectedViewDriver.licence_expiry) : 'Not specified'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">Assigned / Own Vehicle</span>
                      <span className="font-mono font-bold text-slate-900">
                        {selectedViewDriver.vehicle_number || 'Not assigned'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px]">Residential Address</span>
                    <p className="text-slate-800 font-medium text-xs mt-0.5">
                      {selectedViewDriver.address || <span className="text-slate-400 italic">No address entered</span>}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px]">Contact & WhatsApp</span>
                    <div className="flex items-center justify-between mt-1 gap-2 flex-wrap">
                      <span className="font-mono font-bold text-slate-900">{selectedViewDriver.phone}</span>
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`tel:${selectedViewDriver.phone}`}
                          className="px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-semibold inline-flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call</span>
                        </a>
                        <a
                          href={formatWhatsAppUrl(
                            selectedViewDriver.phone,
                            `Hello ${selectedViewDriver.full_name}, this is Varkala Holidays Operations.`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-semibold inline-flex items-center gap-1"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Box B: Financial Balances & Trip Stats */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Wallet className="w-4 h-4 text-blue-600" />
                      <span>Ledger & Trip Performance</span>
                    </h4>
                    <span className="text-[10px] font-semibold text-slate-400">Live Balances</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Payable to Driver</span>
                      <span className="text-sm font-black text-emerald-600 font-mono mt-0.5 block">
                        {formatINR(selectedViewDriver.balance_payable_to_driver || 0)}
                      </span>
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Cash Held / Owed</span>
                      <span className="text-sm font-black text-amber-600 font-mono mt-0.5 block">
                        {formatINR(selectedViewDriver.cash_owed_to_office || 0)}
                      </span>
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Net Settlement</span>
                      <span className="text-sm font-black text-slate-900 font-mono mt-0.5 block">
                        {formatINR(selectedViewDriver.net_settlement_amount || 0)}
                      </span>
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Completed Trips</span>
                      <span className="text-sm font-black text-blue-600 font-mono mt-0.5 block">
                        {selectedViewDriver.completed_trips || 0} / {selectedViewDriver.total_trips || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Driver Photo expansion (if available) */}
                {selectedViewDriver.photo_url && (
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs mt-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                        <img src={selectedViewDriver.photo_url} alt="Profile" className="w-full h-full object-cover" />
                      </div>
                      <span className="font-semibold text-slate-700 text-[11px]">Driver Photo Uploaded</span>
                    </div>
                    <a
                      href={selectedViewDriver.photo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-[11px] font-bold inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>View Full Image</span>
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 gap-2 flex-wrap">
              <a
                href={formatWhatsAppUrl(
                  selectedViewDriver.phone,
                  `🚖 *Varkala Holidays — Driver Account Details*\n\nHello *${selectedViewDriver.full_name}*,\nHere are your account details:\n👤 Username: ${selectedViewDriver.username || selectedViewDriver.phone}\n🌐 Driver Portal: ${window.location.origin}/driver/login\n\n*Varkala Holidays Operations*`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-white" />
                <span>Send Portal Link</span>
              </a>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const d = selectedViewDriver;
                    setSelectedViewDriver(null);
                    handleOpenPasswordModal(d);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs inline-flex items-center gap-1.5 border border-amber-200 transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                  <span>Set / Reset Password</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = selectedViewDriver;
                    setSelectedViewDriver(null);
                    handleOpenEdit(d);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Driver</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedViewDriver(null)}
                  className="btn-secondary text-xs px-3.5 py-1.5"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DriversPage;

