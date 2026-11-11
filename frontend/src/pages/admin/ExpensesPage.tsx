import React, { useEffect, useState } from 'react';
import {
  Receipt,
  PlusCircle,
  Search,
  Filter,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Calendar,
  User,
  Car,
  X,
  CreditCard,
} from 'lucide-react';
import { generalExpenseService, vehicleService } from '../../services/adminOperationsService';
import { driverService } from '../../services/driverService';
import { tripService } from '../../services/tripService';
import {
  Expense,
  ExpenseGroup,
  PaymentMethod,
  PaidBy,
  Driver,
  Vehicle,
  Trip,
} from '../../types';
import { formatINR, formatDate } from '../../utils/formatters';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const EXPENSE_GROUPS: ExpenseGroup[] = [
  'Trip',
  'Vehicle/Workshop',
  'Office',
  'Staff Salary',
  'Hired Vehicle',
];

const CATEGORIES_BY_GROUP: Record<ExpenseGroup, string[]> = {
  Trip: ['Diesel', 'Parking', 'Permits', 'Toll', 'Tickets', 'Food', 'Driver Allowance'],
  'Vehicle/Workshop': ['Workshop', 'Spare Parts', 'Service', 'Tyres', 'Car Wash'],
  Office: ['Office Expenses', 'Tea / Refreshments', 'Electricity', 'Internet', 'Stationery'],
  'Staff Salary': ['Staff Salary', 'Driver Salary Advance', 'Bonus'],
  'Hired Vehicle': ['Hired Vehicle Costs', 'Subcontractor Payment'],
};

const PAYMENT_METHODS: PaymentMethod[] = [
  'Cash',
  'UPI',
  'Bank transfer',
  'Card',
  'Cheque',
];

