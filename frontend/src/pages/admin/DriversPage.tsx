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
  const [formEmpId, setFormEmpId] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formVehicle, setFormVehicle] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Success credential alert
  const [createdInfo, setCreatedInfo] = useState<{ username: string; pass: string } | null>(null);

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
    const nextNum = drivers.length + 1;
    setFormEmpId(`VL-D0${nextNum}`);
    setFormName('');
    setFormUsername('');
    setFormPhone('');
    setFormEmail('');
    setFormVehicle('');
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
          full_name: formName,
          employee_id: formEmpId,
          username: cleanUsername,
          phone: formPhone,
          email: formEmail || `${cleanUsername}@villalemon.pickup`,
          vehicle_number: formVehicle,
          address: formAddress,
        },
        formPassword
      );

      setIsAddModalOpen(false);
      setCreatedInfo({ username: cleanUsername, pass: formPassword });
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
      alert(`Password reset for ${driver.full_name}!\nTemporary Password: ${res.tempPassword || 'driver123'}\nDriver must change password upon next login.`);
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

      {/* Created credential notification */}
      {createdInfo && (
        <div className="p-4 bg-green-light border border-green-primary/30 rounded-2xl flex items-start justify-between">
          <div>
            <p className="text-xs font-bold text-green-primary uppercase tracking-wider mb-1">
              Account Created Successfully
            </p>
            <p className="text-sm text-text-primary">
              Share login credentials with the driver:
            </p>
            <div className="mt-1 font-mono text-xs bg-white px-3 py-1.5 rounded-lg border border-border inline-block">
              Username: <span className="font-bold text-navy-primary">{createdInfo.username}</span> | Password:{' '}
              <span className="font-bold text-navy-primary">{createdInfo.pass}</span>
            </div>
          </div>
          <button
            onClick={() => setCreatedInfo(null)}
            className="text-xs font-semibold text-green-primary hover:underline"
          >
            Dismiss
          </button>
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
              <label className="label">Employee ID</label>
              <input
                type="text"
                required
                value={formEmpId}
                onChange={e => setFormEmpId(e.target.value)}
                placeholder="VL-D05"
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Phone Number</label>
              <input
                type="text"
                required
                value={formPhone}
                onChange={e => setFormPhone(e.target.value)}
                placeholder="98765 00000"
                className="input-field"
              />
            </div>

            <div>
              <label className="label">Vehicle Number</label>
              <input
                type="text"
                value={formVehicle}
                onChange={e => setFormVehicle(e.target.value)}
                placeholder="KL-16-E-7890"
                className="input-field uppercase font-mono"
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
            <span className="font-bold">Security Notice:</span> Drivers use their username and temporary password to log in via the Driver Portal. They can change their password after first login.
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

