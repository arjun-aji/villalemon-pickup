import React, { useState, useEffect } from 'react';
import {
  Wallet,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Search,
  Check,
  ChevronRight,
  Info,
} from 'lucide-react';
import { settlementService } from '../../services/settlementService';
import { TripSettlement } from '../../types';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { formatINR } from '../../utils/formatters';

const SettlementsPage: React.FC = () => {
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'driver_submitted' | 'pending_verification' | 'settled' | 'difference' | 'all'>('driver_submitted');

  // Verify Modal
  const [verifyTarget, setVerifyTarget] = useState<any | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    loadSettlements();
  }, []);

  const loadSettlements = async () => {
    try {
      setLoading(true);
      const data = await settlementService.getAll();
      setSettlements(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyTarget) return;

    try {
      setVerifying(true);
      await settlementService.verify(verifyTarget.id, 'admin', adminNote);
      setVerifyTarget(null);
      setAdminNote('');
      loadSettlements();
    } catch (err: any) {
      alert(err.message || 'Failed to verify settlement');
    } finally {
      setVerifying(false);
    }
  };

  const filtered = settlements.filter(s => {
    if (activeTab === 'all') return true;
    if (activeTab === 'driver_submitted') {
      return ['driver_submitted', 'pending_verification'].includes(s.settlement_status);
    }
    return s.settlement_status === activeTab;
  });

  const submittedCount = settlements.filter(s => ['driver_submitted', 'pending_verification'].includes(s.settlement_status)).length;
  const settledCount = settlements.filter(s => s.settlement_status === 'settled').length;
  const differenceCount = settlements.filter(s => s.settlement_status === 'difference').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Settlement Review</h1>
        <p className="text-sm text-text-secondary">
          Reconcile driver cash returns, petrol receipts, driver charges, and verify trip balances
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto scrollbar-hide text-xs font-semibold">
        <button
          onClick={() => setActiveTab('driver_submitted')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors ${
            activeTab === 'driver_submitted'
              ? 'bg-navy-primary text-white shadow'
              : 'bg-white text-text-secondary hover:bg-gray-100 border border-border'
          }`}
        >
          <span>Driver Submitted</span>
          <span className="bg-warning text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
            {submittedCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('settled')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors ${
            activeTab === 'settled'
              ? 'bg-navy-primary text-white shadow'
              : 'bg-white text-text-secondary hover:bg-gray-100 border border-border'
          }`}
        >
          <span>Settled</span>
          <span className="bg-green-primary text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
            {settledCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('difference')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors ${
            activeTab === 'difference'
              ? 'bg-navy-primary text-white shadow'
              : 'bg-white text-text-secondary hover:bg-gray-100 border border-border'
          }`}
        >
          <span>Difference</span>
          <span className="bg-expense text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
            {differenceCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-1.5 rounded-lg transition-colors ${
            activeTab === 'all'
              ? 'bg-navy-primary text-white shadow'
              : 'bg-white text-text-secondary hover:bg-gray-100 border border-border'
          }`}
        >
          All Records
        </button>
      </div>

      {/* Settlements Table */}
      <div className="card p-0 overflow-hidden shadow-card">
        {loading ? (
          <div className="p-16 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-text-secondary text-sm">
            No settlement records found in this category.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-gray-50/80">
                  <th className="table-header">Trip ID</th>
                  <th className="table-header">Customer</th>
                  <th className="table-header">Driver</th>
                  <th className="table-header">Expected Return</th>
                  <th className="table-header">Actual Return</th>
                  <th className="table-header">Difference</th>
                  <th className="table-header text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(s => {
                  const diff = Number(s.settlement_difference) || 0;
                  const isSettled = s.settlement_status === 'settled';

                  return (
                    <tr key={s.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="table-cell font-bold text-navy-primary font-mono">
                        {s.trip?.trip_number || '-'}
                      </td>
                      <td className="table-cell font-medium">
                        {s.trip?.customer_name || '-'}
                      </td>
                      <td className="table-cell text-sm">
                        {s.driver?.full_name || '-'}
                      </td>
                      <td className="table-cell font-semibold text-text-primary">
                        {formatINR(s.expected_return ?? 0)}
                      </td>
                      <td className="table-cell font-semibold text-text-primary">
                        {formatINR(s.actual_return ?? 0)}
                      </td>
                      <td className="table-cell">
                        {diff === 0 ? (
                          <span className="badge-green font-bold text-xs">₹0</span>
                        ) : (
                          <span className="badge-red font-bold text-xs">
                            -₹{Math.abs(diff)}
                          </span>
                        )}
                      </td>
                      <td className="table-cell text-right">
                        {isSettled ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-primary">
                            <CheckCircle2 className="h-4 w-4" /> Settled
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setVerifyTarget(s);
                              setAdminNote('');
                            }}
                            className="px-3 py-1 bg-green-primary hover:bg-green-secondary text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                          >
                            Verify
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Verify Settlement Modal */}
      {verifyTarget && (
        <Modal
          isOpen={Boolean(verifyTarget)}
          onClose={() => setVerifyTarget(null)}
          title={`Verify Settlement for ${verifyTarget.trip?.trip_number || 'Trip'}`}
          size="md"
        >
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-gray-50 rounded-xl text-xs">
              <div>
                <p className="text-text-secondary">Customer Collection</p>
                <p className="text-sm font-bold text-text-primary">{formatINR(verifyTarget.customer_collection)}</p>
              </div>
              <div>
                <p className="text-text-secondary">Driver Charge</p>
                <p className="text-sm font-bold text-text-primary">{formatINR(verifyTarget.driver_charge)}</p>
              </div>
              <div>
                <p className="text-text-secondary">Petrol Expense</p>
                <p className="text-sm font-bold text-text-primary">{formatINR(verifyTarget.petrol_expense)}</p>
              </div>
              <div>
                <p className="text-text-secondary">Other Expenses</p>
                <p className="text-sm font-bold text-text-primary">{formatINR(verifyTarget.other_expenses)}</p>
              </div>
              <div className="pt-2 border-t border-border">
                <p className="text-text-secondary">Expected Cash Return</p>
                <p className="text-sm font-bold text-navy-primary">{formatINR(verifyTarget.expected_return)}</p>
              </div>
              <div className="pt-2 border-t border-border">
                <p className="text-text-secondary">Actual Cash Returned</p>
                <p className="text-sm font-bold text-green-primary">{formatINR(verifyTarget.actual_return)}</p>
              </div>
            </div>

            {Number(verifyTarget.settlement_difference) !== 0 && (
              <div className="p-3 bg-red-50 border border-red-200 text-expense text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>
                  Discrepancy of ₹{Math.abs(Number(verifyTarget.settlement_difference))} detected. Verifying will record this difference in audit logs.
                </span>
              </div>
            )}

            <div>
              <label className="label">Admin Audit Notes</label>
              <textarea
                rows={2}
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                placeholder="e.g. Verified against fuel pump receipt. Cash deposited."
                className="input-field"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setVerifyTarget(null)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={verifying}
                className="btn-primary text-xs"
              >
                {verifying ? 'Confirming...' : 'Confirm Verification & Lock'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default SettlementsPage;

