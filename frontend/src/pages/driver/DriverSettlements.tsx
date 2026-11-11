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

  const driverId = driver?.id || '';

  useEffect(() => {
    loadDriverSettlementData();
  }, [driverId]);

  const loadDriverSettlementData = async () => {
    try {
      setLoading(true);
      if (!driverId) {
        // Fallback: try finding driver by full_name or phone
        const { data: foundDriver } = await supabase
          .from('drivers')
          .select('id, full_name, employment_type')
          .or(`phone.eq.${profile?.phone || ''},full_name.ilike.%${profile?.full_name || ''}%`)
          .limit(1)
          .maybeSingle();

        if (foundDriver) {
          fetchDetails(foundDriver.id);
          return;
        }
      } else {
        fetchDetails(driverId);
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
        supabase.from('trips').select('*').eq('assigned_driver_id', id).eq('trip_status', 'Completed'),
      ]);

      setDriverBalance(balances.data);
      setLedgerEntries(entries);
      setCompletedTrips(trips.data || []);
    } catch (err) {
      console.error('Error fetching driver settlements:', err);
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
                  return (
                    <div key={entry.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-800">{entry.entry_type}</span>
                          {entry.trip?.trip_number && (
                            <span className="font-mono text-[10px] text-blue-600 bg-blue-50 px-1 rounded">
                              {entry.trip.trip_number}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {formatDate(entry.entry_date)} {entry.notes && `• ${entry.notes}`}
                        </p>
                      </div>
                      <span
                        className={`font-mono font-bold ${
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
    </div>
  );
};

export default DriverSettlements;
