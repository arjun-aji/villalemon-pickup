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
  FileText,
  Send,
  Layers,
} from 'lucide-react';
import { invoiceService, organizationService } from '../../services/adminOperationsService';
import { tripService } from '../../services/tripService';
import { Invoice, Organization, Trip, InvoiceType } from '../../types';
import { formatINR, formatDate, formatTime, formatWhatsAppShareUrl } from '../../utils/formatters';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const INVOICE_TYPES: InvoiceType[] = [
  'Weekly invoice',
  'Monthly invoice',
  'Trip invoice',
];

const InvoicesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pending_bills' | 'saved_invoices'>('pending_bills');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Active Filter: Organization & Date Range (From Date to Date)
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const firstOfMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const endOfMonthStr = `${lastDayOfMonth.getFullYear()}-${String(lastDayOfMonth.getMonth() + 1).padStart(2, '0')}-${String(lastDayOfMonth.getDate()).padStart(2, '0')}`;

  const [selectedOrgId, setSelectedOrgId] = useState<string>('all_partners');
  const [periodFrom, setPeriodFrom] = useState(firstOfMonthStr);
  const [periodTo, setPeriodTo] = useState(endOfMonthStr);

  // Trips matching organization and date range
  const [liveTrips, setLiveTrips] = useState<Trip[]>([]);
  const [selectedTripIds, setSelectedTripIds] = useState<string[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);

  // Quick edit trip advance inline
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [editAdvanceVal, setEditAdvanceVal] = useState<number | ''>(0);

  // Modal: Full Printable / Shareable Invoice Bill
  const [previewInvoice, setPreviewInvoice] = useState<{
    invoice_number: string;
    invoice_date: string;
    organization: Organization | null;
    period_from: string;
    period_to: string;
    trips: Trip[];
    total_amount: number;
    paid_against_invoice: number;
    balance: number;
    notes?: string;
  } | null>(null);

  // Modal: Save as Formal Invoice
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveInvoiceType, setSaveInvoiceType] = useState<InvoiceType>('Weekly invoice');
  const [saveInvoiceDate, setSaveInvoiceDate] = useState(todayStr);
  const [saveNotes, setSaveNotes] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [invList, orgList] = await Promise.all([
        invoiceService.getAll(),
        organizationService.getAll(),
      ]);
      setInvoices(invList);
      setOrganizations(orgList);

      // Default to "All Partner Organizations (Excluding Villa Lemon)"
      const defaultOrg = 'all_partners';
      setSelectedOrgId(defaultOrg);
      await loadTrips(defaultOrg, periodFrom, periodTo);
    } catch (err) {
      console.error('Error loading bills & invoices data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTrips = async (orgId: string, from: string, to: string) => {
    try {
      setLoadingTrips(true);
      const trips = await invoiceService.getTripsForInvoice(orgId, from, to);
      setLiveTrips(trips);
      // Auto-select all trips by default
      setSelectedTripIds(trips.map(t => t.id));
    } catch (err) {
      console.error('Error querying trips for invoice:', err);
    } finally {
      setLoadingTrips(false);
    }
  };

  const handleOrgChange = (newOrgId: string) => {
    setSelectedOrgId(newOrgId);
    loadTrips(newOrgId, periodFrom, periodTo);
  };

  const handleDateRangeChange = (from: string, to: string) => {
    setPeriodFrom(from);
    setPeriodTo(to);
    if (selectedOrgId) {
      loadTrips(selectedOrgId, from, to);
    }
  };

  const setPresetRange = (preset: 'this_month' | 'last_month' | 'all') => {
    const nowDate = new Date();
    if (preset === 'this_month') {
      const from = `${nowDate.getFullYear()}-${String(nowDate.getMonth() + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 0);
      const to = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
      handleDateRangeChange(from, to);
    } else if (preset === 'last_month') {
      const prev = new Date(nowDate.getFullYear(), nowDate.getMonth() - 1, 1);
      const lastDay = new Date(nowDate.getFullYear(), nowDate.getMonth(), 0);
      const from = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-01`;
      const to = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
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
    if (selectedTripIds.length === liveTrips.length) {
      setSelectedTripIds([]);
    } else {
      setSelectedTripIds(liveTrips.map(t => t.id));
    }
  };

  // Toggle single trip status (Pending <-> Paid)
  const handleToggleTripStatus = async (tripId: string, currentStatus?: string) => {
    const nextStatus: 'Pending' | 'Paid' = currentStatus === 'Paid' ? 'Pending' : 'Paid';
    try {
      await tripService.updateTripBilling(tripId, { billingStatus: nextStatus });
      setLiveTrips(prev => prev.map(t => {
        if (t.id === tripId) {
          const cost = Number(t.trip_selling_price || 0);
          const adv = Number(t.advance_amount || 0);
          return {
            ...t,
            billing_status: nextStatus,
            pending_amount: nextStatus === 'Paid' ? 0 : Math.max(0, cost - adv),
          };
        }
        return t;
      }));
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    }
  };

  // Save advance amount for a trip
  const handleSaveTripAdvance = async (tripId: string) => {
    const adv = Number(editAdvanceVal) || 0;
    try {
      await tripService.updateTripBilling(tripId, { advanceAmount: adv });
      setLiveTrips(prev => prev.map(t => {
        if (t.id === tripId) {
          const cost = Number(t.trip_selling_price || 0);
          const isPaid = t.billing_status === 'Paid';
          return {
            ...t,
            advance_amount: adv,
            pending_amount: isPaid ? 0 : Math.max(0, cost - adv),
          };
        }
        return t;
      }));
      setEditingTripId(null);
    } catch (err: any) {
      alert(err.message || 'Error updating advance');
    }
  };

  // Bulk update all selected trips
  const handleBulkSetStatus = async (targetStatus: 'Pending' | 'Paid') => {
    if (selectedTripIds.length === 0) return;
    try {
      for (const tid of selectedTripIds) {
        await tripService.updateTripBilling(tid, { billingStatus: targetStatus });
      }
      setLiveTrips(prev => prev.map(t => {
        if (selectedTripIds.includes(t.id)) {
          const cost = Number(t.trip_selling_price || 0);
          const adv = Number(t.advance_amount || 0);
          return {
            ...t,
            billing_status: targetStatus,
            pending_amount: targetStatus === 'Paid' ? 0 : Math.max(0, cost - adv),
          };
        }
        return t;
      }));
    } catch (err: any) {
      alert(err.message || 'Error updating trips');
    }
  };

  // Selected trips calculations
  const selectedTripsList = liveTrips.filter(t => selectedTripIds.includes(t.id));
  const totalCost = selectedTripsList.reduce((sum, t) => sum + (Number(t.trip_selling_price) || 0), 0);
  const totalAdv = selectedTripsList.reduce((sum, t) => {
    if (t.billing_status === 'Paid') return sum + (Number(t.trip_selling_price) || 0);
    return sum + (Number(t.advance_amount) || 0);
  }, 0);
  const totalPending = Math.max(0, totalCost - totalAdv);

  // Active Organization
  const currentOrg: Organization | null = selectedOrgId === 'all_partners'
    ? (selectedTripsList.length > 0 && selectedTripsList.every(t => t.organization_id === selectedTripsList[0].organization_id)
        ? organizations.find(o => o.id === selectedTripsList[0].organization_id) || null
        : {
            id: 'all_partners',
            name: 'All Partner Organizations',
            type: 'Client',
            contact_person: 'Partner Coordinator',
            phone: '',
            payment_terms: 'Billing Settlement',
            whatsapp: '',
            credit_limit: 0,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as unknown as Organization)
    : organizations.find(o => o.id === selectedOrgId) || null;

  // Open Live Bill Preview / Print
  const handleOpenLiveBillPreview = () => {
    if (selectedTripsList.length === 0) {
      alert('Please select at least one trip to generate the bill.');
      return;
    }
    const orgName = currentOrg?.name || 'Client';
    const cleanPrefix = orgName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
    const tempInvNum = `BILL-${cleanPrefix}-${todayStr.replace(/-/g, '').slice(2)}`;

    setPreviewInvoice({
      invoice_number: tempInvNum,
      invoice_date: todayStr,
      organization: currentOrg,
      period_from: periodFrom,
      period_to: periodTo,
      trips: selectedTripsList,
      total_amount: totalCost,
      paid_against_invoice: totalAdv,
      balance: totalPending,
      notes: currentOrg?.payment_terms || 'Please transfer pending balance to our official bank account or UPI.',
    });
  };

  // Save as Formal Invoice in DB
  const handleSaveFormalInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTripIds.length === 0) {
      alert('Please select at least one trip to generate this invoice');
      return;
    }

    const orgIdToSave = selectedOrgId === 'all_partners'
      ? selectedTripsList[0]?.organization_id
      : selectedOrgId;

    if (!orgIdToSave) {
      alert('Please select a specific organization for formal invoice archiving');
      return;
    }

    try {
      await invoiceService.create(
        {
          organization_id: orgIdToSave,
          invoice_type: saveInvoiceType,
          invoice_date: saveInvoiceDate,
          period_from: periodFrom || null as any,
          period_to: periodTo || null as any,
          status: totalPending === 0 ? 'Paid' : 'Issued',
          notes: saveNotes || null as any,
          total_amount: totalCost,
        },
        selectedTripIds
      );
      setIsSaveModalOpen(false);
      // Reload invoices
      const invList = await invoiceService.getAll();
      setInvoices(invList);
      setActiveTab('saved_invoices');
    } catch (err: any) {
      alert(err.message || 'Error saving invoice');
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice? The linked trips will remain available for billing.')) {
      return;
    }
    try {
      await invoiceService.deleteInvoice(invoiceId);
      const invList = await invoiceService.getAll();
      setInvoices(invList);
    } catch (err: any) {
      alert(err.message || 'Error deleting invoice');
    }
  };

  // WhatsApp Message Generator
  const generateWhatsAppBillMessage = (
    org: Organization | null,
    trips: Trip[],
    gross: number,
    advance: number,
    balance: number,
    from: string,
    to: string,
    invNum?: string
  ) => {
    const orgName = org?.name || 'Client';
    const periodStr = from && to ? `${formatDate(from)} to ${formatDate(to)}` : 'Current Pending Billing';

    let msg = `📄 *VILLALEMON PICKUP — CLIENT BILL*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🏢 *Organization:* ${orgName}\n`;
    if (invNum) msg += `🧾 *Bill / Invoice #:* ${invNum}\n`;
    msg += `📅 *Billing Period:* ${periodStr}\n`;
    msg += `🚕 *Total Trips:* ${trips.length}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `💰 *Total Trip Cost:* Rs. ${gross.toLocaleString('en-IN')}\n`;
    msg += `✅ *Advance / Paid:* Rs. ${advance.toLocaleString('en-IN')}\n`;
    msg += `⚠️ *Net Pending Balance:* Rs. ${balance.toLocaleString('en-IN')}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    msg += `*Trip Breakdown:*\n`;

    trips.forEach((t, idx) => {
      const c = Number(t.trip_selling_price || 0);
      const a = Number(t.advance_amount || 0);
      const p = t.billing_status === 'Paid' ? 0 : Math.max(0, c - a);
      msg += `${idx + 1}. ${formatDate(t.trip_date)} (${t.trip_number}): ${t.guest_names || 'Guest'} • Cost: Rs. ${c.toLocaleString('en-IN')}`;
      if (a > 0) msg += ` (Adv: Rs. ${a.toLocaleString('en-IN')})`;
      msg += ` • Due: Rs. ${p.toLocaleString('en-IN')} [${t.billing_status || 'Pending'}]\n`;
    });

    msg += `\n_Please transfer pending balance to our official bank account or UPI. Thank you for your continued partnership!_`;
    return msg;
  };

  // Filter saved invoices
  const filteredInvoices = invoices.filter(inv => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNum = (inv.invoice_number || '').toLowerCase().includes(q);
      const matchOrg = (inv.organization?.name || '').toLowerCase().includes(q);
      return matchNum || matchOrg;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Bills & Invoices</h1>
          <p className="text-xs text-slate-500">
            Generate and manage pending bills from date to date for partner organizations with full trip breakdowns, advances, and balances due
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenLiveBillPreview}
            disabled={selectedTripsList.length === 0}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 inline-flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print / View Date-to-Date Bill</span>
          </button>

          <a
            href={formatWhatsAppShareUrl(
              currentOrg?.phone,
              generateWhatsAppBillMessage(currentOrg, selectedTripsList, totalCost, totalAdv, totalPending, periodFrom, periodTo)
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 inline-flex items-center gap-1.5"
            title="Share Pending Bill on WhatsApp"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span className="hidden sm:inline">WhatsApp Bill</span>
          </a>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('pending_bills')}
          className={`px-4 py-2 rounded-xl transition-all inline-flex items-center gap-2 ${
            activeTab === 'pending_bills'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Pending Bills by Organization (Date to Date)</span>
          {liveTrips.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white">
              {liveTrips.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('saved_invoices')}
          className={`px-4 py-2 rounded-xl transition-all inline-flex items-center gap-2 ${
            activeTab === 'saved_invoices'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Issued Invoices Archive</span>
          {invoices.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-800">
              {invoices.length}
            </span>
          )}
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: LIVE PENDING BILLS BY ORGANIZATION (Date to Date)       */}
      {/* ============================================================== */}
      {activeTab === 'pending_bills' && (
        <div className="space-y-5">
          {/* Filter Bar: Select Organization & Date Range */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span className="font-black text-slate-900 text-xs uppercase tracking-wider">
                  Organization & Billing Period Filter
                </span>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-400 font-medium mr-1">Presets:</span>
                <button
                  type="button"
                  onClick={() => setPresetRange('this_month')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-semibold text-slate-700"
                >
                  This Month
                </button>
                <button
                  type="button"
                  onClick={() => setPresetRange('last_month')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-semibold text-slate-700"
                >
                  Last Month
                </button>
                <button
                  type="button"
                  onClick={() => setPresetRange('all')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-semibold text-slate-700"
                >
                  All Dates
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Client Partner Organization *
                </label>
                <select
                  value={selectedOrgId}
                  onChange={e => handleOrgChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all_partners">⚡ All Partner Organizations (Excluding Villa Lemon)</option>
                  {organizations.map(o => {
                    const isOwn = o.name.toLowerCase().includes('villa lemon');
                    return (
                      <option key={o.id} value={o.id}>
                        {o.name} {isOwn ? '(Own Organization)' : `(${o.type || 'Client'})`}
                      </option>
                    );
                  })}
                </select>
                {currentOrg?.name.toLowerCase().includes('villa lemon') && (
                  <p className="text-[10px] text-amber-600 mt-1 font-medium">
                    Villa Lemon is the in-house organization. For external clients (Rythm Bay Home, Monkutty, Panchavadi), select their organization above.
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Billing Period From (Start Date)
                </label>
                <input
                  type="date"
                  value={periodFrom}
                  onChange={e => handleDateRangeChange(e.target.value, periodTo)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Billing Period To (End Date)
                </label>
                <input
                  type="date"
                  value={periodTo}
                  onChange={e => handleDateRangeChange(periodFrom, e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold bg-white"
                />
              </div>
            </div>
          </div>

          {/* Live Dynamic KPI Cards for this Organization & Date Range */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Selected Trips
              </span>
              <p className="text-xl sm:text-2xl font-black text-blue-900 font-mono">
                {selectedTripsList.length} <span className="text-xs font-normal text-slate-400">/ {liveTrips.length}</span>
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">{currentOrg?.name || 'Selected client'}</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Total Trip Cost
              </span>
              <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                {formatINR(totalCost)}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Full amount client gives</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block mb-0.5">
                Advance / Paid
              </span>
              <p className="text-xl sm:text-2xl font-black text-emerald-600 font-mono">
                {formatINR(totalAdv)}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Deducted from bill</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-amber-300 shadow-xs bg-gradient-to-b from-amber-50/40 to-white">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block mb-0.5">
                Net Pending Due
              </span>
              <p className="text-xl sm:text-2xl font-black text-amber-700 font-mono">
                {formatINR(totalPending)}
              </p>
              <p className="text-[10px] text-amber-800 font-medium mt-0.5">Amount to collect now</p>
            </div>
          </div>

          {/* Trips Breakdown Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-black text-slate-900 uppercase tracking-wider">
                  Trips in Range: {currentOrg?.name || 'Client'} ({liveTrips.length} Found)
                </span>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="font-bold text-blue-600 hover:underline"
                >
                  {selectedTripIds.length === liveTrips.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleBulkSetStatus('Pending')}
                  className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[11px]"
                >
                  Mark Selected as Pending
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkSetStatus('Paid')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-[11px]"
                >
                  Mark Selected as Paid
                </button>
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(true)}
                  disabled={selectedTripsList.length === 0}
                  className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shadow-xs disabled:opacity-50 inline-flex items-center gap-1"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Save as Invoice</span>
                </button>
              </div>
            </div>

            {loadingTrips ? (
              <div className="p-16 flex justify-center">
                <LoadingSpinner size="lg" />
              </div>
            ) : liveTrips.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">No trips found for this organization in this date range</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Select another organization (e.g. Rythm Bay Home) or click "All Dates" preset above to view all past and upcoming trips.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-3 text-center w-10">
                        <input
                          type="checkbox"
                          checked={selectedTripIds.length === liveTrips.length && liveTrips.length > 0}
                          onChange={handleSelectAll}
                          className="rounded text-blue-600"
                        />
                      </th>
                      <th className="py-3 px-3">Date & Time</th>
                      <th className="py-3 px-3">Trip ID</th>
                      <th className="py-3 px-3">Guest & Route</th>
                      <th className="py-3 px-3">Vehicle</th>
                      <th className="py-3 px-3 text-right">Trip Cost (Gross)</th>
                      <th className="py-3 px-3 text-right">Advance Given</th>
                      <th className="py-3 px-3 text-right">Pending Balance</th>
                      <th className="py-3 px-3 text-center">Payment Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {liveTrips.map(t => {
                      const isSelected = selectedTripIds.includes(t.id);
                      const cost = Number(t.trip_selling_price || 0);
                      const adv = Number(t.advance_amount || 0);
                      const isPaid = t.billing_status === 'Paid';
                      const pend = isPaid ? 0 : Math.max(0, cost - adv);

                      return (
                        <tr
                          key={t.id}
                          className={`transition-colors ${isSelected ? 'bg-blue-50/40' : 'hover:bg-slate-50/60'}`}
                        >
                          <td className="py-3 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleTripSelection(t.id)}
                              className="rounded text-blue-600"
                            />
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-800 whitespace-nowrap">
                            {formatDate(t.trip_date)}
                            {t.pickup_time && (
                              <span className="text-[10px] text-slate-400 block font-mono">
                                {formatTime(t.pickup_time)}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-blue-900 whitespace-nowrap">
                            {t.trip_number}
                          </td>
                          <td className="py-3 px-3">
                            <p className="font-bold text-slate-900">{t.guest_names || 'Guest'}</p>
                            <p className="text-slate-500 text-[11px] truncate max-w-xs">
                              {t.pickup_location} → {t.dropoff_location}
                            </p>
                          </td>
                          <td className="py-3 px-3 text-slate-600 font-medium">
                            {t.required_cab_type || 'Cab'}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 text-sm whitespace-nowrap">
                            {formatINR(cost)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono whitespace-nowrap">
                            {editingTripId === t.id ? (
                              <div className="flex items-center justify-end gap-1">
                                <input
                                  type="number"
                                  value={editAdvanceVal}
                                  onChange={e => setEditAdvanceVal(e.target.value === '' ? '' : Number(e.target.value))}
                                  className="w-16 px-1.5 py-0.5 text-xs border rounded bg-white text-right"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveTripAdvance(t.id)}
                                  className="p-1 bg-emerald-600 text-white rounded text-[10px]"
                                  title="Save Advance"
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
                                className="font-semibold text-emerald-700 hover:underline inline-flex items-center gap-1 group"
                                title="Click to adjust advance received"
                              >
                                <span>{formatINR(adv)}</span>
                                <Edit2 className="w-2.5 h-2.5 text-slate-300 group-hover:text-emerald-700" />
                              </button>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-black text-amber-700 text-sm whitespace-nowrap">
                            {formatINR(pend)}
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleToggleTripStatus(t.id, t.billing_status)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-transform active:scale-95 shadow-2xs ${
                                isPaid
                                  ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                                  : 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                              }`}
                              title="Click to toggle status between Pending and Paid"
                            >
                              {isPaid ? '✓ Bill Paid' : '⏳ Due (Pending)'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t font-mono font-bold">
                    <tr>
                      <td colSpan={5} className="py-3 px-3 font-sans font-bold text-slate-800 text-right">
                        Selected Subtotals ({selectedTripsList.length} trips):
                      </td>
                      <td className="py-3 px-3 text-right text-slate-900 text-sm">
                        {formatINR(totalCost)}
                      </td>
                      <td className="py-3 px-3 text-right text-emerald-700 text-sm">
                        {formatINR(totalAdv)}
                      </td>
                      <td className="py-3 px-3 text-right text-base text-amber-800 font-black">
                        {formatINR(totalPending)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: ISSUED INVOICES ARCHIVE                                  */}
      {/* ============================================================== */}
      {activeTab === 'saved_invoices' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
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

            <button
              onClick={() => setActiveTab('pending_bills')}
              className="btn-secondary text-xs px-3 py-1.5 inline-flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
              <span>Bill Unbilled Trips</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {filteredInvoices.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-base font-bold text-slate-700">No saved invoices in archive</p>
                <p className="text-xs text-slate-500 mt-1">
                  Go to "Pending Bills by Organization" tab above and click "Save as Invoice" to issue official archival bills.
                </p>
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
                    {filteredInvoices.map(inv => (
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
                              onClick={() => setPreviewInvoice({
                                invoice_number: inv.invoice_number,
                                invoice_date: inv.invoice_date,
                                organization: inv.organization || null,
                                period_from: inv.period_from || '',
                                period_to: inv.period_to || '',
                                trips: inv.trips || [],
                                total_amount: inv.total_amount || 0,
                                paid_against_invoice: inv.paid_against_invoice || 0,
                                balance: inv.balance || 0,
                                notes: inv.notes,
                              })}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors text-xs font-semibold"
                              title="View & Print Full Bill"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Bill</span>
                            </button>

                            <a
                              href={formatWhatsAppShareUrl(
                                inv.organization?.phone,
                                generateWhatsAppBillMessage(inv.organization || null, inv.trips || [], inv.total_amount || 0, inv.paid_against_invoice || 0, inv.balance || 0, inv.period_from || '', inv.period_to || '', inv.invoice_number)
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
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: PRINTABLE INVOICE / DATE-TO-DATE TAX BILL             */}
      {/* ============================================================== */}
      {previewInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto space-y-6 border border-slate-100">
            {/* Header */}
            <div className="flex items-start justify-between border-b pb-4 flex-wrap gap-3">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">VILLALEMON PICKUP</h2>
                <p className="text-xs text-slate-500 font-medium">Varkala Operations & Tourism Transport Services</p>
                <p className="text-[11px] text-slate-400">Temple Road, Varkala, Kerala • Phone: +91 90482 79460</p>
              </div>
              <div className="text-right">
                <span className="font-mono font-black text-blue-900 text-lg sm:text-xl block">
                  {previewInvoice.invoice_number}
                </span>
                <p className="text-xs text-slate-500">Date: {formatDate(previewInvoice.invoice_date)}</p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 ${
                  previewInvoice.balance === 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {previewInvoice.balance === 0 ? 'STATUS: PAID' : 'STATUS: PENDING PAYMENT'}
                </span>
              </div>
            </div>

            {/* Billed To & Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <p className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Billed To (Client)</p>
                <p className="font-black text-slate-900 text-base">{previewInvoice.organization?.name || 'Client'}</p>
                <p className="text-slate-600">Contact: {previewInvoice.organization?.contact_person || 'Authorized Manager'}</p>
                <p className="text-slate-600">Phone: {previewInvoice.organization?.phone || '-'}</p>
                {previewInvoice.organization?.billing_address && (
                  <p className="text-slate-500 text-[11px] mt-1">{previewInvoice.organization?.billing_address}</p>
                )}
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <p className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Invoice Overview</p>
                {previewInvoice.period_from && (
                  <p className="text-slate-700">
                    Billing Period: <strong>{formatDate(previewInvoice.period_from)}</strong> to <strong>{formatDate(previewInvoice.period_to || '')}</strong>
                  </p>
                )}
                <p className="text-slate-700">
                  Total Duties Billed: <strong>{previewInvoice.trips.length} trips</strong>
                </p>
              </div>
            </div>

            {/* 4 Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                <span className="text-[10px] font-sans font-bold text-blue-700 block uppercase">No. of Trips</span>
                <span className="text-base font-black text-blue-950">{previewInvoice.trips.length}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-sans font-bold text-slate-500 block uppercase">Total Trip Cost</span>
                <span className="text-base font-black text-slate-900">{formatINR(previewInvoice.total_amount)}</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[10px] font-sans font-bold text-emerald-700 block uppercase">Advance / Paid</span>
                <span className="text-base font-black text-emerald-700">{formatINR(previewInvoice.paid_against_invoice)}</span>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <span className="text-[10px] font-sans font-bold text-amber-800 block uppercase">Pending Balance</span>
                <span className="text-base font-black text-amber-900">{formatINR(previewInvoice.balance)}</span>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
              <div className="p-3 bg-slate-100/70 border-b border-slate-200 font-bold text-slate-800 uppercase text-[10px] tracking-wider flex items-center justify-between">
                <span>Itemized Duty Breakdown ({previewInvoice.trips.length} Duties)</span>
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
                    {previewInvoice.trips.map((t, idx) => {
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
                        {formatINR(previewInvoice.total_amount)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-600">
                        {formatINR(previewInvoice.paid_against_invoice)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-sm text-amber-900 font-black">
                        {formatINR(previewInvoice.balance)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Notes & Bank Details */}
            {previewInvoice.notes && (
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-xs text-amber-900">
                <strong>Payment Instructions:</strong> {previewInvoice.notes}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t gap-2 flex-wrap">
              <button
                onClick={() => setPreviewInvoice(null)}
                className="btn-secondary text-xs px-4 py-2"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <a
                  href={formatWhatsAppShareUrl(
                    previewInvoice.organization?.phone,
                    generateWhatsAppBillMessage(
                      previewInvoice.organization,
                      previewInvoice.trips,
                      previewInvoice.total_amount,
                      previewInvoice.paid_against_invoice,
                      previewInvoice.balance,
                      previewInvoice.period_from,
                      previewInvoice.period_to,
                      previewInvoice.invoice_number
                    )
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

      {/* ============================================================== */}
      {/* MODAL 2: SAVE AS FORMAL INVOICE MODAL                          */}
      {/* ============================================================== */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">Save Formal Invoice</h3>
                <p className="text-xs text-slate-500">Record this batch into your issued invoices archive</p>
              </div>
              <button
                onClick={() => setIsSaveModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFormalInvoice} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Client Organization</label>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900">
                  {currentOrg?.name} ({currentOrg?.type || 'Client'})
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Invoice Type</label>
                  <select
                    value={saveInvoiceType}
                    onChange={e => setSaveInvoiceType(e.target.value as InvoiceType)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                  >
                    {INVOICE_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Invoice Issue Date</label>
                  <input
                    type="date"
                    value={saveInvoiceDate}
                    onChange={e => setSaveInvoiceDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 font-mono">
                <div className="flex justify-between text-slate-600">
                  <span>Included Duties:</span>
                  <span className="font-bold text-slate-900">{selectedTripsList.length} trips</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total Amount:</span>
                  <span className="font-bold text-slate-900">{formatINR(totalCost)}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Advance / Paid:</span>
                  <span className="font-bold">{formatINR(totalAdv)}</span>
                </div>
                <div className="flex justify-between text-amber-900 font-black pt-1 border-t border-slate-200 text-sm">
                  <span>Net Balance Due:</span>
                  <span>{formatINR(totalPending)}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Instructions / Notes</label>
                <input
                  type="text"
                  value={saveNotes}
                  onChange={e => setSaveNotes(e.target.value)}
                  placeholder="e.g. Bank transfer to A/c ... IFSC ..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="btn-secondary text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs px-4 py-2"
                >
                  Save & Issue Formal Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesPage;