const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    expense_date: new Date().toISOString().split('T')[0],
    expense_group: 'Trip' as ExpenseGroup,
    category: 'Diesel',
    amount: 0,
    description: '',
    payment_method: 'Cash' as PaymentMethod,
    paid_by: 'Office' as PaidBy,
    driver_id: '',
    vehicle_id: '',
    trip_id: '',
    receipt_url: '',
  });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [expList, drvList, vehList, trpList] = await Promise.all([
        generalExpenseService.getAll(),
        driverService.getAll(),
        vehicleService.getAll(),
        tripService.getAll(),
      ]);
      setExpenses(expList);
      setDrivers(drvList);
      setVehicles(vehList);
      setTrips(trpList);
    } catch (err) {
      console.error('Failed to load expense operations data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setFormData({
      expense_date: new Date().toISOString().split('T')[0],
      expense_group: 'Trip',
      category: 'Diesel',
      amount: 0,
      description: '',
      payment_method: 'Cash',
      paid_by: 'Office',
      driver_id: drivers[0]?.id || '',
      vehicle_id: vehicles[0]?.id || '',
      trip_id: '',
      receipt_url: '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0) {
      alert('Amount must be greater than zero');
      return;
    }

    try {
      const payload: any = {
        ...formData,
        driver_id: formData.driver_id || null,
        vehicle_id: formData.vehicle_id || null,
        trip_id: formData.trip_id || null,
      };
      await generalExpenseService.create(payload);
      setIsModalOpen(false);
      loadAll();
    } catch (err: any) {
      alert(err.message || 'Error saving expense');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) return;
    try {
      await generalExpenseService.delete(id);
      loadAll();
    } catch (err: any) {
      alert(err.message || 'Error deleting expense');
    }
  };

  const filtered = expenses.filter(e => {
    if (groupFilter !== 'all' && e.expense_group !== groupFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNum = (e.expense_number || '').toLowerCase().includes(q);
      const matchCat = (e.category || '').toLowerCase().includes(q);
      const matchDesc = (e.description || '').toLowerCase().includes(q);
      const matchDriver = (e.driver?.full_name || '').toLowerCase().includes(q);
      return matchNum || matchCat || matchDesc || matchDriver;
    }
    return true;
  });

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const tripExpenses = expenses.filter(e => e.expense_group === 'Trip').reduce((sum, e) => sum + (e.amount || 0), 0);
  const workshopExpenses = expenses.filter(e => e.expense_group === 'Vehicle/Workshop').reduce((sum, e) => sum + (e.amount || 0), 0);
  const salaryExpenses = expenses.filter(e => e.expense_group === 'Staff Salary').reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Expenses & Cost Tracking</h1>
          <p className="text-xs text-slate-500">
            Trip running costs (diesel, toll, parking), vehicle maintenance, workshop, staff salaries, and office overheads
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Record New Expense</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Total Expenses</span>
          <p className="text-2xl font-black text-slate-900">{formatINR(totalExpenseAmount)}</p>
          <p className="text-[11px] text-slate-500 mt-1">{expenses.length} entries recorded</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Trip Running Costs</span>
          <p className="text-2xl font-black text-amber-600">{formatINR(tripExpenses)}</p>
          <p className="text-[11px] text-slate-500 mt-1">Diesel, toll, permits, food</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Vehicle / Workshop</span>
          <p className="text-2xl font-black text-blue-900">{formatINR(workshopExpenses)}</p>
          <p className="text-[11px] text-slate-500 mt-1">Maintenance & repairs</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Staff & Salaries</span>
          <p className="text-2xl font-black text-purple-900">{formatINR(salaryExpenses)}</p>
          <p className="text-[11px] text-slate-500 mt-1">Payroll & advances</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search expense #, category, note..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={groupFilter}
            onChange={e => setGroupFilter(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="all">All Groups ({expenses.length})</option>
            {EXPENSE_GROUPS.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No expenses recorded</p>
            <p className="text-xs text-slate-500 mt-1">Click "Record New Expense" to log business or trip costs.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Group & Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Linked Trip / Cab</th>
                  <th className="py-3 px-4">Paid By</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {exp.expense_number}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {formatDate(exp.expense_date)}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{exp.category}</p>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">
                        {exp.expense_group}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-[200px] truncate text-slate-600">
                      {exp.description || '-'}
                    </td>
                    <td className="py-3 px-4">
                      {exp.trip ? (
                        <span className="font-mono text-blue-700 font-bold block">{exp.trip.trip_number}</span>
                      ) : null}
                      {exp.vehicle ? (
                        <span className="font-mono text-slate-600 text-[11px] block">{exp.vehicle.registration_number}</span>
                      ) : null}
                      {exp.driver ? (
                        <span className="text-slate-500 text-[10px]">{exp.driver.full_name}</span>
                      ) : null}
                      {!exp.trip && !exp.vehicle && !exp.driver && (
                        <span className="text-slate-400 italic">General Office</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        exp.paid_by === 'Office' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {exp.paid_by}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {exp.payment_method}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-slate-900 font-mono text-sm">
                      {formatINR(exp.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Record New Expense</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expense Date *</label>
                  <input
                    type="date"
                    value={formData.expense_date}
                    onChange={e => setFormData({ ...formData, expense_date: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={formData.amount || ''}
                    onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    required
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expense Group *</label>
                  <select
                    value={formData.expense_group}
                    onChange={e => {
                      const group = e.target.value as ExpenseGroup;
                      setFormData({
                        ...formData,
                        expense_group: group,
                        category: CATEGORIES_BY_GROUP[group][0] || 'General',
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  >
                    {EXPENSE_GROUPS.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  >
                    {CATEGORIES_BY_GROUP[formData.expense_group].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Paid By *</label>
                  <select
                    value={formData.paid_by}
                    onChange={e => setFormData({ ...formData, paid_by: e.target.value as PaidBy })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  >
                    <option value="Office">Office</option>
                    <option value="Driver">Driver</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Method *</label>
                  <select
                    value={formData.payment_method}
                    onChange={e => setFormData({ ...formData, payment_method: e.target.value as PaymentMethod })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  >
                    {PAYMENT_METHODS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Bill Memo</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Fuel 30L at Indian Oil Petrol Pump, Highway"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              {/* Optional Links */}
              <div className="p-3 bg-slate-50 rounded-xl space-y-3">
                <p className="font-bold text-slate-700 uppercase text-[10px]">Optional Linking</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">Driver</label>
                    <select
                      value={formData.driver_id}
                      onChange={e => setFormData({ ...formData, driver_id: e.target.value })}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="">-- None --</option>
                      {drivers.map(d => (
                        <option key={d.id} value={d.id}>{d.full_name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">Vehicle</label>
                    <select
                      value={formData.vehicle_id}
                      onChange={e => setFormData({ ...formData, vehicle_id: e.target.value })}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="">-- None --</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.registration_number}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">Trip</label>
                    <select
                      value={formData.trip_id}
                      onChange={e => setFormData({ ...formData, trip_id: e.target.value })}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="">-- None --</option>
                      {trips.slice(0, 30).map(t => (
                        <option key={t.id} value={t.id}>{t.trip_number} ({t.guest_names || t.customer_name})</option>
                      ))}
                    </select>
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
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;
