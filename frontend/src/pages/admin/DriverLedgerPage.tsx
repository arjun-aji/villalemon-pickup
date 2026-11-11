import React, { useEffect, useState } from 'react';
import {
  Wallet,
  PlusCircle,
  Search,
  Filter,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  User,
  Calendar,
  AlertCircle,
  CheckCircle2,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { driverLedgerService } from '../../services/adminOperationsService';
import { driverService } from '../../services/driverService';
import {
  DriverLedgerEntry,
  DriverLedgerEntryType,
  Driver,
} from '../../types';
import { formatINR, formatDate } from '../../utils/formatters';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const ENTRY_TYPES: DriverLedgerEntryType[] = [
  'Salary due',
  'Advance',
  'Deduction',
  'Payment made',
  'Money sent for expenses',
  'Cash handed to office',
];

const DriverLedgerPage: React.FC = () => {
  const [entries, setEntries] = useState<DriverLedgerEntry[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    entry_date: new Date().toISOString().split('T')[0],
    driver_id: '',
    entry_type: 'Salary due' as DriverLedgerEntryType,
    amount: 0,
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, [selectedDriverId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [drvList, balList, entryList] = await Promise.all([
        driverService.getAll(),
        driverLedgerService.getDriverBalances(),
        driverLedgerService.getEntriesByDriver(selectedDriverId === 'all' ? undefined : selectedDriverId),
      ]);
      setDrivers(drvList);
      setBalances(balList);
      setEntries(entryList);

      if (drvList.length > 0 && !formData.driver_id) {
        setFormData(prev => ({ ...prev, driver_id: drvList[0].id }));
      }
    } catch (err) {
      console.error('Error loading driver ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setFormData({
      entry_date: new Date().toISOString().split('T')[0],
      driver_id: selectedDriverId !== 'all' ? selectedDriverId : (drivers[0]?.id || ''),
      entry_type: 'Salary due',
      amount: 0,
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.driver_id) {
      alert('Please select a driver');
      return;
    }
    if (formData.amount <= 0) {
      alert('Amount must be greater than zero');
      return;
    }

    try {
      await driverLedgerService.createEntry({
        ...formData,
        amount: Number(formData.amount),
      });
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error recording ledger entry');
    }
  };

  // Find balances for active selected driver or aggregate
  const currentDriverBalance = balances.find(b => b.id === selectedDriverId);

  const totalPayableAll = balances.reduce((sum, b) => sum + (b.balance_payable_to_driver || 0), 0);
  const totalCashHeldAll = balances.reduce((sum, b) => sum + (b.cash_owed_to_office || 0), 0);
  const netSettlementAll = totalPayableAll - totalCashHeldAll;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Driver Ledger & Settlements</h1>
          <p className="text-xs text-slate-500">
            Strict two-way dual ledger: Driver Salary / Pay reconciliation vs. Business Cash collected & expenses
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Ledger Entry</span>
        </button>
      </div>

      {/* Driver Selector & Dual Balance Cards */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-700">Filter Driver:</span>
          <select
            value={selectedDriverId}
            onChange={e => setSelectedDriverId(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="all">All Drivers ({drivers.length})</option>
            {drivers.map(d => (
              <option key={d.id} value={d.id}>{d.full_name} ({d.phone})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Dual Balances Highlights Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Ledger 1: Balance Payable to Driver */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
              1. Balance Payable to Driver
            </span>
            <Wallet className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">
            {formatINR(selectedDriverId === 'all' ? totalPayableAll : (currentDriverBalance?.balance_payable_to_driver || 0))}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Trip earnings + Salary Due − Advances & Deductions
          </p>
        </div>

        {/* Ledger 2: Cash Held by Driver */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
              2. Cash Held by Driver
            </span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-700">
            {formatINR(selectedDriverId === 'all' ? totalCashHeldAll : (currentDriverBalance?.cash_owed_to_office || 0))}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Guest cash + Expense funds − Driver-spent diesel/toll
          </p>
        </div>

        {/* Final Net Settlement */}
        <div className="bg-gradient-to-br from-[#0F1E36] to-[#1E3A8A] text-white p-5 rounded-xl shadow-md">
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block mb-1">
            Net Settlement Position
          </span>
          {(() => {
            const net = selectedDriverId === 'all' ? netSettlementAll : (currentDriverBalance?.net_settlement_amount || 0);
            const officeOwes = net >= 0;
            return (
              <div>
                <p className="text-2xl font-black font-mono">
                  {formatINR(Math.abs(net))}
                </p>
                <p className="text-xs text-blue-200 mt-1">
                  {officeOwes ? 'Office must pay driver' : 'Driver must hand over cash to office'}
                </p>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Ledger Entries Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Ledger Audit History</h2>
          <span className="text-xs text-slate-500">{entries.length} transactions</span>
        </div>

        {loading ? (
          <div className="p-16 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Wallet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No ledger entries found</p>
            <p className="text-xs text-slate-500 mt-1">Click "New Ledger Entry" to log salary, advance, or cash returned.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Driver</th>
                  <th className="py-3 px-4">Entry Type</th>
                  <th className="py-3 px-4">Notes / Trip Link</th>
                  <th className="py-3 px-4 text-center">Ledger 1 (Pay)</th>
                  <th className="py-3 px-4 text-center">Ledger 2 (Cash)</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.map(ent => {
                  const isPayPlus = ent.entry_type === 'Salary due';
                  const isPayMinus = ent.entry_type === 'Advance' || ent.entry_type === 'Deduction' || ent.entry_type === 'Payment made';
                  const isCashPlus = ent.entry_type === 'Money sent for expenses';
                  const isCashMinus = ent.entry_type === 'Cash handed to office';

                  return (
                    <tr key={ent.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {formatDate(ent.entry_date)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {ent.driver?.full_name || 'Driver'}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {ent.entry_type}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-[250px] truncate">
                        {ent.notes || '-'}
                        {ent.trip ? (
                          <span className="block font-mono text-[10px] text-blue-600">
                            {ent.trip.trip_number}
                          </span>
                        ) : null}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isPayPlus ? (
                          <span className="text-emerald-600 font-bold">+ Increases Pay</span>
                        ) : isPayMinus ? (
                          <span className="text-red-600 font-bold">− Decreases Pay</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isCashPlus ? (
                          <span className="text-amber-600 font-bold">+ Driver Holds Cash</span>
                        ) : isCashMinus ? (
                          <span className="text-blue-600 font-bold">− Returned to Office</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900 font-mono text-sm">
                        {formatINR(ent.amount)}
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
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Record Driver Ledger Entry</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Driver *</label>
                <select
                  value={formData.driver_id}
                  onChange={e => setFormData({ ...formData, driver_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  required
                >
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.full_name} ({d.phone})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Entry Date *</label>
                  <input
                    type="date"
                    value={formData.entry_date}
                    onChange={e => setFormData({ ...formData, entry_date: e.target.value })}
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

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Entry Type *</label>
                <select
                  value={formData.entry_type}
                  onChange={e => setFormData({ ...formData, entry_type: e.target.value as DriverLedgerEntryType })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                >
                  {ENTRY_TYPES.map(et => (
                    <option key={et} value={et}>{et}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Transaction Notes / Details</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Month end salary / cash handed over at office counter"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
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
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverLedgerPage;

