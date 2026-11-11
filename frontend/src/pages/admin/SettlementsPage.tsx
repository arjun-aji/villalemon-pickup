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
  Fuel,
  Receipt,
  Car,
  Eye,
  Camera,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { driverReportService } from '../../services/driverReportService';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { formatINR, formatDate } from '../../utils/formatters';

const SettlementsPage: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'flagged'>('all');

  // Receipt Modal
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);

  // Verification processing state
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await driverReportService.getAllReports();
      setReports(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (reportId: string, status: 'Verified OK' | 'Difference Flagged') => {
    try {
      setActionInProgress(reportId);
      await driverReportService.verifyReport(reportId, status);
      await loadReports();
    } catch (err: any) {
      alert(err.message || 'Failed to update check status');
    } finally {
      setActionInProgress(null);
    }
  };

  const filtered = reports.filter(r => {
    if (statusFilter === 'pending' && r.check_status === 'Verified OK') return false;
    if (statusFilter === 'verified' && r.check_status !== 'Verified OK') return false;
    if (statusFilter === 'flagged' && r.check_status !== 'Difference Flagged') return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTrip = (r.trip?.trip_number || '').toLowerCase().includes(q);
      const matchDriver = (r.driver?.full_name || '').toLowerCase().includes(q);
      const matchGuest = (r.trip?.guest_names || '').toLowerCase().includes(q);
      return matchTrip || matchDriver || matchGuest;
    }
    return true;
  });

  const totalCollected = reports.reduce((s, r) => s + (Number(r.amount_collected) || 0), 0);
  const totalDiesel = reports.reduce((s, r) => s + (Number(r.diesel_expense) || 0), 0);
  const totalToll = reports.reduce((s, r) => s + (Number(r.parking_toll_permits_tickets_food) || 0), 0);
  const totalWorkshop = reports.reduce((s, r) => s + (Number(r.workshop_expense) || 0), 0);
  const totalExpenses = totalDiesel + totalToll + totalWorkshop;
  const netCashOwed = totalCollected - totalExpenses;

  const pendingCount = reports.filter(r => r.check_status !== 'Verified OK').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Driver Reports & Settlements
          </h1>
          <p className="text-xs text-slate-500">
            Reconcile on-trip collections, verify fuel/toll receipts, and approve driver reports
          </p>
        </div>

        {pendingCount > 0 && (
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold inline-flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>{pendingCount} Pending Verification</span>
          </div>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="card p-4 bg-white border border-slate-200 space-y-1 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Guest Collections
          </span>
          <p className="text-xl font-black text-slate-900 font-mono">{formatINR(totalCollected)}</p>
          <span className="text-[11px] text-slate-500">{reports.length} trip reports</span>
        </div>

        <div className="card p-4 bg-white border border-slate-200 space-y-1 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Diesel Spent
          </span>
          <p className="text-xl font-black text-blue-600 font-mono">{formatINR(totalDiesel)}</p>
          <span className="text-[11px] text-slate-500">Driver reported fuel</span>
        </div>

        <div className="card p-4 bg-white border border-slate-200 space-y-1 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Toll / Parking / Repairs
          </span>
          <p className="text-xl font-black text-amber-600 font-mono">{formatINR(totalToll + totalWorkshop)}</p>
          <span className="text-[11px] text-slate-500">Permits & workshop costs</span>
        </div>

        <div className="card p-4 bg-gradient-to-br from-[#0F1E36] to-[#1E3A8A] text-white space-y-1 shadow-md">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
            Net Cash Handover
          </span>
          <p className="text-xl font-black text-emerald-400 font-mono">{formatINR(netCashOwed)}</p>
          <span className="text-[11px] text-slate-300">Collected minus receipts</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by trip ID, driver, guest..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Reports ({reports.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Pending Check
          </button>
          <button
            onClick={() => setStatusFilter('verified')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              statusFilter === 'verified'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Verified OK
          </button>
          <button
            onClick={() => setStatusFilter('flagged')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              statusFilter === 'flagged'
                ? 'bg-red-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Flagged
          </button>
        </div>
      </div>

      {/* Reports Table matching Driver Reports worksheet */}
      <div className="card p-0 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-16 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Receipt className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700 text-sm">No driver reports found</p>
            <p className="mt-1">When drivers complete trips and submit their duty receipts, they appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="p-3">Trip ID & Date</th>
                  <th className="p-3">Driver</th>
                  <th className="p-3">Collected</th>
                  <th className="p-3">Expected</th>
                  <th className="p-3">Diff / Note</th>
                  <th className="p-3">Diesel</th>
                  <th className="p-3">Toll & Other</th>
                  <th className="p-3">Workshop</th>
                  <th className="p-3">Receipt</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(r => {
                  const expected = Number(r.trip?.amount_driver_must_collect) || 0;
                  const collected = Number(r.amount_collected) || 0;
                  const diff = collected - expected;
                  const isVerified = r.check_status === 'Verified OK';
                  const isFlagged = r.check_status === 'Difference Flagged';

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3">
                        <span className="font-mono font-bold text-slate-900 block">
                          {r.trip?.trip_number || r.trip_id}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {formatDate(r.created_at || r.trip?.trip_date)}
                        </span>
                      </td>

                      <td className="p-3">
                        <span className="font-semibold text-slate-800 block">{r.driver?.full_name || 'Driver'}</span>
                        <span className="text-[10px] text-slate-400">{r.driver?.phone || ''}</span>
                      </td>

                      <td className="p-3 font-mono font-bold text-slate-900">
                        {formatINR(collected)}
                      </td>

                      <td className="p-3 font-mono text-slate-500">
                        {formatINR(expected)}
                      </td>

                      <td className="p-3">
                        {diff !== 0 ? (
                          <div>
                            <span className={`font-mono font-bold ${diff < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                              {diff > 0 ? `+${formatINR(diff)}` : formatINR(diff)}
                            </span>
                            {r.collection_difference_note && (
                              <p className="text-[10px] text-slate-500 italic max-w-xs truncate">
                                "{r.collection_difference_note}"
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono">0</span>
                        )}
                      </td>

                      <td className="p-3 font-mono text-slate-700">
                        {r.diesel_expense > 0 ? formatINR(r.diesel_expense) : '-'}
                      </td>

                      <td className="p-3">
                        {r.parking_toll_permits_tickets_food > 0 ? (
                          <div>
                            <span className="font-mono text-slate-700">
                              {formatINR(r.parking_toll_permits_tickets_food)}
                            </span>
                            {r.other_expenses_details && (
                              <p className="text-[10px] text-slate-400 max-w-xs truncate">
                                {r.other_expenses_details}
                              </p>
                            )}
                          </div>
                        ) : '-'}
                      </td>

                      <td className="p-3 font-mono text-slate-700">
                        {r.workshop_expense > 0 ? formatINR(r.workshop_expense) : '-'}
                      </td>

                      <td className="p-3">
                        {r.receipt_photo_url ? (
                          <button
                            onClick={() => setSelectedReceiptUrl(r.receipt_photo_url)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-[11px] transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Bill</span>
                          </button>
                        ) : (
                          <span className="text-slate-300 italic">No bill</span>
                        )}
                      </td>

                      <td className="p-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isVerified
                              ? 'bg-emerald-100 text-emerald-800'
                              : isFlagged
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {r.check_status || 'Pending Check'}
                        </span>
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isVerified && (
                            <button
                              onClick={() => handleUpdateStatus(r.id, 'Verified OK')}
                              disabled={actionInProgress === r.id}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors disabled:opacity-50 inline-flex items-center gap-1 shadow-sm"
                            >
                              <Check className="w-3 h-3" />
                              <span>Verify OK</span>
                            </button>
                          )}

                          {!isFlagged && (
                            <button
                              onClick={() => handleUpdateStatus(r.id, 'Difference Flagged')}
                              disabled={actionInProgress === r.id}
                              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 font-semibold text-[11px] transition-colors disabled:opacity-50"
                            >
                              Flag
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Receipt Photo Modal */}
      {selectedReceiptUrl && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedReceiptUrl(null)}
          title="Uploaded Fuel / Toll Receipt"
          size="md"
        >
          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center p-2 max-h-[70vh]">
              <img
                src={selectedReceiptUrl}
                alt="Receipt"
                className="max-h-[65vh] max-w-full object-contain rounded-lg"
              />
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <a
                href={selectedReceiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 font-semibold inline-flex items-center gap-1 hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Full Size Image</span>
              </a>

              <button
                onClick={() => setSelectedReceiptUrl(null)}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SettlementsPage;
