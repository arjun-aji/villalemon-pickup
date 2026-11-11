import React, { useEffect, useState } from 'react';
import {
  Receipt,
  PlusCircle,
  Search,
  Filter,
  DollarSign,
  Printer,
  Calendar,
  Building2,
  CheckCircle2,
  Eye,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { invoiceService, organizationService } from '../../services/adminOperationsService';
import { Invoice, Organization, Trip, InvoiceType, InvoiceStatus } from '../../types';
import { formatINR, formatDate } from '../../utils/formatters';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const INVOICE_TYPES: InvoiceType[] = [
  'Trip invoice',
  'Weekly invoice',
  'Monthly invoice',
];

const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Form state
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('Weekly invoice');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [periodFrom, setPeriodFrom] = useState('');
  const [periodTo, setPeriodTo] = useState('');
  const [notes, setNotes] = useState('');

  // Unbilled trips selection
  const [unbilledTrips, setUnbilledTrips] = useState<Trip[]>([]);
  const [selectedTripIds, setSelectedTripIds] = useState<string[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [invList, orgList] = await Promise.all([
        invoiceService.getAll(),
        organizationService.getAll(),
      ]);
      setInvoices(invList);
      setOrganizations(orgList);
      if (orgList.length > 0 && !selectedOrgId) {
        setSelectedOrgId(orgList[0].id);
      }
    } catch (err) {
      console.error('Error loading invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = async () => {
    setIsCreateModalOpen(true);
    if (selectedOrgId) {
      loadUnbilledForOrg(selectedOrgId);
    }
  };

  const loadUnbilledForOrg = async (orgId: string) => {
    try {
      setLoadingTrips(true);
      const trips = await invoiceService.getUnbilledTrips(orgId);
      setUnbilledTrips(trips);
      // Default select all unbilled trips
      const ids = trips.map(t => t.id);
      setSelectedTripIds(ids);

      // Auto set dates from trips
      if (trips.length > 0) {
        const sorted = [...trips].sort((a, b) => new Date(a.trip_date || a.pickup_date || 0).getTime() - new Date(b.trip_date || b.pickup_date || 0).getTime());
        setPeriodFrom(sorted[0].trip_date || sorted[0].pickup_date || '');
        setPeriodTo(sorted[sorted.length - 1].trip_date || sorted[sorted.length - 1].pickup_date || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTrips(false);
    }
  };

  const toggleTripSelection = (tripId: string) => {
    if (selectedTripIds.includes(tripId)) {
      setSelectedTripIds(selectedTripIds.filter(id => id !== tripId));
    } else {
      setSelectedTripIds([...selectedTripIds, tripId]);
    }
  };

  const totalCalculatedInvoiceAmount = unbilledTrips
    .filter(t => selectedTripIds.includes(t.id))
    .reduce((sum, t) => sum + (t.trip_selling_price || t.amount_to_collect || 0), 0);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTripIds.length === 0) {
      alert('Please select at least one trip to include on this invoice');
      return;
    }

    try {
      await invoiceService.create(
        {
          organization_id: selectedOrgId,
          invoice_type: invoiceType,
          invoice_date: invoiceDate,
          period_from: periodFrom || null as any,
          period_to: periodTo || null as any,
          status: 'Issued',
          notes: notes || null as any,
          total_amount: totalCalculatedInvoiceAmount,
        },
        selectedTripIds
      );
      setIsCreateModalOpen(false);
      loadAll();
    } catch (err: any) {
      alert(err.message || 'Error creating invoice');
    }
  };

  const filtered = invoices.filter(inv => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNum = (inv.invoice_number || '').toLowerCase().includes(q);
      const matchOrg = (inv.organization?.name || '').toLowerCase().includes(q);
      return matchNum || matchOrg;
    }
    return true;
  });

  const totalBilled = invoices.reduce((sum, i) => sum + (i.total_amount || 0), 0);
  const totalPaid = invoices.reduce((sum, i) => sum + (i.paid_against_invoice || 0), 0);
  const totalBalanceDue = invoices.reduce((sum, i) => sum + (i.balance || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Bills & Invoices</h1>
          <p className="text-xs text-slate-500">
            Official tax invoices for client partner trips, billing cycles, payments credited, and balances due
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Generate New Invoice</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Total Invoiced Amount
          </span>
          <p className="text-2xl font-black text-slate-900">{formatINR(totalBilled)}</p>
          <p className="text-[11px] text-slate-500 mt-1">{invoices.length} issued bills</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Paid Against Invoices
          </span>
          <p className="text-2xl font-black text-emerald-600">{formatINR(totalPaid)}</p>
          <p className="text-[11px] text-slate-500 mt-1">Direct office receipts + driver collections</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Total Invoice Balance Due
          </span>
          <p className="text-2xl font-black text-blue-900">{formatINR(totalBalanceDue)}</p>
          <p className="text-[11px] text-slate-500 mt-1">Pending client remittance</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search invoice #, client name..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No invoices generated</p>
            <p className="text-xs text-slate-500 mt-1">Click "Generate New Invoice" to bundle completed trips into a bill.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Client / Organization</th>
                  <th className="py-3 px-4">Type & Period</th>
                  <th className="py-3 px-4 text-right">Invoice Amount</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-900 text-sm">
                      {inv.invoice_number}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {formatDate(inv.invoice_date)}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{inv.organization?.name || 'Client'}</p>
                      <p className="text-slate-500 text-[11px]">{inv.organization?.contact_person}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800">{inv.invoice_type}</span>
                      {inv.period_from && (
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {formatDate(inv.period_from)} → {formatDate(inv.period_to || '')}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-slate-900 font-mono text-sm">
                      {formatINR(inv.total_amount)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-emerald-600 font-mono">
                      {formatINR(inv.paid_against_invoice || 0)}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-slate-900 font-mono">
                      {formatINR(inv.balance || 0)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors text-xs font-semibold"
                        title="View / Print Invoice"
                      >
                        <Printer className="w-3.5 h-3.5 text-blue-600" />
                        <span>Print</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generate Invoice Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Generate Client Invoice</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Client *</label>
                  <select
                    value={selectedOrgId}
                    onChange={e => {
                      setSelectedOrgId(e.target.value);
                      loadUnbilledForOrg(e.target.value);
                    }}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  >
                    {organizations.map(o => (
                      <option key={o.id} value={o.id}>{o.name} ({o.type})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Invoice Type *</label>
                  <select
                    value={invoiceType}
                    onChange={e => setInvoiceType(e.target.value as InvoiceType)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  >
                    {INVOICE_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Invoice Date *</label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={e => setInvoiceDate(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Period From</label>
                  <input
                    type="date"
                    value={periodFrom}
                    onChange={e => setPeriodFrom(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Period To</label>
                  <input
                    type="date"
                    value={periodTo}
                    onChange={e => setPeriodTo(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              {/* Unbilled Trips Section */}
              <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">
                    Select Completed Trips for this Invoice ({unbilledTrips.length} unbilled found)
                  </span>
                  <span className="font-bold text-blue-900 font-mono text-xs">
                    Subtotal: {formatINR(totalCalculatedInvoiceAmount)}
                  </span>
                </div>

                {loadingTrips ? (
                  <div className="py-6 flex justify-center">
                    <LoadingSpinner size="sm" />
                  </div>
                ) : unbilledTrips.length === 0 ? (
                  <p className="text-slate-400 text-center py-4 italic">
                    No completed unbilled trips found for this client.
                  </p>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {unbilledTrips.map(t => {
                      const isChecked = selectedTripIds.includes(t.id);
                      return (
                        <label
                          key={t.id}
                          className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                            isChecked ? 'bg-blue-50/70 border-blue-300' : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleTripSelection(t.id)}
                              className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                              <span className="font-mono font-bold text-slate-900">{t.trip_number}</span>
                              <span className="text-slate-500 ml-2">
                                {formatDate(t.trip_date || t.pickup_date || '')} • {t.guest_names || t.customer_name}
                              </span>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-slate-900">
                            {formatINR(t.trip_selling_price || t.amount_to_collect || 0)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Invoice Notes / Bank Instructions</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Please transfer to State Bank of India A/c ... IFSC ..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={selectedTripIds.length === 0}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md disabled:opacity-50"
                >
                  Create & Issue Invoice ({formatINR(totalCalculatedInvoiceAmount)})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Invoice Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">VILLALEMON PICKUP</h2>
                <p className="text-xs text-slate-500">Varkala Holidays Transport Operations</p>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-blue-900 text-base">{selectedInvoice.invoice_number}</span>
                <p className="text-xs text-slate-500">Date: {formatDate(selectedInvoice.invoice_date)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <p className="font-bold text-slate-400 uppercase text-[10px]">Billed To</p>
                <p className="font-bold text-slate-900 text-sm">{selectedInvoice.organization?.name || 'Client'}</p>
                <p className="text-slate-600">Contact: {selectedInvoice.organization?.contact_person}</p>
                <p className="text-slate-600">Phone: {selectedInvoice.organization?.phone}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <p className="font-bold text-slate-400 uppercase text-[10px]">Invoice Summary</p>
                <p className="text-slate-700">Type: <strong>{selectedInvoice.invoice_type}</strong></p>
                {selectedInvoice.period_from && (
                  <p className="text-slate-700">
                    Period: {formatDate(selectedInvoice.period_from)} to {formatDate(selectedInvoice.period_to || '')}
                  </p>
                )}
                <p className="text-slate-700">Status: <strong className="text-blue-700">{selectedInvoice.status}</strong></p>
              </div>
            </div>

            <div className="border rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b text-slate-600 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900">Transport Duty Transfers & Sightseeing Batch</p>
                      <p className="text-slate-500 text-[11px]">{selectedInvoice.notes || 'Guest airport transfers and tour operations'}</p>
                    </td>
                    <td className="py-3 px-3 text-right font-black font-mono text-sm">
                      {formatINR(selectedInvoice.total_amount)}
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-slate-50 border-t font-bold">
                  <tr>
                    <td className="py-2.5 px-3">Total Amount Due</td>
                    <td className="py-2.5 px-3 text-right text-base text-blue-900 font-mono">
                      {formatINR(selectedInvoice.total_amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Print Tax Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesPage;

