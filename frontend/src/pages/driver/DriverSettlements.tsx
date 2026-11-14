import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Wallet,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Fuel,
  Receipt,
  FileText,
  DollarSign,
  TrendingUp,
  PlusCircle,
  X,
  Send,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { driverLedgerService } from '../../services/adminOperationsService';
import { tripService } from '../../services/tripService';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { formatINR, formatDate } from '../../utils/formatters';

const DriverSettlements: React.FC = () => {
  const navigate = useNavigate();
  const { driver, profile } = useAuth();
  const [driverBalance, setDriverBalance] = useState<any>(null);
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [completedTrips, setCompletedTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvedDriverId, setResolvedDriverId] = useState<string>('');

  // Return Cash to Office Modal State
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnAmount, setReturnAmount] = useState<string>('');
  const [returnMethod, setReturnMethod] = useState<'Cash' | 'UPI'>('Cash');
  const [returnNotes, setReturnNotes] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);

  const driverId = driver?.id || '';

  useEffect(() => {
    loadDriverSettlementData();
  }, [driverId]);

  const loadDriverSettlementData = async () => {
    try {
      setLoading(true);
      const isRealUuid = (id?: string) => Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));
      let effectiveDriverId = driverId;

      if (!isRealUuid(effectiveDriverId)) {
        const { data: allDbDrivers } = await supabase.from('drivers').select('*');
        const cleanAlpha = (driver?.full_name || profile?.full_name || '').toLowerCase().replace(/[^a-z]/g, '');
        const cleanPhone = (driver?.phone || profile?.phone || '').replace(/[^0-9]/g, '');

        const matched = allDbDrivers?.find(d => {
          const dPhone = (d.phone || '').replace(/[^0-9]/g, '');
          if (cleanPhone && cleanPhone.length >= 6 && dPhone.includes(cleanPhone)) return true;
          const dAlpha = (d.full_name || '').toLowerCase().replace(/[^a-z]/g, '');
          if (cleanAlpha && (dAlpha === cleanAlpha || dAlpha.includes(cleanAlpha) || cleanAlpha.includes(dAlpha))) return true;
          return false;
        });

        if (matched) {
          effectiveDriverId = matched.id;
        }
      }

      if (effectiveDriverId) {
        setResolvedDriverId(effectiveDriverId);
        await fetchDetails(effectiveDriverId);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetails = async (id: string) => {
    try {
      const [balances, entries, trips] = await Promise.all([
        supabase.from('v_driver_balances').select('*').eq('driver_id', id).maybeSingle(),
        driverLedgerService.getEntriesByDriver(id),
        supabase.from('trips').select('*').eq('assigned_driver_id', id).in('trip_status', ['Completed', 'completed']),
      ]);

      setDriverBalance(balances.data);
      setLedgerEntries(entries);
      setCompletedTrips(trips.data || []);
    } catch (err) {
      console.error('Error fetching driver settlements:', err);
    }
  };

  const handleOpenReturnModal = () => {
    const cash = Number(driverBalance?.cash_owed_to_office) || 0;
    setReturnAmount(cash > 0 ? String(cash) : '');
    setReturnMethod('Cash');
    setReturnNotes('');
    setShowReturnModal(true);
  };

  const handleSubmitCashReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvedDriverId) {
      alert('Driver account not resolved');
      return;
    }
    const val = Number(returnAmount);
    if (!val || val <= 0) {
      alert('Please enter a valid amount greater than 0');
      return;
    }

    try {
      setSubmittingReturn(true);
      await driverLedgerService.createEntry({
        entry_date: new Date().toISOString().split('T')[0],
        driver_id: resolvedDriverId,
        entry_type: 'Cash handed to office',
        amount: val,
        notes: `[Pending Admin Confirmation] ${returnNotes ? returnNotes + ' ' : ''}(${returnMethod})`,
      });
      setShowReturnModal(false);
      await fetchDetails(resolvedDriverId);
      alert('Cash return recorded successfully! Admin will confirm receipt.');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error recording cash return');
    } finally {
      setSubmittingReturn(false);
    }
  };

  const balancePayable = Number(driverBalance?.balance_payable_to_driver) || 0;
  const cashHeld = Number(driverBalance?.cash_owed_to_office) || 0;
  const netSettlement = Number(driverBalance?.net_settlement_amount) || (balancePayable - cashHeld);

  return (
    <div className="max-w-md mx-auto space-y-4 pb-16">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/driver/dashboard')}
          className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Driver Ledger & Balances</h1>
          <p className="text-xs text-slate-500">Dual-ledger accounting: Earnings vs. Cash held</p>
        </div>
      </div>

      {loading ? (
        <div className="p-16 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          {/* Main Net Settlement Position Card */}
          <div className="card p-5 bg-gradient-to-br from-[#0F1E36] to-[#1E3A8A] text-white shadow-xl space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                  Net Settlement Status
                </p>
                <h2 className="text-2xl font-black font-mono tracking-tight text-white mt-1">
                  {formatINR(Math.abs(netSettlement))}
                </h2>
              </div>
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                <Wallet className="h-6 w-6 text-amber-400" />
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-slate-300">Net Position:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                  netSettlement >= 0
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {netSettlement >= 0 ? 'Office to Pay You' : 'You Hand Cash to Office'}
              </span>
            </div>
          </div>

          {/* Dual Balance Cards (Payable vs Cash Held) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Balance 1: Driver Pay */}
            <div className="card p-3.5 bg-emerald-50/80 border border-emerald-200 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-bold">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Your Earnings / Pay</span>
              </div>
              <p className="text-lg font-black text-emerald-700 font-mono">
                {formatINR(balancePayable)}
              </p>
              <p className="text-[10px] text-emerald-600 leading-tight">
                Trips completed + Salary due minus advances
              </p>
            </div>

            {/* Balance 2: Business Cash Held */}
            <div className="card p-3.5 bg-amber-50/80 border border-amber-200 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-800 text-xs font-bold">
                <Receipt className="h-3.5 w-3.5" />
                <span>Business Cash Held</span>
              </div>
              <p className="text-lg font-black text-amber-700 font-mono">
                {formatINR(cashHeld)}
              </p>
              <p className="text-[10px] text-amber-600 leading-tight">
                Guest collections minus fuel/toll receipts
              </p>
            </div>
          </div>

          {/* Quick Action: Record Cash Returned to Office */}
          <button
            onClick={handleOpenReturnModal}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <DollarSign className="w-4 h-4" />
            <span>Record Cash Returned to Office</span>
          </button>

          {/* Quick Action: Completed Trips on Record */}
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Completed Trips ({completedTrips.length})
              </h3>
              <span className="text-[11px] font-semibold text-emerald-600">
                {formatINR(completedTrips.reduce((s, t) => s + Number(t.driver_trip_pay_override || 500), 0))} earned
              </span>
            </div>

            {completedTrips.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No completed trips on record yet.</p>
            ) : (
              <div className="space-y-2">
                {completedTrips.slice(0, 5).map(trip => (
                  <div
                    key={trip.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-900 block">{trip.trip_number}</span>
                      <span className="text-slate-500 text-[11px]">
                        {formatDate(trip.trip_date)} • {trip.trip_category}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-600 font-mono">
                        +{formatINR(trip.driver_trip_pay_override || 500)}
                      </span>
                      <span className="block text-[10px] text-slate-400">Driver Pay</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Driver Ledger Transactions */}
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Ledger Entries ({ledgerEntries.length})
              </h3>
              <span className="text-[11px] text-slate-500">Advances, Salary & Handover</span>
            </div>

            {ledgerEntries.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No ledger adjustments recorded yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {ledgerEntries.map(entry => {
                  const isPositive = ['Salary due', 'Payment made'].includes(entry.entry_type);
                  const isPending = entry.notes?.includes('[Pending Admin Confirmation]');
                  const isConfirmed = entry.notes?.includes('[Confirmed by Admin');
                  const cleanNotes = (entry.notes || '')
                    .replace(/\[Pending Admin Confirmation\]/gi, '')
                    .replace(/\[Confirmed by Admin[^\]]*\]/gi, '')
                    .trim();

                  return (
                    <div key={entry.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-800">{entry.entry_type}</span>
                          {entry.trip?.trip_number && (
                            <span className="font-mono text-[10px] text-blue-600 bg-blue-50 px-1 rounded">
                              {entry.trip.trip_number}
                            </span>
                          )}
                          {isPending && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <Clock className="w-2.5 h-2.5" />
                              Pending Confirmation
                            </span>
                          )}
                          {isConfirmed && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              Confirmed
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {formatDate(entry.entry_date)} {cleanNotes && `• ${cleanNotes}`}
                        </p>
                      </div>
                      <span
                        className={`font-mono font-bold shrink-0 ${
                          isPositive ? 'text-emerald-600' : 'text-slate-900'
                        }`}
                      >
                        {formatINR(entry.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Record Cash Return Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100">
            <div className="p-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-200" />
                <h3 className="font-bold text-sm">Record Cash Returned to Office</h3>
              </div>
              <button
                onClick={() => setShowReturnModal(false)}
                className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCashReturn} className="p-4 space-y-4">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-600">Current Cash Held:</span>
                  <span className="font-mono font-bold text-amber-700">{formatINR(cashHeld)}</span>
                </div>
                <p className="text-[11px] text-amber-700">
                  Enter the exact amount you handed over to the office. Admin will verify and confirm.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amount Handed Over / Returned (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  value={returnAmount}
                  onChange={e => setReturnAmount(e.target.value)}
                  placeholder="e.g. 1900"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-base text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Mode *
                </label>
                <select
                  value={returnMethod}
                  onChange={e => setReturnMethod(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="Cash">Cash Handover</option>
                  <option value="UPI">UPI Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Handover Notes (Optional)
                </label>
                <input
                  type="text"
                  value={returnNotes}
                  onChange={e => setReturnNotes(e.target.value)}
                  placeholder="e.g. Handed to manager at reception"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReturn}
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {submittingReturn && <LoadingSpinner size="sm" />}
                  <span>Submit Return</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverSettlements;
