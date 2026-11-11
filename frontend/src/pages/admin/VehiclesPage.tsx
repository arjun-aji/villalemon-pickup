import React, { useEffect, useState } from 'react';
import {
  Car,
  PlusCircle,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Phone,
  ShieldCheck,
  Edit2,
  X,
  Clock,
} from 'lucide-react';
import { vehicleService } from '../../services/adminOperationsService';
import { Vehicle, VehicleType, VehicleOwnership, VehicleStatus } from '../../types';
import { formatDate } from '../../utils/formatters';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const VEHICLE_TYPES: VehicleType[] = [
  'Sedan',
  'SUV',
  'Innova',
  'Ertiga',
  'Tempo Traveller 17-seater',
  'Tempo Traveller 26-seater',
  'Other',
];

const VEHICLE_STATUSES: VehicleStatus[] = [
  'Available',
  'On trip',
  'Under repair',
  'Inactive',
];

const VehiclesPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    registration_number: '',
    vehicle_type: 'Sedan' as VehicleType,
    passenger_capacity: 4,
    ownership: 'Own' as VehicleOwnership,
    owner_supplier_name: 'Varkala Holidays Fleet',
    supplier_phone: '',
    insurance_expiry: '',
    permit_expiry: '',
    fitness_certificate_expiry: '',
    puc_expiry: '',
    status: 'Available' as VehicleStatus,
    document_notes: '',
  });

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const data = await vehicleService.getAll();
      setVehicles(data);
    } catch (err) {
      console.error('Failed to load vehicles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingVehicle(null);
    setFormData({
      registration_number: '',
      vehicle_type: 'Sedan',
      passenger_capacity: 4,
      ownership: 'Own',
      owner_supplier_name: 'Varkala Holidays Fleet',
      supplier_phone: '',
      insurance_expiry: '',
      permit_expiry: '',
      fitness_certificate_expiry: '',
      puc_expiry: '',
      status: 'Available',
      document_notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v: Vehicle) => {
    setEditingVehicle(v);
    setFormData({
      registration_number: v.registration_number,
      vehicle_type: v.vehicle_type,
      passenger_capacity: v.passenger_capacity || 4,
      ownership: v.ownership,
      owner_supplier_name: v.owner_supplier_name || '',
      supplier_phone: v.supplier_phone || '',
      insurance_expiry: v.insurance_expiry ? v.insurance_expiry.split('T')[0] : '',
      permit_expiry: v.permit_expiry ? v.permit_expiry.split('T')[0] : '',
      fitness_certificate_expiry: v.fitness_certificate_expiry ? v.fitness_certificate_expiry.split('T')[0] : '',
      puc_expiry: v.puc_expiry ? v.puc_expiry.split('T')[0] : '',
      status: v.status,
      document_notes: v.document_notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        ...formData,
        insurance_expiry: formData.insurance_expiry || null,
        permit_expiry: formData.permit_expiry || null,
        fitness_certificate_expiry: formData.fitness_certificate_expiry || null,
        puc_expiry: formData.puc_expiry || null,
      };

      if (editingVehicle) {
        await vehicleService.update(editingVehicle.id, payload);
      } else {
        await vehicleService.create(payload);
      }
      setIsModalOpen(false);
      loadVehicles();
    } catch (err: any) {
      alert(err.message || 'Error saving vehicle');
    }
  };

  const filtered = vehicles.filter(v => {
    if (statusFilter !== 'all' && v.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchReg = (v.registration_number || '').toLowerCase().includes(q);
      const matchType = (v.vehicle_type || '').toLowerCase().includes(q);
      const matchOwner = (v.owner_supplier_name || '').toLowerCase().includes(q);
      return matchReg || matchType || matchOwner;
    }
    return true;
  });

  const expiredCount = vehicles.filter(v => v.document_alert && v.document_alert.includes('EXPIRED')).length;
  const expiringSoonCount = vehicles.filter(v => v.document_alert && v.document_alert.includes('DUE SOON')).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Vehicle Fleet</h1>
          <p className="text-xs text-slate-500">
            Own & hired fleet, passenger capacity, document renewal compliance (Insurance, Permit, Fitness, PUC)
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Vehicle</span>
        </button>
      </div>

      {/* Fleet KPI Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Total Fleet</span>
          <p className="text-2xl font-black text-slate-900">{vehicles.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">
            {vehicles.filter(v => v.ownership === 'Own').length} Own • {vehicles.filter(v => v.ownership === 'Hired').length} Hired
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Available for Duty</span>
          <p className="text-2xl font-black text-emerald-600">
            {vehicles.filter(v => v.status === 'Available').length}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Ready for dispatch</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Documents Expired</span>
          <p className={`text-2xl font-black ${expiredCount > 0 ? 'text-red-600' : 'text-slate-400'}`}>
            {expiredCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Immediate renewal needed</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Expiring in 30 Days</span>
          <p className={`text-2xl font-black ${expiringSoonCount > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
            {expiringSoonCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Advance notice for renewal</p>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search registration, model, owner..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="all">All Statuses ({vehicles.length})</option>
            {VEHICLE_STATUSES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Car className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No vehicles found</p>
            <p className="text-xs text-slate-500 mt-1">Click "Add New Vehicle" to add vehicles to your fleet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Reg #</th>
                  <th className="py-3 px-4">Type & Capacity</th>
                  <th className="py-3 px-4">Ownership</th>
                  <th className="py-3 px-4">Insurance Expiry</th>
                  <th className="py-3 px-4">Permit Expiry</th>
                  <th className="py-3 px-4">Fitness Expiry</th>
                  <th className="py-3 px-4">PUC Expiry</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Compliance Alert</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(v => {
                  const hasExpired = v.document_alert && v.document_alert.includes('EXPIRED');
                  const hasDueSoon = v.document_alert && v.document_alert.includes('DUE SOON');
                  return (
                    <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 text-sm">
                        {v.registration_number}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-800">{v.vehicle_type}</p>
                        <p className="text-[11px] text-slate-500">{v.passenger_capacity} seats</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          v.ownership === 'Own' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {v.ownership}
                        </span>
                        {v.owner_supplier_name && v.ownership === 'Hired' && (
                          <span className="block text-[10px] text-slate-500 truncate max-w-[120px]">
                            {v.owner_supplier_name}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {formatDate(v.insurance_expiry || '')}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {formatDate(v.permit_expiry || '')}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {formatDate(v.fitness_certificate_expiry || '')}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {formatDate(v.puc_expiry || '')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          v.status === 'Available'
                            ? 'bg-emerald-100 text-emerald-800'
                            : v.status === 'On trip'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {hasExpired ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                            <AlertTriangle className="w-3 h-3" />
                            <span>EXPIRED</span>
                          </span>
                        ) : hasDueSoon ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                            <Clock className="w-3 h-3" />
                            <span>DUE SOON</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Valid</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleOpenEdit(v)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                          title="Edit Vehicle Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingVehicle ? 'Edit Vehicle' : 'Register New Vehicle'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Registration # *</label>
                  <input
                    type="text"
                    value={formData.registration_number}
                    onChange={e => setFormData({ ...formData, registration_number: e.target.value.toUpperCase() })}
                    required
                    placeholder="KL-01-AB-1234"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vehicle Type *</label>
                  <select
                    value={formData.vehicle_type}
                    onChange={e => setFormData({ ...formData, vehicle_type: e.target.value as VehicleType })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {VEHICLE_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Capacity (Pax) *</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={formData.passenger_capacity}
                    onChange={e => setFormData({ ...formData, passenger_capacity: parseInt(e.target.value, 10) || 4 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ownership *</label>
                  <select
                    value={formData.ownership}
                    onChange={e => setFormData({ ...formData, ownership: e.target.value as VehicleOwnership })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Own">Own Vehicle</option>
                    <option value="Hired">Hired Vehicle</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Owner / Supplier</label>
                  <input
                    type="text"
                    value={formData.owner_supplier_name}
                    onChange={e => setFormData({ ...formData, owner_supplier_name: e.target.value })}
                    placeholder="Owner / Vendor Name"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Operational Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as VehicleStatus })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {VEHICLE_STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Document Expiry Section */}
              <div className="p-3 bg-slate-50 rounded-xl space-y-3">
                <p className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">
                  Document Expiry Dates
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Insurance Expiry</label>
                    <input
                      type="date"
                      value={formData.insurance_expiry}
                      onChange={e => setFormData({ ...formData, insurance_expiry: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Permit Expiry</label>
                    <input
                      type="date"
                      value={formData.permit_expiry}
                      onChange={e => setFormData({ ...formData, permit_expiry: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Fitness Certificate (FC)</label>
                    <input
                      type="date"
                      value={formData.fitness_certificate_expiry}
                      onChange={e => setFormData({ ...formData, fitness_certificate_expiry: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 mb-1">PUC / Pollution Expiry</label>
                    <input
                      type="date"
                      value={formData.puc_expiry}
                      onChange={e => setFormData({ ...formData, puc_expiry: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md"
                >
                  {editingVehicle ? 'Update Vehicle' : 'Save Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehiclesPage;
