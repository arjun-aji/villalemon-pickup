import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { settlementService } from '../../services/settlementService';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { formatINR } from '../../utils/formatters';

const DriverSettlements: React.FC = () => {
  const navigate = useNavigate();
  const { driver } = useAuth();
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const driverId = driver?.id || '';

  useEffect(() => {
    loadSettlements();
  }, [driverId]);

  const loadSettlements = async () => {
    try {
      setLoading(true);
      if (!driverId) {
        setSettlements([]);
        return;
      }
      const all = await settlementService.getAll();
      const mySettlements = all.filter(s => s.driver_id === driverId);
      setSettlements(mySettlements);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const totalEarnings = settlements.reduce((sum, s) => sum + (Number(s.driver_charge) || 0), 0);
  const pendingCount = settlements.filter(s => s.settlement_status !== 'settled').length;

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
          <h1 className="text-xl font-bold text-text-primary">My Settlements</h1>
          <p className="text-xs text-text-secondary">Your trip charges, cash reconciliations & status</p>
        </div>
      </div>

      {/* Summary Card */}
      <div className="card p-5 bg-navy-primary text-white space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-300">Total Driver Earnings</span>
          <span className="text-xl font-black text-green-primary">{formatINR(totalEarnings)}</span>
        </div>
        <div className="flex items-center justify-between text-xs pt-2 border-t border-navy-light text-gray-300">
          <span>Pending Verifications:</span>
          <span className="font-bold text-warning">
            {pendingCount === 1 ? '1 pending trip' : `${pendingCount} pending trips`}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="p-16 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : settlements.length === 0 ? (
        <div className="card text-center py-12 text-sm text-text-secondary">
          No settlement records found.
        </div>
      ) : (
        <div className="space-y-3">
          {settlements.map(s => (
            <div key={s.id} className="card p-4 border border-border space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="font-extrabold text-navy-primary font-mono text-sm">
                  {s.trip?.trip_number || 'Trip'}
                </span>
                <StatusBadge status={s.settlement_status} type="settlement" />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-text-secondary block">Your Driver Charge:</span>
                  <span className="font-bold text-green-primary text-sm">{formatINR(s.driver_charge)}</span>
                </div>
                <div>
                  <span className="text-text-secondary block">Customer Collected:</span>
                  <span className="font-bold text-text-primary text-sm">{formatINR(s.customer_collection)}</span>
                </div>
                <div>
                  <span className="text-text-secondary block">Petrol Paid:</span>
                  <span className="font-medium text-text-primary">{formatINR(s.petrol_expense)}</span>
                </div>
                <div>
                  <span className="text-text-secondary block">Other Expenses:</span>
                  <span className="font-medium text-text-primary">{formatINR(s.other_expenses)}</span>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Expected Cash Return:</span>
                  <span className="font-bold text-navy-primary">{formatINR(s.expected_return)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Actual Cash Returned:</span>
                  <span className="font-bold text-green-primary">{formatINR(s.actual_return)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-border/60">
                  <span className="text-text-secondary">Difference:</span>
                  <span className={`font-black ${Number(s.settlement_difference) === 0 ? 'text-green-primary' : 'text-expense'}`}>
                    {Number(s.settlement_difference) === 0 ? '₹0' : `-₹${Math.abs(Number(s.settlement_difference))}`}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DriverSettlements;

