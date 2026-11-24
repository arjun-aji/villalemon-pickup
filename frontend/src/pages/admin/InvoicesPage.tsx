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
  Share2,
  Trash2,
  MessageCircle,
  Clock,
  Car,
  User,
  Check,
  AlertCircle,
  RefreshCw,
  Edit2,
} from 'lucide-react';
import { invoiceService, organizationService } from '../../services/adminOperationsService';
import { tripService } from '../../services/tripService';
import { Invoice, Organization, Trip, InvoiceType, InvoiceStatus } from '../../types';
import { formatINR, formatDate, formatTime, formatWhatsAppShareUrl } from '../../utils/formatters';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const INVOICE_TYPES: InvoiceType[] = [
  'Weekly invoice',
  'Monthly invoice',
  'Trip invoice',
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
  
  // Date-to-Date range: Default to first of current month through today
  const todayStr = new Date().toISOString().split('T')[0];
  const firstOfMonthStr = `${todayStr.slice(0, 7)}-01`;
  const [periodFrom, setPeriodFrom] = useState(firstOfMonthStr);
  const [periodTo, setPeriodTo] = useState(todayStr);
  const [notes, setNotes] = useState('');

  // Trips selection
  const [availableTrips, setAvailableTrips] = useState<Trip[]>([]);
  const [selectedTripIds, setSelectedTripIds] = useState<string[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);

  // Quick edit trip inside generator modal
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [editAdvanceVal, setEditAdvanceVal] = useState<number | ''>(0);

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
      
      // Auto-select first non-Villa Lemon organization if available
      if (orgList.length > 0 && !selectedOrgId) {
        const externalOrg = orgList.find(o => !o.name.toLowerCase().includes('villa lemon')) || orgList[0];
        setSelectedOrgId(externalOrg.id);
      }
    } catch (err) {
      console.error('Error loading invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = async () => {
    setIsCreateModalOpen(true);
    // Find initial org
    let targetOrg = selectedOrgId;
    if (!targetOrg && organizations.length > 0) {
      const externalOrg = organizations.find(o => !o.name.toLowerCase().includes('villa lemon')) || organizations[0];
      targetOrg = externalOrg.id;
      setSelectedOrgId(targetOrg);
    }
    if (targetOrg) {
      loadTripsForRange(targetOrg, periodFrom, periodTo);
    }
  };

  const loadTripsForRange = async (orgId: string, from: string, to: string) => {
    try {
      setLoadingTrips(true);
      const trips = await invoiceService.getTripsForInvoice(orgId, from, to);
      setAvailableTrips(trips);
      // Default select all trips
      setSelectedTripIds(trips.map(t => t.id));
    } catch (err) {
      console.error('Error loading trips for invoice range:', err);
    } finally {
      setLoadingTrips(false);
    }
  };

  const handleOrgChange = (newOrgId: string) => {
    setSelectedOrgId(newOrgId);
    loadTripsForRange(newOrgId, periodFrom, periodTo);
  };

  const handleDateRangeChange = (from: string, to: string) => {
    setPeriodFrom(from);
    setPeriodTo(to);
    if (selectedOrgId) {
      loadTripsForRange(selectedOrgId, from, to);
    }
  };

  const setPresetRange = (preset: 'this_month' | 'last_month' | 'all') => {
    const now = new Date();
    if (preset === 'this_month') {
      const from = `${now.toISOString().slice(0, 7)}-01`;
      const to = now.toISOString().split('T')[0];
      handleDateRangeChange(from, to);
    } else if (preset === 'last_month') {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      const from = prev.toISOString().split('T')[0];
      const to = lastDay.toISOString().split('T')[0];
      handleDateRangeChange(from, to);
    } else if (preset === 'all') {
      handleDateRangeChange('', '');
    }
  };

  const toggleTripSelection = (tripId: string) => {
    if (selectedTripIds.includes(tripId)) {
      setSelectedTripIds(selectedTripIds.filter(id => id !== tripId));
    } else {
      setSelectedTripIds([...selectedTripIds, tripId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedTripIds.length === availableTrips.length) {
      setSelectedTripIds([]);
    } else {
      setSelectedTripIds(availableTrips.map(t => t.id));
    }
  };

  // Quick toggle trip status between Pending and Paid
  const handleToggleTripStatus = async (tripId: string, currentStatus?: string) => {
    const newStatus: 'Pending' | 'Paid' = currentStatus === 'Paid' ? 'Pending' : 'Paid';
    try {
      await tripService.updateTripBilling(tripId, { billingStatus: newStatus });
      setAvailableTrips(prev => prev.map(t => {
        if (t.id === tripId) {
          const sellPrice = Number(t.trip_selling_price || 0);
          const adv = Number(t.advance_amount || 0);
          return {
            ...t,
            billing_status: newStatus,
            pending_amount: newStatus === 'Paid' ? 0 : Math.max(0, sellPrice - adv),
          };
        }
        return t;
      }));
    } catch (err: any) {
      alert(err.message || 'Error updating trip status');
    }
  };

  // Quick save advance amount on a trip
  const handleSaveTripAdvance = async (tripId: string) => {
    const adv = Number(editAdvanceVal) || 0;
    try {
      await tripService.updateTripBilling(tripId, { advanceAmount: adv });
      setAvailableTrips(prev => prev.map(t => {
        if (t.id === tripId) {
          const sellPrice = Number(t.trip_selling_price || 0);
          const isPaid = t.billing_status === 'Paid';
          return {
            ...t,
            advance_amount: adv,
            pending_amount: isPaid ? 0 : Math.max(0, sellPrice - adv),
          };
        }
        return t;
      }));
      setEditingTripId(null);
    } catch (err: any) {
      alert(err.message || 'Error updating trip advance');
    }
  };

  // Bulk update all selected trips to Paid or Pending
  const handleBulkSetStatus = async (targetStatus: 'Pending' | 'Paid') => {
    if (selectedTripIds.length === 0) return;
    try {
      for (const tid of selectedTripIds) {
        await tripService.updateTripBilling(tid, { billingStatus: targetStatus });
      }
      setAvailableTrips(prev => prev.map(t => {
        if (selectedTripIds.includes(t.id)) {
          const sellPrice = Number(t.trip_selling_price || 0);
          const adv = Number(t.advance_amount || 0);
          return {
            ...t,
            billing_status: targetStatus,
            pending_amount: targetStatus === 'Paid' ? 0 : Math.max(0, sellPrice - adv),
          };
        }
        return t;
      }));
    } catch (err: any) {
      alert(err.message || 'Error updating trips');
    }
  };

  // Selected trips calculations
  const selectedTripsList = availableTrips.filter(t => selectedTripIds.includes(t.id));
  const totalGrossAmount = selectedTripsList.reduce((sum, t) => sum + (Number(t.trip_selling_price) || 0), 0);
  const totalAdvancePaid = selectedTripsList.reduce((sum, t) => {
    if (t.billing_status === 'Paid') return sum + (Number(t.trip_selling_price) || 0);
    return sum + (Number(t.advance_amount) || 0);
  }, 0);
  const totalPendingBalance = Math.max(0, totalGrossAmount - totalAdvancePaid);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTripIds.length === 0) {
      alert('Please select at least one trip to generate this invoice');
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
          status: totalPendingBalance === 0 ? 'Paid' : 'Issued',
          notes: notes || null as any,
          total_amount: totalGrossAmount,
        },
        selectedTripIds
      );
      setIsCreateModalOpen(false);
      loadAll();
    } catch (err: any) {
      alert(err.message || 'Error creating invoice');
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice? The linked trips will remain available for future billing.')) {
      return;
    }
    try {
      await invoiceService.deleteInvoice(invoiceId);
      loadAll();
    } catch (err: any) {
      alert(err.message || 'Error deleting invoice');
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

  // Helper to format WhatsApp message for an invoice
  const generateInvoiceWhatsAppMessage = (inv: Invoice) => {
    const orgName = inv.organization?.name || 'Client';
    const periodStr = inv.period_from && inv.period_to ? `${formatDate(inv.period_from)} to ${formatDate(inv.period_to)}` : formatDate(inv.invoice_date);
    const trips = inv.trips || [];
    
    let text = `📄 *VILLALEMON PICKUP — CLIENT INVOICE*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🏢 *Organization:* ${orgName}\n`;
    text += `🧾 *Invoice #:* ${inv.invoice_number}\n`;
    text += `📅 *Billing Period:* ${periodStr}\n`;
    text += `🚕 *Total Trips:* ${trips.length}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💰 *Total Trip Cost:* Rs. ${(inv.total_amount || 0).toLocaleString('en-IN')}\n`;
    text += `✅ *Advance / Paid:* Rs. ${(inv.paid_against_invoice || 0).toLocaleString('en-IN')}\n`;
    text += `⚠️ *Net Pending Balance:* Rs. ${(inv.balance || 0).toLocaleString('en-IN')}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    text += `*Trip Breakdown:*\n`;

    trips.forEach((t, idx) => {
      const cost = Number(t.trip_selling_price) || 0;
      const adv = Number(t.advance_amount) || 0;
      const pend = t.billing_status === 'Paid' ? 0 : Math.max(0, cost - adv);
      text += `${idx + 1}. ${formatDate(t.trip_date)} (${t.trip_number}): ${t.guest_names || 'Guest'} • Cost: Rs. ${cost.toLocaleString('en-IN')}`;
      if (adv > 0) text += ` (Adv: Rs. ${adv.toLocaleString('en-IN')})`;
      text += ` • Due: Rs. ${pend.toLocaleString('en-IN')} [${t.billing_status || 'Pending'}]\n`;
    });

    text += `\n_Please transfer pending balance to our official bank account or UPI. Thank you for your partnership!_`;
    return text;
  };

  const selectedOrgObj = organizations.find(o => o.id === selectedOrgId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Bills & Invoices</h1>
          <p className="text-xs text-slate-500">
            Generate and manage tax bills from date to date for partner organizations with full trip breakdowns, advances, and pending balances
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Generate Invoice (Date to Date)</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Total Invoiced Amount
          </span>
          <p className="text-2xl font-black text-slate-900">{formatINR(totalBilled)}</p>
          <p className="text-[11px] text-slate-500 mt-1">{invoices.length} issued bills</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Total Paid / Advances
          </span>
          <p className="text-2xl font-black text-emerald-600">{formatINR(totalPaid)}</p>
          <p className="text-[11px] text-slate-500 mt-1">Advances credited & settled amounts</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Total Pending Balance Due
          </span>
          <p className="text-2xl font-black text-amber-600">{formatINR(totalBalanceDue)}</p>
          <p className="text-[11px] text-slate-500 mt-1">Pending collection from partner organizations</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-3 flex-wrap">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search invoice #, client organization..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenCreate}
            className="btn-secondary text-xs px-3 py-1.5 inline-flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>New Bill from Date Range</span>
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-base font-bold text-slate-700">No invoices generated yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Select any partner organization (e.g. Rythm Bay Home) and date range to bundle trips, reduce advances, and issue official bills.
            </p>
            <button
              onClick={handleOpenCreate}
              className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Generate First Invoice</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Client Organization</th>
                  <th className="py-3 px-4">Billing Period</th>
                  <th className="py-3 px-4 text-center">Trips</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-right">Advance / Paid</th>
                  <th className="py-3 px-4 text-right">Pending Balance</th>
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
                      {inv.period_from ? (
                        <p className="font-semibold text-slate-800">
                          {formatDate(inv.period_from)} → {formatDate(inv.period_to || '')}
                        </p>
                      ) : (
                        <span className="text-slate-400">Single invoice</span>
                      )}
                      <span className="text-[10px] text-slate-400">{inv.invoice_type}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800">
                        {inv.trips_count || inv.trips?.length || 0} trips
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-black text-slate-900 font-mono text-sm">
                      {formatINR(inv.total_amount)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600 font-mono">
                      {formatINR(inv.paid_against_invoice || 0)}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-amber-700 font-mono text-sm">
                      {formatINR(inv.balance || 0)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        (inv.balance || 0) === 0 || inv.status === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {(inv.balance || 0) === 0 ? 'Paid' : inv.status || 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors text-xs font-semibold"
                          title="View & Print Full Bill"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Bill</span>
                        </button>

                        <a
                          href={formatWhatsAppShareUrl(
                            inv.organization?.phone,
                            generateInvoiceWhatsAppMessage(inv)
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors text-xs font-semibold"
                          title="Share Bill Breakdown on WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>

                        <button
                          onClick={() => handleDeleteInvoice(inv.id)}
                          className="p-1 text-slate-400 hover:text-red-600 transition-colors rounded-lg"
                          title="Delete Invoice"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* ============================================================== */}
      {/* GENERATE INVOICE MODAL (From Date to Date with Full Breakdown)  */}
      {/* ============================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl max-h-[92vh] overflow-y-auto space-y-5 border border-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Generate Organization Bill from Date to Date
                </h3>
                <p className="text-xs text-slate-500">
                  Select client organization and date range to load trips, apply advances, and prepare pending bills
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
              {/* Row 1: Organization & Invoice Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Select Client Organization *
                  </label>
                  <select
                    value={selectedOrgId}
                    onChange={e => handleOrgChange(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500"
                  >
                    {organizations.map(o => {
                      const isOwn = o.name.toLowerCase().includes('villa lemon');
                      return (
                        <option key={o.id} value={o.id}>
                          {o.name} {isOwn ? '(Own Organization)' : `(${o.type || 'Client Partner'})`}
                        </option>
                      );
                    })}
                  </select>
                  {selectedOrgObj?.name.toLowerCase().includes('villa lemon') && (
                    <p className="text-[11px] text-amber-600 font-medium mt-1">
                      ℹ️ Villa Lemon is the in-house organization. For external clients (e.g. Rythm Bay Home, Panchavadi), select their organization above.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Invoice Type
                  </label>
                  <select
                    value={invoiceType}
                    onChange={e => setInvoiceType(e.target.value as InvoiceType)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500"
                  >
                    {INVOICE_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Date to Date Selection with Quick Presets */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>Billing Date Range (From Date to Date)</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPresetRange('this_month')}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[11px] font-semibold text-slate-700 shadow-xs"
                    >
                      This Month
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetRange('last_month')}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[11px] font-semibold text-slate-700 shadow-xs"
                    >
                      Last Month
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetRange('all')}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[11px] font-semibold text-slate-700 shadow-xs"
                    >
                      All Pending
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Invoice Bill Date</label>
                    <input
                      type="date"
                      value={invoiceDate}
                      onChange={e => setInvoiceDate(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Period From (Start Date)</label>
                    <input
                      type="date"
                      value={periodFrom}
                      onChange={e => handleDateRangeChange(e.target.value, periodTo)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Period To (End Date)</label>
                    <input
                      type="date"
                      value={periodTo}
                      onChange={e => handleDateRangeChange(periodFrom, e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Live Trips Breakdown Section */}
              <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900 text-xs uppercase tracking-wider">
                      Trips Breakdown ({availableTrips.length} found)
                    </span>
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-[11px] font-bold text-blue-600 hover:underline"
                    >
                      {selectedTripIds.length === availableTrips.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleBulkSetStatus('Pending')}
                      className="px-2 py-0.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-bold"
                      title="Set all selected trips status to Pending"
                    >
                      Mark Selected Pending
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkSetStatus('Paid')}
                      className="px-2 py-0.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-[10px] font-bold"
                      title="Set all selected trips status to Paid"
                    >
                      Mark Selected Paid
                    </button>
                  </div>
                </div>

                {/* Summary Banner for Selected Trips */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-white rounded-xl border border-slate-200 shadow-xs font-mono text-center">
                  <div>
                    <span className="text-[10px] font-sans font-bold text-slate-400 block uppercase">No. of Trips</span>
                    <span className="text-sm font-black text-blue-900">{selectedTripsList.length} trips</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-sans font-bold text-slate-400 block uppercase">Total Trip Cost</span>
                    <span className="text-sm font-black text-slate-900">{formatINR(totalGrossAmount)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-sans font-bold text-slate-400 block uppercase">Advance / Paid</span>
                    <span className="text-sm font-black text-emerald-600">{formatINR(totalAdvancePaid)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-sans font-bold text-slate-400 block uppercase">Pending Balance</span>
                    <span className="text-sm font-black text-amber-700">{formatINR(totalPendingBalance)}</span>
                  </div>
                </div>

                {/* Table of Trips */}
                {loadingTrips ? (
                  <div className="py-8 flex justify-center">
                    <LoadingSpinner size="md" />
                  </div>
                ) : availableTrips.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                    <p className="font-semibold text-xs">No trips found for this organization in this date range.</p>
                    <p className="text-[11px] mt-0.5">Try widening the dates or selecting another organization.</p>
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
                    {availableTrips.map(t => {
                      const isSelected = selectedTripIds.includes(t.id);
                      const cost = Number(t.trip_selling_price || 0);
                      const adv = Number(t.advance_amount || 0);
                      const isPaid = t.billing_status === 'Paid';
                      const pend = isPaid ? 0 : Math.max(0, cost - adv);

                      return (
                        <div
                          key={t.id}
                          className={`p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition-colors ${
                            isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleTripSelection(t.id)}
                              className="mt-1 rounded text-blue-600 focus:ring-blue-500"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-black text-blue-900">{t.trip_number}</span>
                                <span className="font-semibold text-slate-800">{formatDate(t.trip_date)}</span>
                                {t.pickup_time && (
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {formatTime(t.pickup_time)}
                                  </span>
                                )}
                                <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-600 font-medium">
                                  {t.required_cab_type || 'Cab'}
                                </span>
                              </div>
                              <p className="text-slate-700 font-medium truncate mt-0.5">
                                Guest: <strong>{t.guest_names || 'Guest'}</strong> • Route: {t.pickup_location} → {t.dropoff_location}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 font-mono self-end sm:self-auto shrink-0 flex-wrap">
                            <div>
                              <span className="text-[9px] font-sans text-slate-400 block">Cost</span>
                              <span className="font-bold text-slate-900">{formatINR(cost)}</span>
                            </div>

                            <div>
                              <span className="text-[9px] font-sans text-slate-400 block">Advance</span>
                              {editingTripId === t.id ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    value={editAdvanceVal}
                                    onChange={e => setEditAdvanceVal(e.target.value === '' ? '' : Number(e.target.value))}
                                    className="w-16 px-1 py-0.5 text-[11px] border rounded"
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSaveTripAdvance(t.id)}
                                    className="p-1 bg-emerald-600 text-white rounded text-[10px]"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingTripId(t.id);
                                    setEditAdvanceVal(adv);
                                  }}
                                  className="font-semibold text-emerald-700 hover:underline flex items-center gap-0.5"
                                  title="Click to edit advance"
                                >
                                  <span>{formatINR(adv)}</span>
                                  <Edit2 className="w-2.5 h-2.5 text-slate-400" />
                                </button>
                              )}
                            </div>

                            <div>
                              <span className="text-[9px] font-sans text-slate-400 block">Pending</span>
                              <span className="font-black text-amber-700">{formatINR(pend)}</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleToggleTripStatus(t.id, t.billing_status)}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-sans transition-transform active:scale-95 ${
                                isPaid
                                  ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                                  : 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                              }`}
                              title="Click to toggle status"
                            >
                              {isPaid ? '✓ Paid' : '⏳ Pending'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Invoice Notes & Bank Account / UPI Details
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Please transfer to Villa Lemon A/c 1234567890 IFSC ... / UPI villalemon@upi"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3 flex-wrap">
                <span className="text-xs font-mono font-bold text-slate-700">
                  Total Billable Due: <strong className="text-blue-900 text-sm">{formatINR(totalPendingBalance)}</strong>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={selectedTripIds.length === 0}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>Issue Invoice ({selectedTripIds.length} Trips)</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PRINTABLE / VIEW INVOICE MODAL (Complete Breakdown with Print) */}
      {/* ============================================================== */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto space-y-6 border border-slate-100">
            {/* Header */}
            <div className="flex items-start justify-between border-b pb-4 flex-wrap gap-3">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">VILLALEMON PICKUP</h2>
                <p className="text-xs text-slate-500 font-medium">Varkala Operations & Tourism Transport Services</p>
                <p className="text-[11px] text-slate-400">Temple Road, Varkala, Kerala • Phone: +91 90482 79460</p>
              </div>
              <div className="text-right">
                <span className="font-mono font-black text-blue-900 text-lg sm:text-xl block">
                  {selectedInvoice.invoice_number}
                </span>
                <p className="text-xs text-slate-500">Date: {formatDate(selectedInvoice.invoice_date)}</p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 ${
                  (selectedInvoice.balance || 0) === 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {(selectedInvoice.balance || 0) === 0 ? 'STATUS: PAID' : 'STATUS: PENDING PAYMENT'}
                </span>
              </div>
            </div>

            {/* Billed To & Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <p className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Billed To (Client)</p>
                <p className="font-black text-slate-900 text-base">{selectedInvoice.organization?.name || 'Client'}</p>
                <p className="text-slate-600">Contact: {selectedInvoice.organization?.contact_person || 'Authorized Manager'}</p>
                <p className="text-slate-600">Phone: {selectedInvoice.organization?.phone || '-'}</p>
                {selectedInvoice.organization?.billing_address && (
                  <p className="text-slate-500 text-[11px] mt-1">{selectedInvoice.organization?.billing_address}</p>
                )}
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <p className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Invoice Overview</p>
                <p className="text-slate-700">Billing Type: <strong>{selectedInvoice.invoice_type}</strong></p>
                {selectedInvoice.period_from && (
                  <p className="text-slate-700">
                    Period: <strong>{formatDate(selectedInvoice.period_from)}</strong> to <strong>{formatDate(selectedInvoice.period_to || '')}</strong>
                  </p>
                )}
                <p className="text-slate-700">
                  Total Trips Included: <strong>{selectedInvoice.trips?.length || selectedInvoice.trips_count || 0} trips</strong>
                </p>
              </div>
            </div>

            {/* 4 Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                <span className="text-[10px] font-sans font-bold text-blue-700 block uppercase">No. of Trips</span>
                <span className="text-base font-black text-blue-950">{selectedInvoice.trips?.length || 0}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-sans font-bold text-slate-500 block uppercase">Total Amount</span>
                <span className="text-base font-black text-slate-900">{formatINR(selectedInvoice.total_amount)}</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[10px] font-sans font-bold text-emerald-700 block uppercase">Advance / Paid</span>
                <span className="text-base font-black text-emerald-700">{formatINR(selectedInvoice.paid_against_invoice || 0)}</span>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <span className="text-[10px] font-sans font-bold text-amber-800 block uppercase">Pending Balance</span>
                <span className="text-base font-black text-amber-900">{formatINR(selectedInvoice.balance || 0)}</span>
              </div>
            </div>

            {/* Full Itemized Trips Breakdown Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
              <div className="p-3 bg-slate-100/70 border-b border-slate-200 font-bold text-slate-800 uppercase text-[10px] tracking-wider flex items-center justify-between">
                <span>Trip Breakdown ({selectedInvoice.trips?.length || 0} Duties)</span>
                <span>Currency: INR (₹)</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b text-slate-600 uppercase text-[10px] font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Date & Time</th>
                      <th className="py-2.5 px-3">Trip ID</th>
                      <th className="py-2.5 px-3">Guest & Route</th>
                      <th className="py-2.5 px-3">Cab</th>
                      <th className="py-2.5 px-3 text-right">Cost</th>
                      <th className="py-2.5 px-3 text-right">Advance</th>
                      <th className="py-2.5 px-3 text-right">Pending</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedInvoice.trips || []).map((t, idx) => {
                      const cost = Number(t.trip_selling_price || 0);
                      const adv = Number(t.advance_amount || 0);
                      const isPaid = t.billing_status === 'Paid';
                      const pend = isPaid ? 0 : Math.max(0, cost - adv);

                      return (
                        <tr key={t.id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-800 whitespace-nowrap">
                            {formatDate(t.trip_date)}
                            {t.pickup_time && <span className="text-[10px] text-slate-400 block font-mono">{formatTime(t.pickup_time)}</span>}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-900 whitespace-nowrap">
                            {t.trip_number}
                          </td>
                          <td className="py-2.5 px-3">
                            <p className="font-bold text-slate-900">{t.guest_names || 'Guest'}</p>
                            <p className="text-slate-500 text-[11px] truncate max-w-xs">{t.pickup_location} → {t.dropoff_location}</p>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 font-medium">
                            {t.required_cab_type || 'Cab'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                            {formatINR(cost)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-emerald-600 whitespace-nowrap">
                            {formatINR(adv)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-amber-700 whitespace-nowrap">
                            {formatINR(pend)}
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {isPaid ? 'Paid' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t font-mono font-bold">
                    <tr>
                      <td colSpan={5} className="py-2.5 px-3 font-sans font-bold text-slate-800 text-right">
                        Totals:
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-900">
                        {formatINR(selectedInvoice.total_amount)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-600">
                        {formatINR(selectedInvoice.paid_against_invoice || 0)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-sm text-amber-900 font-black">
                        {formatINR(selectedInvoice.balance || 0)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Notes & Bank Transfer */}
            {selectedInvoice.notes && (
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-xs text-amber-900">
                <strong>Payment Instructions:</strong> {selectedInvoice.notes}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4 border-t gap-2 flex-wrap">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="btn-secondary text-xs px-4 py-2"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <a
                  href={formatWhatsAppShareUrl(
                    selectedInvoice.organization?.phone,
                    generateInvoiceWhatsAppMessage(selectedInvoice)
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Send Bill on WhatsApp</span>
                </a>

                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Tax Invoice</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesPage;
