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
import { invoiceService, organizationService, driverLedgerService } from '../../services/adminOperationsService';
import { tripService } from '../../services/tripService';
import { driverService } from '../../services/driverService';
import { Invoice, Organization, Trip, InvoiceType, DriverEmployee } from '../../types';
import { formatINR, formatDate, formatTime, formatWhatsAppShareUrl } from '../../utils/formatters';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const INVOICE_TYPES: InvoiceType[] = [
  'Weekly invoice',
  'Monthly invoice',
  'Trip invoice',
];

const InvoicesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pending_bills' | 'driver_settlements' | 'saved_invoices'>('pending_bills');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [drivers, setDrivers] = useState<DriverEmployee[]>([]);
  const [driverBalances, setDriverBalances] = useState<any[]>([]);
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

  // Driver Settlement State
  const [selectedDriverId, setSelectedDriverId] = useState<string>('all');
  const [driverPeriodFrom, setDriverPeriodFrom] = useState(firstOfMonthStr);
  const [driverPeriodTo, setDriverPeriodTo] = useState(endOfMonthStr);
  const [driverSettlementStatusFilter, setDriverSettlementStatusFilter] = useState<'all' | 'not_settled' | 'settled'>('all');
  const [driverTrips, setDriverTrips] = useState<Trip[]>([]);
  const [selectedDriverTripIds, setSelectedDriverTripIds] = useState<string[]>([]);
  const [loadingDriverTrips, setLoadingDriverTrips] = useState(false);
  const [togglingSettlementId, setTogglingSettlementId] = useState<string | null>(null);
  const [driverLedgerAdjustment, setDriverLedgerAdjustment] = useState<number>(0);

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

  // Modal: Driver Settlement Printable / Shareable Voucher
  const [previewDriverInvoice, setPreviewDriverInvoice] = useState<{
    driver: DriverEmployee | null;
    trips: Trip[];
    periodFrom: string;
    periodTo: string;
    totalWages: number;
    totalExpenses: number;
    grossCredit: number;
    guestCashCollected: number;
    priorLedgerCashHeld: number;
    netSettlement: number;
    invoiceNumber: string;
    invoiceDate: string;
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
      const [invList, orgList, drvList, balList] = await Promise.all([
        invoiceService.getAll(),
        organizationService.getAll(),
        driverService.getAll(),
        driverLedgerService.getDriverBalances(),
      ]);
      setInvoices(invList);
      setOrganizations(orgList);
      setDrivers(drvList);
      setDriverBalances(balList);

      // Default to "All Partner Organizations (Excluding Villa Lemon)"
      const defaultOrg = 'all_partners';
      setSelectedOrgId(defaultOrg);
      await Promise.all([
        loadTrips(defaultOrg, periodFrom, periodTo),
        loadDriverSettlementTrips('all', driverPeriodFrom, driverPeriodTo),
      ]);
    } catch (err) {
      console.error('Error loading bills & invoices data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDriverSettlementTrips = async (driverId: string, from: string, to: string) => {
    try {
      setLoadingDriverTrips(true);
      const trips = await tripService.getTripsForDriverSettlement(driverId, from, to);
      setDriverTrips(trips);
      // Auto-select all trips
      setSelectedDriverTripIds(trips.map(t => t.id));
    } catch (err) {
      console.error('Error querying driver settlement trips:', err);
    } finally {
      setLoadingDriverTrips(false);
    }
  };

  const handleDriverChange = (newDriverId: string) => {
    setSelectedDriverId(newDriverId);
    loadDriverSettlementTrips(newDriverId, driverPeriodFrom, driverPeriodTo);
  };

  const handleDriverDateRangeChange = (from: string, to: string) => {
    setDriverPeriodFrom(from);
    setDriverPeriodTo(to);
    loadDriverSettlementTrips(selectedDriverId, from, to);
  };

  const setDriverPresetRange = (preset: 'this_month' | 'last_month' | 'all') => {
    const nowDate = new Date();
    if (preset === 'this_month') {
      const from = `${nowDate.getFullYear()}-${String(nowDate.getMonth() + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 0);
      const to = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
      handleDriverDateRangeChange(from, to);
    } else if (preset === 'last_month') {
      const prev = new Date(nowDate.getFullYear(), nowDate.getMonth() - 1, 1);
      const lastDay = new Date(nowDate.getFullYear(), nowDate.getMonth(), 0);
      const from = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-01`;
      const to = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
      handleDriverDateRangeChange(from, to);
    } else if (preset === 'all') {
      handleDriverDateRangeChange('', '');
    }
  };

  const toggleDriverTripSelection = (tripId: string) => {
    if (selectedDriverTripIds.includes(tripId)) {
      setSelectedDriverTripIds(selectedDriverTripIds.filter(id => id !== tripId));
    } else {
      setSelectedDriverTripIds([...selectedDriverTripIds, tripId]);
    }
  };

  const handleSelectAllDriverTrips = (tripsToSelect: Trip[]) => {
    if (selectedDriverTripIds.length === tripsToSelect.length) {
      setSelectedDriverTripIds([]);
    } else {
      setSelectedDriverTripIds(tripsToSelect.map(t => t.id));
    }
  };

  const handleToggleSingleDriverSettlement = async (tripId: string, currentStatus?: string) => {
    const nextStatus: 'Settled' | 'Not Settled' = currentStatus === 'Settled' ? 'Not Settled' : 'Settled';
    try {
      setTogglingSettlementId(tripId);
      await tripService.updateDriverSettlementStatus(tripId, nextStatus);
      setDriverTrips(prev => prev.map(t => t.id === tripId ? { ...t, driver_settlement_status: nextStatus } : t));
    } catch (err: any) {
      alert(err.message || 'Error updating driver settlement status');
    } finally {
      setTogglingSettlementId(null);
    }
  };

  const handleBulkDriverSettlement = async (targetStatus: 'Settled' | 'Not Settled') => {
    if (selectedDriverTripIds.length === 0) return;
    try {
      for (const tid of selectedDriverTripIds) {
        await tripService.updateDriverSettlementStatus(tid, targetStatus);
      }
      setDriverTrips(prev => prev.map(t => selectedDriverTripIds.includes(t.id) ? { ...t, driver_settlement_status: targetStatus } : t));
    } catch (err: any) {
      alert(err.message || 'Error updating driver settlements');
    }
  };

  const handleQuickUpdateDriverPay = async (tripId: string, tripNumber?: string, currentPay?: number) => {
    const input = window.prompt(
      `Enter driver settlement wage / payment for trip ${tripNumber || ''} (₹):`,
      currentPay ? String(currentPay) : '800'
    );
    if (input === null) return;
    const amount = parseFloat(input);
    if (isNaN(amount) || amount < 0) {
      alert('Please enter a valid amount');
      return;
    }
    try {
      await tripService.updateTripDriverPay(tripId, amount);
      setDriverTrips(prev => prev.map(t => t.id === tripId ? { ...t, effective_driver_pay: amount, driver_trip_pay_override: amount, driver_charge: amount } : t));
    } catch (err: any) {
      alert(err.message || 'Error updating driver pay');
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

  // Filtered driver trips based on status filter
  const filteredDriverTrips = driverTrips.filter(t => {
    if (driverSettlementStatusFilter === 'not_settled' && t.driver_settlement_status === 'Settled') return false;
    if (driverSettlementStatusFilter === 'settled' && t.driver_settlement_status !== 'Settled') return false;
    return true;
  });

  const selectedDriverTripsList = filteredDriverTrips.filter(t => selectedDriverTripIds.includes(t.id));

  // Current active driver
  const currentActiveDriver: DriverEmployee | null = selectedDriverId !== 'all'
    ? drivers.find(d => d.id === selectedDriverId) || null
    : (selectedDriverTripsList.length > 0 && selectedDriverTripsList.every(t => t.assigned_driver_id === selectedDriverTripsList[0].assigned_driver_id)
        ? drivers.find(d => d.id === selectedDriverTripsList[0].assigned_driver_id) || null
        : null);

  // Prior cash advance / ledger deduction entered by user (optional)
  const driverPriorAdvance = Math.max(0, Number(driverLedgerAdjustment) || 0);

  const driverTotalWages = selectedDriverTripsList.reduce((sum, t) => sum + (Number((t as any).effective_driver_pay ?? t.driver_trip_pay_override ?? t.driver_charge ?? 0)), 0);
  const driverTotalExpenses = selectedDriverTripsList.reduce((sum, t) => sum + (Number((t as any).total_trip_expenses || 0)), 0);
  const driverGrossCredit = driverTotalWages + driverTotalExpenses;
  const driverGuestCashCollected = selectedDriverTripsList.reduce((sum, t) => sum + (Number((t as any).collected_by_driver || 0)), 0);
  const driverTotalDeductions = driverGuestCashCollected + driverPriorAdvance;
  const driverNetSettlement = driverGrossCredit - driverTotalDeductions;

  // Open Driver Settlement Invoice Preview
  const handleOpenDriverInvoicePreview = () => {
    if (selectedDriverTripsList.length === 0) {
      alert('Please select at least one trip to generate the driver settlement invoice.');
      return;
    }
    const drvName = currentActiveDriver?.full_name || 'Driver';
    const cleanPrefix = drvName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
    const tempVoucherNum = `DS-${cleanPrefix}-${todayStr.replace(/-/g, '').slice(2)}`;

    setPreviewDriverInvoice({
      driver: currentActiveDriver,
      trips: selectedDriverTripsList,
      periodFrom: driverPeriodFrom,
      periodTo: driverPeriodTo,
      totalWages: driverTotalWages,
      totalExpenses: driverTotalExpenses,
      grossCredit: driverGrossCredit,
      guestCashCollected: driverGuestCashCollected,
      priorLedgerCashHeld: driverPriorAdvance,
      netSettlement: driverNetSettlement,
      invoiceNumber: tempVoucherNum,
      invoiceDate: todayStr,
    });
  };

  // WhatsApp Message Generator for Driver Settlement
  const generateDriverWhatsAppSettlement = (
    drv: DriverEmployee | null,
    trips: Trip[],
    wages: number,
    exp: number,
    credit: number,
    coll: number,
    ledgerHeld: number,
    net: number,
    from: string,
    to: string,
    voucherNum?: string
  ) => {
    const drvName = drv?.full_name || 'Driver';
    const periodStr = from && to ? `${formatDate(from)} to ${formatDate(to)}` : 'Periodic Settlement';

    let msg = `🚕 *VILLALEMON PICKUP — DRIVER SETTLEMENT INVOICE*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `👨‍✈️ *Driver:* ${drvName} ${drv?.phone ? `(${drv.phone})` : ''}\n`;
    if (voucherNum) msg += `🧾 *Voucher #:* ${voucherNum}\n`;
    msg += `📅 *Settlement Period:* ${periodStr}\n`;
    msg += `🚗 *Total Trips:* ${trips.length}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `💰 *Driver Wages / Pay:* Rs. ${wages.toLocaleString('en-IN')}\n`;
    msg += `⛽ *Running Expenses Reimbursed:* Rs. ${exp.toLocaleString('en-IN')}\n`;
    msg += `👉 *Gross Driver Credit:* Rs. ${credit.toLocaleString('en-IN')}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `*Deductions:*\n`;
    msg += `➖ *Guest Cash Collected:* Rs. ${coll.toLocaleString('en-IN')}\n`;
    if (ledgerHeld > 0) msg += `➖ *Prior Cash Held in Ledger:* Rs. ${ledgerHeld.toLocaleString('en-IN')}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    if (net >= 0) {
      msg += `🟢 *AMOUNT TO BE PAID BY OFFICE TO DRIVER: Rs. ${net.toLocaleString('en-IN')}*\n`;
    } else {
      msg += `🔴 *AMOUNT DRIVER NEEDS TO RETURN TO OFFICE: Rs. ${Math.abs(net).toLocaleString('en-IN')}*\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    msg += `*Ride Breakdown:*\n`;

    trips.forEach((t, idx) => {
      const w = Number((t as any).effective_driver_pay ?? t.driver_trip_pay_override ?? t.driver_charge ?? 0);
      const e = Number((t as any).total_trip_expenses || 0);
      const c = Number((t as any).collected_by_driver || 0);
      const st = t.driver_settlement_status || 'Not Settled';
      msg += `${idx + 1}. ${formatDate(t.trip_date)} (${t.trip_number}): ${t.guest_names || 'Guest'} • Pay: Rs. ${w.toLocaleString('en-IN')} • Exp: Rs. ${e.toLocaleString('en-IN')} • Coll: Rs. ${c.toLocaleString('en-IN')} [${st}]\n`;
    });

    msg += `\n_Official Driver Settlement Statement issued by Villa Lemon Pickup._`;
    return msg;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Bills & Invoices</h1>
          <p className="text-xs text-slate-500">
            Generate and manage pending bills from date to date for partner organizations and driver periodic settlement statements
          </p>
        </div>

        {activeTab === 'driver_settlements' ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenDriverInvoicePreview}
              disabled={selectedDriverTripsList.length === 0}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 inline-flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print / View Driver Settlement Invoice</span>
            </button>

            <a
              href={formatWhatsAppShareUrl(
                currentActiveDriver?.phone,
                generateDriverWhatsAppSettlement(
                  currentActiveDriver,
                  selectedDriverTripsList,
                  driverTotalWages,
                  driverTotalExpenses,
                  driverGrossCredit,
                  driverGuestCashCollected,
                  driverPriorAdvance,
                  driverNetSettlement,
                  driverPeriodFrom,
                  driverPeriodTo
                )
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 inline-flex items-center gap-1.5"
              title="Share Driver Settlement Statement on WhatsApp"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span className="hidden sm:inline">WhatsApp Statement</span>
            </a>
          </div>
        ) : (
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
        )}
      </div>

      {/* Tabs Header */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('pending_bills')}
          className={`px-4 py-2 rounded-xl transition-all inline-flex items-center gap-2 whitespace-nowrap ${
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
          onClick={() => setActiveTab('driver_settlements')}
          className={`px-4 py-2 rounded-xl transition-all inline-flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'driver_settlements'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Car className="w-4 h-4" />
          <span>Driver Settlement Invoices (Date to Date)</span>
          {driverTrips.length > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'driver_settlements' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
            }`}>
              {driverTrips.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('saved_invoices')}
          className={`px-4 py-2 rounded-xl transition-all inline-flex items-center gap-2 whitespace-nowrap ${
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
      {/* TAB 2: DRIVER SETTLEMENT INVOICES (Date to Date)                */}
      {/* ============================================================== */}
      {activeTab === 'driver_settlements' && (
        <div className="space-y-5">
          {/* Filter Bar: Select Driver, Date Range & Settlement Status */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-blue-600" />
                <span className="font-black text-slate-900 text-xs uppercase tracking-wider">
                  Driver & Settlement Period Filter
                </span>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-400 font-medium mr-1">Presets:</span>
                <button
                  type="button"
                  onClick={() => setDriverPresetRange('this_month')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-semibold text-slate-700"
                >
                  This Month
                </button>
                <button
                  type="button"
                  onClick={() => setDriverPresetRange('last_month')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-semibold text-slate-700"
                >
                  Last Month
                </button>
                <button
                  type="button"
                  onClick={() => setDriverPresetRange('all')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-semibold text-slate-700"
                >
                  All Dates
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
              {/* Driver Dropdown */}
              <div className="md:col-span-3">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Assigned Driver
                </label>
                <select
                  value={selectedDriverId}
                  onChange={e => handleDriverChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="all">All Fleet Drivers ({drivers.length})</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.full_name} ({d.phone || 'No phone'}) - {d.employment_type || 'Driver'}
                    </option>
                  ))}
                </select>
              </div>

              {/* From Date */}
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={driverPeriodFrom}
                  onChange={e => handleDriverDateRangeChange(e.target.value, driverPeriodTo)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* To Date */}
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={driverPeriodTo}
                  onChange={e => handleDriverDateRangeChange(driverPeriodFrom, e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Settlement Status Filter */}
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Settlement Status
                </label>
                <select
                  value={driverSettlementStatusFilter}
                  onChange={e => setDriverSettlementStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="all">All Rides ({driverTrips.length})</option>
                  <option value="not_settled">⏳ Not Settled Only</option>
                  <option value="settled">✓ Settled Only</option>
                </select>
              </div>

              {/* Prior Cash Advance / Ledger Deduction */}
              <div className="md:col-span-3">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Prior Advance / Ledger Deduction (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={driverLedgerAdjustment === 0 ? '' : driverLedgerAdjustment}
                  onChange={e => setDriverLedgerAdjustment(Math.max(0, Number(e.target.value) || 0))}
                  placeholder="0 (Optional advance)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Summary KPIs: Gross Driver Credit vs Deductions vs Net Settlement */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
            {/* Total Rides */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Rides
              </span>
              <p className="text-2xl font-black text-slate-900 font-mono">
                {selectedDriverTripsList.length}
              </p>
              <span className="text-[11px] text-slate-500 font-medium">Selected rides</span>
            </div>

            {/* Total Driver Wages */}
            <div className="p-4 bg-white rounded-2xl border border-blue-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                Driver Wages / Pay
              </span>
              <p className="text-2xl font-black text-blue-700 font-mono">
                {formatINR(driverTotalWages)}
              </p>
              <span className="text-[11px] text-slate-500 font-medium">Earned duty allowances</span>
            </div>

            {/* Expenses Reimbursed */}
            <div className="p-4 bg-white rounded-2xl border border-sky-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider block">
                Expenses Reimbursed
              </span>
              <p className="text-2xl font-black text-sky-700 font-mono">
                {formatINR(driverTotalExpenses)}
              </p>
              <span className="text-[11px] text-slate-500 font-medium">Diesel + Toll + Workshop</span>
            </div>

            {/* Gross Driver Credit */}
            <div className="p-4 bg-white rounded-2xl border border-purple-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">
                Gross Driver Credit
              </span>
              <p className="text-2xl font-black text-purple-700 font-mono">
                {formatINR(driverGrossCredit)}
              </p>
              <span className="text-[11px] text-slate-500 font-medium">Pay + Running Expenses</span>
            </div>

            {/* Less: Deductions */}
            <div className="p-4 bg-white rounded-2xl border border-amber-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                Total Deductions
              </span>
              <p className="text-2xl font-black text-amber-700 font-mono">
                -{formatINR(driverTotalDeductions)}
              </p>
              <span className="text-[10px] text-slate-500 block truncate" title={driverPriorAdvance > 0 ? `Guest Cash: ₹${driverGuestCashCollected} + Prior Advance: ₹${driverPriorAdvance}` : `Guest Cash Collected: ₹${driverGuestCashCollected}`}>
                {driverPriorAdvance > 0 ? `Guest: ₹${driverGuestCashCollected} | Adv: ₹${driverPriorAdvance}` : `Guest Cash: ₹${driverGuestCashCollected}`}
              </span>
            </div>

            {/* Net Settlement Card */}
            <div className={`p-4 rounded-2xl shadow-md space-y-1 text-white ${
              driverNetSettlement >= 0
                ? 'bg-gradient-to-br from-emerald-600 to-teal-700'
                : 'bg-gradient-to-br from-amber-600 to-rose-700'
            }`}>
              <span className="text-[10px] font-extrabold uppercase tracking-wider block text-white/90">
                {driverNetSettlement >= 0 ? '🟢 Office Pays Driver' : '🔴 Driver Returns to Office'}
              </span>
              <p className="text-2xl font-black font-mono">
                {formatINR(Math.abs(driverNetSettlement))}
              </p>
              <span className="text-[10px] text-white/80 block">
                {driverNetSettlement >= 0 ? `Gross ₹${driverGrossCredit} − Deductions ₹${driverTotalDeductions}` : `Deductions ₹${driverTotalDeductions} − Gross ₹${driverGrossCredit}`}
              </span>
            </div>
          </div>

          {/* Table of Driver Rides */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Table Toolbar */}
            <div className="p-3 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">
                  {selectedDriverTripIds.length} of {filteredDriverTrips.length} rides selected
                </span>
                {selectedDriverTripIds.length > 0 && (
                  <span className="text-slate-400">|</span>
                )}
                {selectedDriverTripIds.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleBulkDriverSettlement('Settled')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs transition-all active:scale-95"
                    >
                      ✓ Mark Selected as Settled
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkDriverSettlement('Not Settled')}
                      className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-[11px] shadow-2xs transition-all active:scale-95"
                    >
                      ⏳ Mark Selected as Not Settled
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectAllDriverTrips(filteredDriverTrips)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 font-bold text-slate-700 text-[11px]"
                >
                  {selectedDriverTripIds.length === filteredDriverTrips.length ? 'Deselect All' : 'Select All Rides'}
                </button>
              </div>
            </div>

            {loadingDriverTrips ? (
              <div className="p-16 flex justify-center">
                <LoadingSpinner size="lg" />
              </div>
            ) : filteredDriverTrips.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Car className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-base font-bold text-slate-700">No rides found for this driver & period</p>
                <p className="text-xs text-slate-500 mt-1">
                  Try changing the assigned driver or expanding the date range filter above.
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
                          checked={selectedDriverTripIds.length === filteredDriverTrips.length && filteredDriverTrips.length > 0}
                          onChange={() => handleSelectAllDriverTrips(filteredDriverTrips)}
                          className="rounded text-blue-600"
                        />
                      </th>
                      <th className="py-3 px-3">Date & Time</th>
                      <th className="py-3 px-3">Trip ID</th>
                      <th className="py-3 px-3">Driver & Vehicle</th>
                      <th className="py-3 px-3">Guest & Route</th>
                      <th className="py-3 px-3 text-right">Driver Pay</th>
                      <th className="py-3 px-3 text-right">Expenses Reimbursed</th>
                      <th className="py-3 px-3 text-right">Guest Cash Collected</th>
                      <th className="py-3 px-3 text-right">Net Trip Balance</th>
                      <th className="py-3 px-3 text-center">Settlement Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDriverTrips.map(t => {
                      const isSelected = selectedDriverTripIds.includes(t.id);
                      const pay = Number((t as any).effective_driver_pay ?? t.driver_trip_pay_override ?? t.driver_charge ?? 0);
                      const exp = Number((t as any).total_trip_expenses || 0);
                      const coll = Number((t as any).collected_by_driver || 0);
                      const rep = (t as any).driver_report;
                      const diesel = Number(rep?.diesel_expense || 0);
                      const toll = Number(rep?.parking_toll_permits_tickets_food || 0);
                      const ws = Number(rep?.workshop_expense || 0);
                      const netTripImpact = (pay + exp) - coll;
                      const isSettled = t.driver_settlement_status === 'Settled';

                      return (
                        <tr
                          key={t.id}
                          className={`transition-colors ${isSelected ? 'bg-blue-50/40' : 'hover:bg-slate-50/60'}`}
                        >
                          <td className="py-3 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleDriverTripSelection(t.id)}
                              className="rounded text-blue-600"
                            />
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap">
                            <p className="font-bold text-slate-900">{formatDate(t.trip_date)}</p>
                            <p className="text-[11px] text-slate-500 font-mono">{formatTime(t.pickup_time)}</p>
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="font-mono font-bold text-blue-900 block">{t.trip_number}</span>
                            <span className="text-[10px] text-slate-500">{t.trip_category || 'Transfer'}</span>
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap">
                            <p className="font-bold text-slate-900 flex items-center gap-1">
                              <span>👨‍✈️</span>
                              <span>{t.driver?.full_name || 'Driver'}</span>
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono">
                              {t.vehicle?.registration_number ? `${t.vehicle.registration_number} (${t.vehicle.vehicle_type || 'Cab'})` : (t.required_cab_type || 'Cab')}
                            </p>
                          </td>

                          <td className="py-3 px-3 max-w-[220px]">
                            <p className="font-bold text-slate-900 truncate" title={t.guest_names || 'Guest'}>
                              {t.guest_names || 'Guest'}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate" title={`${t.pickup_location} → ${t.dropoff_location || t.destination}`}>
                              {t.pickup_location} → {t.dropoff_location || t.destination}
                            </p>
                          </td>

                          {/* Driver Pay */}
                          <td className="py-3 px-3 text-right font-mono whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="font-bold text-blue-700 text-sm">{formatINR(pay)}</span>
                              <button
                                type="button"
                                onClick={() => handleQuickUpdateDriverPay(t.id, t.trip_number, pay)}
                                className="p-1 rounded hover:bg-blue-100 text-slate-400 hover:text-blue-700 transition-colors"
                                title="Edit Driver Pay"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                            {(t.special_instructions || '').includes('Settle Later') && pay === 0 && (
                              <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 block">
                                Settle Later
                              </span>
                            )}
                          </td>

                          {/* Running Expenses */}
                          <td className="py-3 px-3 text-right font-mono whitespace-nowrap">
                            {exp > 0 ? (
                              <div>
                                <span className="font-bold text-sky-700 text-sm">{formatINR(exp)}</span>
                                <span className="block text-[10px] text-slate-400" title={`Diesel: ₹${diesel}, Toll: ₹${toll}, WS: ₹${ws}`}>
                                  {diesel > 0 ? `Fuel: ₹${diesel}` : ''}{toll > 0 ? ` + Toll: ₹${toll}` : ''}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-mono">₹0</span>
                            )}
                          </td>

                          {/* Guest Cash Collected */}
                          <td className="py-3 px-3 text-right font-mono whitespace-nowrap">
                            {coll > 0 ? (
                              <span className="font-bold text-amber-700 text-sm">{formatINR(coll)}</span>
                            ) : (
                              <span className="text-slate-400 font-mono">₹0 (Prepaid)</span>
                            )}
                          </td>

                          {/* Net Trip Balance */}
                          <td className="py-3 px-3 text-right font-mono whitespace-nowrap font-black text-sm">
                            <span className={netTripImpact >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                              {netTripImpact >= 0 ? `+${formatINR(netTripImpact)}` : `-${formatINR(Math.abs(netTripImpact))}`}
                            </span>
                          </td>

                          {/* Interactive Driver Settled / Not Settled Button */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleToggleSingleDriverSettlement(t.id, t.driver_settlement_status)}
                              disabled={togglingSettlementId === t.id}
                              className={`px-3 py-1 rounded-full text-[11px] font-extrabold transition-all border inline-flex items-center gap-1 shadow-2xs active:scale-95 ${
                                isSettled
                                  ? 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600'
                                  : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                              }`}
                              title={isSettled ? 'Click to mark as Not Settled' : 'Click to mark as Driver Settled'}
                            >
                              {isSettled ? '✓ Driver Settled' : '⏳ Not Settled'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t font-mono font-bold">
                    <tr>
                      <td colSpan={5} className="py-3 px-3 font-sans font-bold text-slate-800 text-right">
                        Selected Subtotals ({selectedDriverTripsList.length} rides):
                      </td>
                      <td className="py-3 px-3 text-right text-blue-700 text-sm">
                        {formatINR(driverTotalWages)}
                      </td>
                      <td className="py-3 px-3 text-right text-sky-700 text-sm">
                        {formatINR(driverTotalExpenses)}
                      </td>
                      <td className="py-3 px-3 text-right text-amber-700 text-sm">
                        {formatINR(driverGuestCashCollected)}
                      </td>
                      <td className="py-3 px-3 text-right text-sm">
                        <span className={driverGrossCredit - driverGuestCashCollected >= 0 ? 'text-emerald-700 font-black' : 'text-rose-700 font-black'}>
                          {formatINR(driverGrossCredit - driverGuestCashCollected)}
                        </span>
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
      {/* TAB 3: ISSUED INVOICES ARCHIVE                                  */}
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
      {/* MODAL 2: DRIVER SETTLEMENT INVOICE / PAYMENT VOUCHER           */}
      {/* ============================================================== */}
      {previewDriverInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto space-y-6 border border-slate-100">
            {/* Header */}
            <div className="flex items-start justify-between border-b pb-4 flex-wrap gap-3">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">VILLALEMON PICKUP</h2>
                <p className="text-xs text-slate-500 font-medium">Driver Periodic Settlement Voucher & Payment Statement</p>
                <p className="text-[11px] text-slate-400">Temple Road, Varkala, Kerala • Fleet Operations</p>
              </div>
              <div className="text-right">
                <span className="font-mono font-black text-blue-900 text-lg sm:text-xl block">
                  {previewDriverInvoice.invoiceNumber}
                </span>
                <p className="text-xs text-slate-500">Date: {formatDate(previewDriverInvoice.invoiceDate)}</p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 ${
                  previewDriverInvoice.netSettlement >= 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {previewDriverInvoice.netSettlement >= 0 ? 'OFFICE PAYS DRIVER' : 'DRIVER REFUNDS OFFICE'}
                </span>
              </div>
            </div>

            {/* Driver Information & Period */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Driver Details</span>
                <p className="text-base font-black text-slate-900">
                  {previewDriverInvoice.driver?.full_name || 'Driver'}
                </p>
                <p className="text-slate-600 font-mono">Mobile: {previewDriverInvoice.driver?.phone || 'Not given'}</p>
                {previewDriverInvoice.driver?.driving_licence_no && (
                  <p className="text-slate-500 font-mono text-[11px]">License: {previewDriverInvoice.driver.driving_licence_no}</p>
                )}
                <p className="text-slate-500 text-[11px]">Type: {previewDriverInvoice.driver?.employment_type || 'Per-trip payment'}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Settlement Period</span>
                <p className="text-base font-black text-slate-900">
                  {previewDriverInvoice.periodFrom && previewDriverInvoice.periodTo
                    ? `${formatDate(previewDriverInvoice.periodFrom)} → ${formatDate(previewDriverInvoice.periodTo)}`
                    : 'Batch Settlement (All Dates)'}
                </p>
                <p className="text-slate-600 font-semibold">Total Rides Included: {previewDriverInvoice.trips.length}</p>
                <p className="text-[11px] text-slate-500">Status: {previewDriverInvoice.trips.every(t => t.driver_settlement_status === 'Settled') ? 'All Rides Settled' : 'Contains Pending Rides'}</p>
              </div>
            </div>

            {/* Accounting Voucher Breakdown Box */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Financial Accounting Summary</span>

              <div className="space-y-1.5 font-mono">
                <div className="flex justify-between text-slate-700">
                  <span>1. Driver Wages / Duty Pay (+):</span>
                  <span className="font-bold text-blue-700 text-sm">{formatINR(previewDriverInvoice.totalWages)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>2. Running Expenses Reimbursed (Diesel, Toll, WS) (+):</span>
                  <span className="font-bold text-sky-700 text-sm">{formatINR(previewDriverInvoice.totalExpenses)}</span>
                </div>
                <div className="flex justify-between text-purple-900 font-black pt-1 border-t border-slate-200 text-sm">
                  <span>GROSS DRIVER CREDIT (A = 1 + 2):</span>
                  <span>{formatINR(previewDriverInvoice.grossCredit)}</span>
                </div>
                <div className="flex justify-between text-amber-800 pt-1">
                  <span>3. Less: Cash Collected from Guests (-):</span>
                  <span className="font-bold">-{formatINR(previewDriverInvoice.guestCashCollected)}</span>
                </div>
                {previewDriverInvoice.priorLedgerCashHeld > 0 ? (
                  <>
                    <div className="flex justify-between text-amber-800">
                      <span>4. Less: Prior Advance / Ledger Deduction (-):</span>
                      <span className="font-bold">-{formatINR(previewDriverInvoice.priorLedgerCashHeld)}</span>
                    </div>
                    <div className="flex justify-between text-amber-950 font-bold pt-1 border-t border-slate-200">
                      <span>TOTAL DEDUCTIONS (B = 3 + 4):</span>
                      <span>-{formatINR(previewDriverInvoice.guestCashCollected + previewDriverInvoice.priorLedgerCashHeld)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-amber-950 font-bold pt-1 border-t border-slate-200">
                    <span>TOTAL DEDUCTIONS (B = 3):</span>
                    <span>-{formatINR(previewDriverInvoice.guestCashCollected)}</span>
                  </div>
                )}
              </div>

              {/* Big Bold Final Settlement Banner */}
              <div className={`p-4 rounded-xl mt-3 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                previewDriverInvoice.netSettlement >= 0
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-700'
                  : 'bg-gradient-to-r from-amber-600 to-rose-700'
              }`}>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest block text-white/80">
                    FINAL NET SETTLEMENT FIGURE (A − B)
                  </span>
                  <span className="text-lg font-black block">
                    {previewDriverInvoice.netSettlement >= 0
                      ? 'AMOUNT TO BE PAID BY OFFICE TO DRIVER'
                      : 'AMOUNT DRIVER NEEDS TO RETURN TO OFFICE'}
                  </span>
                  <span className="text-xs text-white/80 block mt-0.5">
                    {previewDriverInvoice.netSettlement >= 0
                      ? 'Driver receives this balance payment from office via Cash / Bank transfer'
                      : 'Guest collections exceed wages & fuel; driver refunds this surplus to office'}
                  </span>
                </div>
                <div className="text-right sm:border-l sm:border-white/20 sm:pl-4">
                  <span className="text-3xl font-black font-mono block">
                    {formatINR(Math.abs(previewDriverInvoice.netSettlement))}
                  </span>
                </div>
              </div>
            </div>

            {/* Itemized Ride Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Itemized Duty Breakdown ({previewDriverInvoice.trips.length} Rides)
              </h4>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b font-semibold text-[10px] uppercase">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Trip ID</th>
                      <th className="py-2.5 px-3">Guest & Route</th>
                      <th className="py-2.5 px-3 text-right">Pay</th>
                      <th className="py-2.5 px-3 text-right">Fuel & Exp</th>
                      <th className="py-2.5 px-3 text-right">Collected</th>
                      <th className="py-2.5 px-3 text-right">Net Impact</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewDriverInvoice.trips.map((t, idx) => {
                      const pay = Number((t as any).effective_driver_pay ?? t.driver_trip_pay_override ?? t.driver_charge ?? 0);
                      const exp = Number((t as any).total_trip_expenses || 0);
                      const coll = Number((t as any).collected_by_driver || 0);
                      const net = (pay + exp) - coll;

                      return (
                        <tr key={t.id} className="hover:bg-slate-50/60 font-mono text-[11px]">
                          <td className="py-2 px-3 text-slate-400 font-sans">{idx + 1}</td>
                          <td className="py-2 px-3 font-sans whitespace-nowrap">{formatDate(t.trip_date)}</td>
                          <td className="py-2 px-3 font-bold text-blue-900 whitespace-nowrap">{t.trip_number}</td>
                          <td className="py-2 px-3 font-sans text-slate-800 max-w-[200px] truncate" title={`${t.guest_names || 'Guest'} (${t.pickup_location} → ${t.dropoff_location || t.destination})`}>
                            <strong>{t.guest_names || 'Guest'}</strong>: {t.pickup_location} → {t.dropoff_location || t.destination}
                          </td>
                          <td className="py-2 px-3 text-right text-blue-700 font-bold">{formatINR(pay)}</td>
                          <td className="py-2 px-3 text-right text-sky-700">{formatINR(exp)}</td>
                          <td className="py-2 px-3 text-right text-amber-700">{formatINR(coll)}</td>
                          <td className={`py-2 px-3 text-right font-black ${net >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {net >= 0 ? `+${formatINR(net)}` : `-${formatINR(Math.abs(net))}`}
                          </td>
                          <td className="py-2 px-3 text-center font-sans">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              t.driver_settlement_status === 'Settled'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {t.driver_settlement_status === 'Settled' ? 'Settled' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t font-mono font-bold text-xs">
                    <tr>
                      <td colSpan={4} className="py-2.5 px-3 font-sans text-right">Totals:</td>
                      <td className="py-2.5 px-3 text-right text-blue-700">{formatINR(previewDriverInvoice.totalWages)}</td>
                      <td className="py-2.5 px-3 text-right text-sky-700">{formatINR(previewDriverInvoice.totalExpenses)}</td>
                      <td className="py-2.5 px-3 text-right text-amber-700">{formatINR(previewDriverInvoice.guestCashCollected)}</td>
                      <td className={`py-2.5 px-3 text-right font-black ${previewDriverInvoice.grossCredit - previewDriverInvoice.guestCashCollected >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {formatINR(previewDriverInvoice.grossCredit - previewDriverInvoice.guestCashCollected)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Signature Blocks */}
            <div className="pt-6 border-t grid grid-cols-2 gap-8 text-center text-xs">
              <div>
                <div className="h-12 border-b border-dashed border-slate-300"></div>
                <p className="mt-2 font-bold text-slate-800">Received / Acknowledged By (Driver)</p>
                <p className="text-[10px] text-slate-400 font-mono">{previewDriverInvoice.driver?.full_name || 'Driver Signature'}</p>
              </div>
              <div>
                <div className="h-12 border-b border-dashed border-slate-300"></div>
                <p className="mt-2 font-bold text-slate-800">Authorized Fleet Manager</p>
                <p className="text-[10px] text-slate-400">VILLALEMON PICKUP Varkala</p>
              </div>
            </div>

            {/* Actions Toolbar */}
            <div className="flex items-center justify-between pt-3 border-t flex-wrap gap-2">
              <a
                href={formatWhatsAppShareUrl(
                  previewDriverInvoice.driver?.phone,
                  generateDriverWhatsAppSettlement(
                    previewDriverInvoice.driver,
                    previewDriverInvoice.trips,
                    previewDriverInvoice.totalWages,
                    previewDriverInvoice.totalExpenses,
                    previewDriverInvoice.grossCredit,
                    previewDriverInvoice.guestCashCollected,
                    previewDriverInvoice.priorLedgerCashHeld,
                    previewDriverInvoice.netSettlement,
                    previewDriverInvoice.periodFrom,
                    previewDriverInvoice.periodTo,
                    previewDriverInvoice.invoiceNumber
                  )
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm transition-transform active:scale-95"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Share Voucher on WhatsApp</span>
              </a>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm transition-transform active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Voucher</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDriverInvoice(null)}
                  className="btn-secondary text-xs px-4 py-2"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: SAVE AS FORMAL INVOICE MODAL                          */}
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
