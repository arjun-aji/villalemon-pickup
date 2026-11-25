import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Car,
  Plus,
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  Clock,
  UserCheck,
  ChevronRight,
  Send,
  Eye,
  Copy,
  Check,
  Phone,
  Plane,
  Receipt,
  IndianRupee,
  MessageSquare,
  Share2,
  Printer,
  Building2,
  FileText,
  FileSpreadsheet,
  Download,
  Fuel,
  TrendingUp,
  Wallet,
  Edit2,
  Trash2,
  UserPlus,
  Link as LinkIcon,
  Globe,
} from 'lucide-react';
import { tripService } from '../../services/tripService';
import { driverService } from '../../services/driverService';
import { vehicleService } from '../../services/adminOperationsService';
import { excelExportService } from '../../services/excelExportService';
import { Trip, DriverEmployee, TripStatus, Vehicle } from '../../types';
import StatusBadge from '../../components/ui/StatusBadge';
import SearchInput from '../../components/ui/SearchInput';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  formatINR,
  formatDate,
  formatTime,
  generateDriverDispatchMessage,
  getTripDayHighlight,
  sortTripsUpcomingFirst as sortUpcomingTripsOrder,
  cleanSpecialInstructions,
} from '../../utils/formatters';

const TripsPage: React.FC = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [drivers, setDrivers] = useState<DriverEmployee[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [togglingSettlementTripId, setTogglingSettlementTripId] = useState<string | null>(null);

  // View Mode: 'trip_sheet' (Excel replica) or 'standard'
  const [viewMode, setViewMode] = useState<'trip_sheet' | 'standard'>('trip_sheet');

  // Trip Sheet specific filters (mirroring Excel Row 5-8)
  const [tripSheetDriver, setTripSheetDriver] = useState('');
  const [tripSheetStartDate, setTripSheetStartDate] = useState('2026-11-01');
  const [tripSheetDays, setTripSheetDays] = useState(100);
  const [tripSheetTripId, setTripSheetTripId] = useState('');

  // Standard Filters
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'in_progress' | 'completed'>('all');
  const [search, setSearch] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals
  const [assignModalTrip, setAssignModalTrip] = useState<Trip | null>(null);
  const [assignType, setAssignType] = useState<'fleet' | 'outside'>('fleet');
  const [selectedAssignDriverId, setSelectedAssignDriverId] = useState('');
  const [assignOutsideName, setAssignOutsideName] = useState('');
  const [assignOutsidePhone, setAssignOutsidePhone] = useState('');
  const [assignOutsideVeh, setAssignOutsideVeh] = useState('');
  const [viewTrip, setViewTrip] = useState<Trip | null>(null);
  const [dispatchTrip, setDispatchTrip] = useState<Trip | null>(null);
  const [tripSheetTrip, setTripSheetTrip] = useState<Trip | null>(null);
  const [copiedPlacard, setCopiedPlacard] = useState(false);
  const [copiedDispatch, setCopiedDispatch] = useState(false);
  const [copiedBookingLink, setCopiedBookingLink] = useState(false);

  // Complete Trip by Admin Modal State
  const [completeModalTrip, setCompleteModalTrip] = useState<Trip | null>(null);
  const [completeDriverId, setCompleteDriverId] = useState('');
  const [completeAmountCollected, setCompleteAmountCollected] = useState<number | string>(0);
  const [completeDiesel, setCompleteDiesel] = useState<number | string>(0);
  const [completeParkingToll, setCompleteParkingToll] = useState<number | string>(0);
  const [completeTollDetails, setCompleteTollDetails] = useState('');
  const [completeWorkshop, setCompleteWorkshop] = useState<number | string>(0);
  const [completeWorkshopDetails, setCompleteWorkshopDetails] = useState('');
  const [completeDriverPay, setCompleteDriverPay] = useState<number | string>(500);
  const [completeDriverSettled, setCompleteDriverSettled] = useState(false);
  const [completeAdminNotes, setCompleteAdminNotes] = useState('');
  const [completingTrip, setCompletingTrip] = useState(false);

  // Edit Trip Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [savingTrip, setSavingTrip] = useState(false);
  const [editForm, setEditForm] = useState({
    trip_date: '',
    pickup_time: '',
    trip_category: 'Airport Pick-up' as string,
    guest_names: '',
    guest_contact_number: '',
    total_people: 1,
    pickup_location: '',
    dropoff_location: '',
    final_dropoff: '',
    airport_terminal: 'Terminal 2' as string,
    flight_number_and_time: '',
    required_cab_type: 'Sedan' as string,
    special_instructions: '',
    assigned_driver_id: '',
    assigned_vehicle_id: '',
    trip_selling_price: 0,
    amount_driver_must_collect: 0,
    collection_rule: 'Collect from guest' as string,
    driver_trip_pay_override: 0,
    trip_status: 'Confirmed' as string,
  });

  const renderCategoryBadge = (category?: string) => {
    const cat = (category || 'Others').trim();
    const catLower = cat.toLowerCase();
    if (catLower.includes('pick-up') || catLower.includes('pickup')) {
      return (
        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-sky-100 text-sky-800 border border-sky-300">
          ✈️ {cat}
        </span>
      );
    }
    if (catLower.includes('drop')) {
      return (
        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-300">
          🛫 {cat}
        </span>
      );
    }
    if (catLower.includes('sightseeing') || catLower.includes('tour')) {
      return (
        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
          🏖️ {cat}
        </span>
      );
    }
    return (
      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-teal-100 text-teal-800 border border-teal-300">
        🚗 {cat}
      </span>
    );
  };

  const handleOpenEditTrip = (t: Trip) => {
    setEditingTrip(t);
    setEditForm({
      trip_date: t.trip_date || t.pickup_date || '',
      pickup_time: t.pickup_time || '10:00',
      trip_category: t.trip_category || 'Airport Pick-up',
      guest_names: t.guest_names || t.customer_name || '',
      guest_contact_number: t.guest_contact_number || t.customer_phone || '',
      total_people: t.total_people || t.num_passengers || 1,
      pickup_location: t.pickup_location || '',
      dropoff_location: t.dropoff_location || t.destination || '',
      final_dropoff: t.final_dropoff || '',
      airport_terminal: (t.airport_terminal as string) || 'Terminal 2',
      flight_number_and_time: t.flight_number_and_time || t.flight_number || '',
      required_cab_type: (t.required_cab_type as string) || (t.vehicle?.vehicle_type as string) || 'Sedan',
      special_instructions: t.special_instructions || t.trip_notes || '',
      assigned_driver_id: t.assigned_driver_id || '',
      assigned_vehicle_id: t.assigned_vehicle_id || '',
      trip_selling_price: Number(t.trip_selling_price || t.amount_to_collect || 0),
      amount_driver_must_collect: Number(t.amount_driver_must_collect || t.amount_to_collect || 0),
      collection_rule: (t.collection_rule as string) || (Number(t.amount_driver_must_collect) > 0 ? 'Collect from guest' : 'Do not collect'),
      driver_trip_pay_override: Number(t.driver_trip_pay_override || t.driver_charge || 0),
      trip_status: (t.trip_status as string) || 'Confirmed',
    });
    setIsEditModalOpen(true);
  };

  const handleSaveTripEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrip) return;
    try {
      setSavingTrip(true);
      await tripService.updateTrip(editingTrip.id, {
        trip_date: editForm.trip_date,
        pickup_time: editForm.pickup_time,
        trip_category: editForm.trip_category as any,
        guest_names: editForm.guest_names,
        guest_contact_number: editForm.guest_contact_number || undefined,
        total_people: Number(editForm.total_people) || 1,
        pickup_location: editForm.pickup_location,
        dropoff_location: editForm.dropoff_location,
        final_dropoff: editForm.final_dropoff || undefined,
        airport_terminal: editForm.airport_terminal as any,
        flight_number_and_time: editForm.flight_number_and_time || undefined,
        required_cab_type: editForm.required_cab_type as any,
        special_instructions: editForm.special_instructions || undefined,
        assigned_driver_id: editForm.assigned_driver_id || undefined,
        assigned_vehicle_id: editForm.assigned_vehicle_id || undefined,
        trip_selling_price: Number(editForm.trip_selling_price) || 0,
        amount_driver_must_collect: editForm.collection_rule === 'Do not collect' ? 0 : (Number(editForm.amount_driver_must_collect) || 0),
        collection_rule: editForm.collection_rule as any,
        driver_trip_pay_override: Number(editForm.driver_trip_pay_override) || 0,
        trip_status: editForm.trip_status as any,
      });
      setIsEditModalOpen(false);
      setEditingTrip(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error updating trip');
    } finally {
      setSavingTrip(false);
    }
  };

  const handleDeleteTrip = async (t: Trip) => {
    if (!confirm(`Are you sure you want to delete trip ${t.trip_number || ''} for ${t.guest_names || t.customer_name || 'Guest'}? This action cannot be undone.`)) {
      return;
    }
    try {
      await tripService.deleteTrip(t.id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error deleting trip');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allTrips, allDrivers, allVehicles] = await Promise.all([
        tripService.getAll(),
        driverService.getAll(),
        vehicleService.getAll(),
      ]);
      setTrips(allTrips);
      setDrivers(allDrivers);
      setVehicles(allVehicles);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePromptSetDriverPay = async (tripId: string, tripNumber?: string, currentVal?: number) => {
    const input = window.prompt(
      `Enter driver settlement wage / payment for trip ${tripNumber || ''} (₹):`,
      currentVal ? String(currentVal) : '800'
    );
    if (input === null) return;
    const amount = parseFloat(input);
    if (isNaN(amount) || amount < 0) {
      alert('Please enter a valid amount');
      return;
    }
    try {
      await tripService.updateTripDriverPay(tripId, amount);
      const updated = await tripService.getAll();
      setTrips(updated);
      if (viewTrip && viewTrip.id === tripId) {
        setViewTrip({
          ...viewTrip,
          driver_trip_pay_override: amount,
          driver_charge: amount,
          special_instructions: (viewTrip.special_instructions || '').replace(/\[DRIVER_PAY_STATUS:[^\]]*\]/gi, '').trim(),
        });
      }
    } catch (err: any) {
      alert(err.message || 'Error updating driver pay');
    }
  };

  const handleToggleDriverSettlement = async (trip: Trip) => {
    const nextStatus = trip.driver_settlement_status === 'Settled' ? 'Not Settled' : 'Settled';
    try {
      setTogglingSettlementTripId(trip.id);
      await tripService.updateDriverSettlementStatus(trip.id, nextStatus);
      setTrips(prev => prev.map(t => t.id === trip.id ? { ...t, driver_settlement_status: nextStatus } : t));
      if (viewTrip && viewTrip.id === trip.id) {
        setViewTrip({
          ...viewTrip,
          driver_settlement_status: nextStatus,
        });
      }
    } catch (err: any) {
      alert(err.message || 'Error updating driver settlement status');
    } finally {
      setTogglingSettlementTripId(null);
    }
  };

  const handleOpenCompleteModal = (t: Trip) => {
    setCompleteModalTrip(t);
    setCompleteDriverId(t.assigned_driver_id || '');

    // Default collection:
    const isPrepaid = (t.collection_rule || '').toLowerCase().includes('do not collect') ||
                      (t.trip_selling_price && Number(t.amount_driver_must_collect) === 0);
    const defaultCollect = isPrepaid ? 0 : Number(t.amount_driver_must_collect ?? t.amount_to_collect ?? 0);
    setCompleteAmountCollected(defaultCollect);

    // Existing report if any:
    const rep = (t as any).driver_reports
      ? (Array.isArray((t as any).driver_reports) ? (t as any).driver_reports[0] : (t as any).driver_reports)
      : null;

    setCompleteDiesel(rep?.diesel_expense || t.settlement?.petrol_expense || 0);
    setCompleteParkingToll(rep?.parking_toll_permits_tickets_food || 0);
    setCompleteTollDetails(rep?.other_expenses_details || '');
    setCompleteWorkshop(rep?.workshop_expense || 0);
    setCompleteWorkshopDetails(rep?.workshop_details || '');

    const effPay = Number(
      t.driver_trip_pay_override ??
      t.driver_charge ??
      (t.driver?.employment_type === 'Per-trip payment' ? t.driver?.per_trip_payment : 500) ??
      500
    );
    setCompleteDriverPay(effPay);
    setCompleteDriverSettled(t.driver_settlement_status === 'Settled');
    setCompleteAdminNotes('Completed by Admin on behalf of driver');
  };

  const handleCompleteTripSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeModalTrip) return;
    try {
      setCompletingTrip(true);
      await tripService.completeTripByAdmin({
        tripId: completeModalTrip.id,
        driverId: completeDriverId || completeModalTrip.assigned_driver_id,
        amountCollected: Number(completeAmountCollected) || 0,
        dieselExpense: Number(completeDiesel) || 0,
        parkingTollExpense: Number(completeParkingToll) || 0,
        otherDetails: completeTollDetails.trim() || undefined,
        workshopExpense: Number(completeWorkshop) || 0,
        workshopDetails: completeWorkshopDetails.trim() || undefined,
        driverPay: Number(completeDriverPay) || 0,
        isDriverSettled: completeDriverSettled,
        adminNotes: completeAdminNotes.trim() || undefined,
      });

      alert(`Trip ${completeModalTrip.trip_number} successfully marked as Completed!`);
      setCompleteModalTrip(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error completing trip');
    } finally {
      setCompletingTrip(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExportingExcel(true);
      const blob = await excelExportService.exportFullWorkbook();
      const filename = `Varkala_Holidays_Taxi_System_${new Date().toISOString().slice(0, 10)}.xlsx`;
      excelExportService.downloadBlob(blob, filename);
    } catch (e: any) {
      alert(e.message || 'Failed to export Excel workbook');
    } finally {
      setExportingExcel(false);
    }
  };

  const handleAssignDriver = async () => {
    if (!assignModalTrip) return;
    try {
      if (assignType === 'outside') {
        if (!assignOutsideName.trim() || !assignOutsideVeh.trim()) {
          alert('Please enter outside driver name and vehicle registration number');
          return;
        }
        await tripService.assignOutsideDriver(
          assignModalTrip.id,
          assignOutsideName.trim(),
          assignOutsideVeh.trim(),
          assignOutsidePhone.trim() || undefined
        );
      } else {
        if (!selectedAssignDriverId) return;
        await tripService.assignDriver(assignModalTrip.id, selectedAssignDriverId);
      }
      setAssignModalTrip(null);
      setAssignOutsideName('');
      setAssignOutsidePhone('');
      setAssignOutsideVeh('');
      loadData();
    } catch (e: any) {
      alert(e.message || 'Failed to assign driver');
    }
  };

  const handlePublishForEnrollment = async (tripId: string) => {
    try {
      await tripService.publishForEnrollment(tripId);
      loadData();
    } catch (e: any) {
      alert(e.message || 'Failed to publish trip');
    }
  };

  const handleCopyPlacard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPlacard(true);
    setTimeout(() => setCopiedPlacard(false), 2000);
  };

  const generateWhatsAppText = (t: Trip) => {
    return generateDriverDispatchMessage({
      tripNumber: t.trip_number,
      tripCategory: t.trip_category,
      tripDate: t.trip_date || t.pickup_date,
      pickupTime: t.pickup_time,
      pickupLocation: t.pickup_location,
      dropoffLocation: t.dropoff_location || t.destination,
      finalDropoff: t.final_dropoff,
      guestNames: t.guest_names || t.customer_name,
      guestContact: t.guest_contact_number || t.customer_phone,
      totalPeople: t.total_people || t.num_passengers,
      flightNumberAndTime: t.flight_number_and_time || t.flight_number,
      airportTerminal: t.airport_terminal,
      placardText: t.placard_text,
      requiredCabType: t.required_cab_type,
      vehicleReg: t.vehicle?.registration_number,
      driverName: t.driver?.full_name,
      specialInstructions: cleanSpecialInstructions(t.special_instructions || t.trip_notes),
    });
  };

  const handleCopyDispatch = (t: Trip) => {
    navigator.clipboard.writeText(generateWhatsAppText(t));
    setCopiedDispatch(true);
    setTimeout(() => setCopiedDispatch(false), 2000);
  };

  const handleShareWhatsApp = (t: Trip) => {
    const text = generateWhatsAppText(t);
    const phone = t.driver?.phone ? t.driver.phone.replace(/[^0-9]/g, '') : '';
    const url = phone
      ? `https://wa.me/${phone.startsWith('91') ? phone : '91' + phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleApproveTrip = async (tripId: string) => {
    try {
      await tripService.updateStatus(tripId, 'Confirmed');
      loadData();
    } catch (e: any) {
      alert(e.message || 'Error approving trip');
    }
  };

  // Status normalizer helper (e.g. 'Assigned' -> 'assigned', 'Pending Approval' -> 'pending_approval')
  const getNormStatus = (status?: string) => (status || '').toLowerCase().replace(/[\s-]+/g, '_');

  // Filtered trips for Standard View (ordered: upcoming/today trips first chronologically, past trips sink to bottom)
  const filteredTrips = trips
    .filter(trip => {
      const s = getNormStatus(trip.trip_status);
      if (activeTab === 'upcoming' && !['upcoming', 'assigned', 'confirmed', 'pending_approval', 'available_for_enrollment', 'open_for_enrollment'].includes(s)) {
        return false;
      }
      if (activeTab === 'in_progress' && s !== 'in_progress') {
        return false;
      }
      if (activeTab === 'completed' && s !== 'completed') {
        return false;
      }

      if (selectedDriver && trip.assigned_driver_id !== selectedDriver) {
        return false;
      }

      if (selectedStatus && s !== getNormStatus(selectedStatus)) {
        return false;
      }

      if (search) {
        const q = search.toLowerCase();
        const matchNumber = (trip.trip_number || '').toLowerCase().includes(q);
        const matchCustomer = (trip.customer_name || trip.guest_names || '').toLowerCase().includes(q);
        const matchDriver = (trip.driver?.full_name || '').toLowerCase().includes(q);
        const matchLocation = (trip.pickup_location || '').toLowerCase().includes(q);
        const matchDest = (trip.destination || trip.dropoff_location || '').toLowerCase().includes(q);
        return matchNumber || matchCustomer || matchDriver || matchLocation || matchDest;
      }

      return true;
    })
    .sort(sortUpcomingTripsOrder);

  // Summary financial calculations for Classic Table View
  const classicMetrics = filteredTrips.reduce(
    (acc, trip) => {
      const s = trip.settlement;
      const rep = (trip as any).driver_reports
        ? Array.isArray((trip as any).driver_reports)
          ? (trip as any).driver_reports[0]
          : (trip as any).driver_reports
        : null;
      const petrol = Number(rep?.diesel_expense ?? s?.petrol_expense ?? 0);
      const foodToll = Number(rep?.parking_toll_permits_tickets_food ?? 0);
      const workshop = Number(rep?.workshop_expense ?? s?.other_expenses ?? trip.other_fixed_charges ?? 0);
      const other = foodToll + workshop;
      const totalExp = petrol + other;
      const collect = Number(trip.trip_selling_price || trip.amount_driver_must_collect || trip.amount_to_collect || 0);
      const driverPay = Number(trip.driver_trip_pay_override || trip.driver_charge || (trip.driver?.employment_type === 'Per-trip payment' ? trip.driver?.per_trip_payment : 0) || 0);
      const profit = s?.net_profit !== undefined ? s.net_profit : collect - driverPay - totalExp;

      const normSt = (trip.trip_status || '').toLowerCase().replace(/[\s-]+/g, '_');
      const isDone = normSt === 'completed' || Boolean(rep);
      const isPrepaid = trip.collection_rule === 'Do not collect';
      const driverColl = Number(rep?.amount_collected ?? (isPrepaid ? 0 : (trip.amount_driver_must_collect ?? trip.amount_to_collect ?? 0)));
      const returned = isDone ? Math.max(0, driverColl - totalExp - driverPay) : 0;

      acc.totalCollect += collect;
      acc.totalPetrol += petrol;
      acc.totalOther += other;
      acc.totalReturned += returned;
      acc.totalProfit += profit;
      return acc;
    },
    { totalCollect: 0, totalPetrol: 0, totalOther: 0, totalReturned: 0, totalProfit: 0 }
  );

  // Filtered trips for Trip Sheet View (Excel replica mode: ordered with date chronologically)
  const tripSheetTrips = trips
    .filter(trip => {
      // 1. If single trip ID is provided
      if (tripSheetTripId.trim()) {
        return (trip.trip_number || '').toLowerCase().includes(tripSheetTripId.trim().toLowerCase());
      }

      // 2. Driver filter
      if (tripSheetDriver) {
        const matchDriverId = trip.assigned_driver_id === tripSheetDriver;
        const matchDriverName = trip.driver?.full_name?.toLowerCase() === tripSheetDriver.toLowerCase();
        if (!matchDriverId && !matchDriverName) return false;
      }

      // 3. Date range filter
      if (tripSheetStartDate) {
        const tripDateStr = trip.trip_date || trip.pickup_date;
        if (tripDateStr) {
          const tripDate = new Date(tripDateStr);
          const startDate = new Date(tripSheetStartDate);
          const endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + (tripSheetDays || 100));

          if (tripDate < startDate || tripDate > endDate) {
            return false;
          }
        }
      }

      return true;
    })
    .sort(sortUpcomingTripsOrder);

  // End date calculation for Trip Sheet summary banner
  const getTripSheetEndDate = () => {
    const s = new Date(tripSheetStartDate || '2026-11-01');
    s.setDate(s.getDate() + (tripSheetDays > 1 ? tripSheetDays - 1 : 0));
    return s.toISOString().slice(0, 10);
  };

  const allCount = trips.length;
  const pendingApprovalCount = trips.filter(t => getNormStatus(t.trip_status) === 'pending_approval' || t.trip_status === 'Pending Approval').length;
  const upcomingCount = trips.filter(t => ['upcoming', 'assigned', 'confirmed', 'pending_approval', 'available_for_enrollment', 'open_for_enrollment'].includes(getNormStatus(t.trip_status))).length;
  const inProgressCount = trips.filter(t => getNormStatus(t.trip_status) === 'in_progress').length;
  const completedCount = trips.filter(t => getNormStatus(t.trip_status) === 'completed').length;

  return (
    <div className="space-y-5">
      {/* Top Banner & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Varkala Holidays</h1>
            <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              TRIP SHEET
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Taxi & Transport Management System • Live Excel-Style Dispatch & Duty Operations
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Copy Client Booking Link */}
          <button
            onClick={() => {
              const url = `${window.location.origin}/book`;
              navigator.clipboard.writeText(url);
              setCopiedBookingLink(true);
              setTimeout(() => setCopiedBookingLink(false), 2500);
            }}
            className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all"
            title="Copy public booking form link (https://.../book) to send to guests on WhatsApp"
          >
            {copiedBookingLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <LinkIcon className="w-3.5 h-3.5 text-blue-600" />}
            <span>{copiedBookingLink ? 'Booking Link Copied!' : 'Copy Client Form Link'}</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
            <button
              onClick={() => setViewMode('trip_sheet')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'trip_sheet'
                  ? 'bg-navy-primary text-white shadow'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Trip Sheet View</span>
            </button>
            <button
              onClick={() => setViewMode('standard')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'standard'
                  ? 'bg-navy-primary text-white shadow'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Classic Table</span>
            </button>
          </div>

          {/* Quick Export Excel */}
          <button
            onClick={handleExportExcel}
            disabled={exportingExcel}
            className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            title="Download full exact Excel system workbook with Trip Sheet"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{exportingExcel ? 'Exporting...' : 'Export Excel (.xlsx)'}</span>
          </button>

          {/* Add Trip */}
          <button
            onClick={() => navigate('/admin/trips/create')}
            className="btn-primary rounded-xl text-xs py-2 px-3.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add Trip</span>
          </button>
        </div>
      </div>

      {/* Pending Client Booking Requests Alert Banner */}
      {pendingApprovalCount > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-base shadow-sm shrink-0">
              {pendingApprovalCount}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm">
                  {pendingApprovalCount} Direct Client Booking Request{pendingApprovalCount > 1 ? 's' : ''} Awaiting Approval!
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-900 uppercase">
                  Action Required
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                New rides submitted via the client booking form. Review details, set client rate, and assign a driver.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedStatus('Pending Approval');
                setActiveTab('upcoming');
                setViewMode('standard');
              }}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Review Requests</span>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW MODE 1: TRIP SHEET (Exact replica of user's Excel sheet) */}
      {/* ============================================================== */}
      {viewMode === 'trip_sheet' && (
        <div className="space-y-4">
          {/* Filter Card mirroring rows 5-8 from Excel */}
          <div className="bg-white border border-slate-300 rounded-xl p-4 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Driver</label>
                <select
                  value={tripSheetDriver}
                  onChange={e => setTripSheetDriver(e.target.value)}
                  className="w-full bg-[#FFF2CC] border border-amber-300 rounded-lg px-3 py-2 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">All Drivers</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.full_name}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 italic block mt-1">
                  Choose the driver (e.g. Bimal, Monkutty, Arjun)
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Start date</label>
                <input
                  type="date"
                  value={tripSheetStartDate}
                  onChange={e => setTripSheetStartDate(e.target.value)}
                  className="w-full bg-[#FFF2CC] border border-amber-300 rounded-lg px-3 py-2 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <span className="text-[10px] text-slate-400 italic block mt-1">
                  Filter start date (e.g. 01-Nov-2026)
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Number of days</label>
                <input
                  type="number"
                  value={tripSheetDays}
                  onChange={e => setTripSheetDays(Number(e.target.value) || 1)}
                  className="w-full bg-[#FFF2CC] border border-amber-300 rounded-lg px-3 py-2 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <span className="text-[10px] text-slate-400 italic block mt-1">
                  1 = one day, 7 = one week, 100 = full period
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Or one Trip ID (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. VH-0001"
                  value={tripSheetTripId}
                  onChange={e => setTripSheetTripId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono uppercase font-bold text-slate-900 placeholder:normal-case placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-navy-primary"
                />
                <span className="text-[10px] text-slate-400 italic block mt-1">
                  Lookup one specific trip directly
                </span>
              </div>
            </div>

            {/* Row 9 Summary Line */}
            <div className="pt-3 border-t border-slate-200 text-xs font-bold text-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <span>
                  Driver: {tripSheetDriver ? (drivers.find(d => d.id === tripSheetDriver)?.full_name || 'Selected') : 'All Drivers'}
                </span>
                <span className="mx-1.5 text-slate-400">|</span>
                <span>
                  {formatDate(tripSheetStartDate)} to {formatDate(getTripSheetEndDate())}
                </span>
                <span className="mx-1.5 text-slate-400">|</span>
                <span className="text-emerald-700">{tripSheetTrips.length} trip(s)</span>
              </div>
              <span className="text-[11px] text-slate-500 font-normal">
                Shows exact layout & data matching the Excel Trip Sheet
              </span>
            </div>
          </div>

          {/* Trip Sheet Table */}
          <div className="bg-white border border-slate-300 rounded-xl overflow-hidden shadow-card">
            {loading ? (
              <div className="p-16 flex justify-center">
                <LoadingSpinner size="lg" />
              </div>
            ) : tripSheetTrips.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                No trips found for the selected driver and date range.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-sans text-xs">
                  {/* Header Row (Dark Teal #1F4E5F) */}
                  <thead>
                    <tr className="bg-[#1F4E5F] text-white">
                      <th className="py-3 px-3 font-bold text-center border-r border-[#153b49] w-[130px]">
                        Date / Time
                      </th>
                      <th className="py-3 px-3 font-bold text-center border-r border-[#153b49] w-[170px]">
                        Trip ID / Category
                      </th>
                      <th className="py-3 px-3 font-bold text-center border-r border-[#153b49] w-[180px]">
                        Pickup (terminal)
                      </th>
                      <th className="py-3 px-3 font-bold text-center border-r border-[#153b49] w-[240px]">
                        Drop-off / places to visit
                      </th>
                      <th className="py-3 px-3 font-bold text-center border-r border-[#153b49] w-[190px]">
                        Guest / Passengers / Contact
                      </th>
                      <th className="py-3 px-3 font-bold text-center border-r border-[#153b49] w-[170px]">
                        Driver & Vehicle
                      </th>
                      <th className="py-3 px-3 font-bold text-center border-r border-[#153b49] w-[140px]">
                        Collect from guest
                      </th>
                      <th className="py-3 px-3 font-bold text-center border-r border-[#153b49] w-[200px]">
                        Note
                      </th>
                      <th className="py-3 px-3 font-bold text-center w-[125px]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {tripSheetTrips.map(trip => {
                      const dayHighlight = getTripDayHighlight(trip.trip_date || trip.pickup_date);
                      const dateStr = formatDate(trip.trip_date || trip.pickup_date || '');
                      const timeStr = formatTime(trip.pickup_time || '');
                      const flightInfo = trip.flight_number_and_time || trip.flight_number || (trip.trip_category?.toLowerCase().includes('airport') ? 'Nil' : '');
                      const category = trip.trip_category || 'Trip';
                      const guest = trip.guest_names || trip.customer_name || 'Guest';
                      const pax = trip.total_people || trip.num_passengers || 1;
                      const contact = trip.guest_contact_number || trip.customer_phone || 'not given';
                      const pickup = trip.pickup_location || '';
                      const terminal = trip.airport_terminal || (trip.trip_category?.toLowerCase().includes('airport') ? 'NOT SET' : '');
                      const dropoff = trip.dropoff_location || trip.destination || '';
                      const finalDropoff = trip.final_dropoff || 'Return to pickup point';
                      const driverName = trip.driver?.full_name || '';
                      const driverPhone = trip.driver?.phone || '';
                      const isOutside = (trip.driver?.employment_type as string) === 'Outside Driver';
                      const vehicleReg = trip.vehicle?.registration_number || (trip as any).vehicle_reg;
                      const cabType = trip.vehicle?.vehicle_type || trip.required_cab_type || 'Sedan';
                      const collectAmt = Number(trip.amount_driver_must_collect || trip.amount_to_collect || 0);
                      const note = cleanSpecialInstructions(trip.special_instructions) || '-';
                      const effectivePay = Number(trip.driver_trip_pay_override || trip.driver_charge || (trip.driver?.employment_type === 'Per-trip payment' ? trip.driver?.per_trip_payment : 0) || 0);

                      return (
                        <tr
                          key={trip.id}
                          className={`${dayHighlight.rowBgClass} transition-colors align-top`}
                        >
                          {/* Col 1: Date / Time */}
                          <td className="p-3 border-r border-slate-200/80 leading-snug">
                            {dayHighlight.label && (
                              <div className="mb-1">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] ${dayHighlight.badgeClass}`}>
                                  {dayHighlight.label}
                                </span>
                              </div>
                            )}
                            <div className={`font-bold ${dayHighlight.isToday ? 'text-emerald-950 text-sm' : dayHighlight.isTomorrow ? 'text-sky-950' : 'text-slate-900'}`}>{dateStr}</div>
                            <div className={`text-[11px] font-semibold ${dayHighlight.isToday ? 'text-emerald-800' : dayHighlight.isTomorrow ? 'text-sky-800' : 'text-slate-500'}`}>{timeStr}</div>
                          </td>

                          {/* Col 2: Trip ID / Category / Flight */}
                          <td className="p-3 border-r border-slate-200 leading-snug">
                            <div className="font-mono font-bold text-navy-primary">{trip.trip_number}</div>
                            {Boolean(trip.trip_number?.match(/-[A-Z]$/) || trip.special_instructions?.includes('[Convoy:')) && (
                              <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-black border border-purple-200">
                                Convoy Cab {trip.trip_number?.split('-').pop()}
                              </span>
                            )}
                            <div className="mt-1">
                              {renderCategoryBadge(category)}
                            </div>
                            {flightInfo && (
                              <div className="text-blue-700 text-[11px] font-semibold mt-1">
                                Flight: {flightInfo}
                              </div>
                            )}
                            {(category.toLowerCase().includes('airport') || pickup.toLowerCase().includes('airport') || dropoff.toLowerCase().includes('airport')) && (
                              <div className="mt-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-[10px] inline-flex items-center gap-1 shadow-2xs">
                                <span>⚠️</span>
                                <span>Verify terminal with customer</span>
                              </div>
                            )}

                            {trip.organization?.name && (
                              <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
                                  {trip.organization.name}
                                </span>
                                <button
                                  type="button"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    const nextStatus: 'Pending' | 'Paid' = trip.billing_status === 'Paid' ? 'Pending' : 'Paid';
                                    await tripService.updateTripBilling(trip.id, { billingStatus: nextStatus });
                                    loadData();
                                  }}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-transform active:scale-95 ${
                                    trip.billing_status === 'Paid'
                                      ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                                      : 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                                  }`}
                                  title="Click to toggle Bill Pending / Paid"
                                >
                                  {trip.billing_status === 'Paid'
                                    ? '✓ Bill Paid'
                                    : `⏳ Due: ₹${(trip.pending_amount !== undefined ? trip.pending_amount : (trip.trip_selling_price || 0)).toLocaleString('en-IN')}`}
                                </button>
                              </div>
                            )}
                          </td>

                          {/* Col 3: Pickup (terminal) - MOVED BEFORE GUEST */}
                          <td className="p-3 border-r border-slate-200 leading-snug">
                            <div className="font-medium text-slate-900">{pickup}</div>
                            {terminal && (
                              <div className="text-slate-600 text-[11px]">
                                Terminal: <strong className="text-slate-800">{terminal}</strong>
                              </div>
                            )}
                          </td>

                          {/* Col 4: Drop-off / places to visit - MOVED BEFORE GUEST */}
                          <td className="p-3 border-r border-slate-200 leading-snug">
                            {category.toLowerCase().includes('sightseeing') ? (
                              <div>
                                <div className="text-slate-800 font-medium">
                                  Places to visit: <strong>{dropoff}</strong>
                                </div>
                                <div className="text-slate-600 text-[11px] mt-0.5">
                                  Final drop-off: {finalDropoff}
                                </div>
                              </div>
                            ) : (
                              <div className="text-slate-800 font-medium">
                                Drop-off: <strong>{dropoff}</strong>
                              </div>
                            )}
                          </td>

                          {/* Col 5: Guest / Passengers / Contact - PLACED AFTER PICKUP & DROPOFF */}
                          <td className="p-3 border-r border-slate-200 leading-snug">
                            <div className="font-bold text-slate-900">{guest}</div>
                            <div className="text-slate-600 text-[11px]">Passengers: {pax}</div>
                            <div className="text-slate-500 text-[11px]">Contact: {contact}</div>
                          </td>

                          {/* Col 6: Driver & Vehicle */}
                          <td className="p-3 border-r border-slate-200 leading-snug">
                            {driverName ? (
                              <div>
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <span className="text-blue-600 font-bold text-xs">👨‍✈️</span>
                                  <span className="truncate">{driverName}</span>
                                </div>
                                {driverPhone && (
                                  <div className="text-[11px] text-slate-500 font-mono">{driverPhone}</div>
                                )}
                                {isOutside && (
                                  <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 mt-0.5">
                                    Outside Driver
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="text-amber-700 font-bold text-xs flex items-center gap-1">
                                <span className="text-amber-500">⚠️</span> Unassigned
                              </div>
                            )}

                            <div className="mt-1.5 pt-1 border-t border-slate-100">
                              {vehicleReg ? (
                                <div>
                                  <div className="font-mono font-bold text-slate-800 text-xs">{vehicleReg}</div>
                                  <div className="text-slate-500 text-[10px]">({cabType})</div>
                                </div>
                              ) : (
                                <div className="text-slate-600 text-[11px]">
                                  Cab: <span className="font-semibold text-slate-800">{cabType}</span>
                                </div>
                              )}
                              {(trip.special_instructions || '').includes('Settle Later') && effectivePay === 0 && (
                                <div className="mt-1">
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                    ⏳ Pay: Settle Later
                                  </span>
                                </div>
                              )}

                              {trip.assigned_driver_id && (
                                <div className="mt-2 pt-1.5 border-t border-slate-200/80 flex items-center justify-between gap-1 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleDriverSettlement(trip);
                                    }}
                                    disabled={togglingSettlementTripId === trip.id}
                                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold transition-all border inline-flex items-center gap-1 shadow-2xs active:scale-95 ${
                                      trip.driver_settlement_status === 'Settled'
                                        ? 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600'
                                        : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                                    }`}
                                    title={trip.driver_settlement_status === 'Settled' ? 'Click to mark as Not Settled' : 'Click to mark as Driver Settled'}
                                  >
                                    {trip.driver_settlement_status === 'Settled' ? '✓ Settled' : '⏳ Not Settled'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePromptSetDriverPay(trip.id, trip.trip_number, effectivePay);
                                    }}
                                    className="text-[10px] text-blue-600 hover:text-blue-800 font-bold px-1.5 py-0.5 rounded hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-colors"
                                    title="Edit Driver Wage / Pay"
                                  >
                                    {effectivePay > 0 ? `Pay: ₹${effectivePay}` : '+ Enter Pay'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Col 7: Collect from guest */}
                          <td className="p-3 border-r border-slate-200 leading-snug">
                            {collectAmt > 0 ? (
                              <div>
                                <div className="text-emerald-700 font-extrabold text-[11px] uppercase tracking-wide">
                                  COLLECT
                                </div>
                                <div className="font-bold text-slate-900 text-xs">
                                  Rs. {collectAmt.toLocaleString('en-IN')}
                                </div>
                              </div>
                            ) : (
                              <div className="text-slate-500 font-semibold text-xs">
                                Do NOT collect
                              </div>
                            )}
                          </td>

                          {/* Col 8: Note */}
                          <td className="p-3 border-r border-slate-200 text-slate-700 text-[11px] leading-relaxed">
                            {note}
                          </td>

                          {/* Col 9: Actions */}
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {trip.trip_status === 'Pending Approval' && (
                                <button
                                  onClick={() => setAssignModalTrip(trip)}
                                  className="p-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors font-bold shadow-2xs animate-pulse"
                                  title="Review & Assign Driver to Client Booking"
                                >
                                  <UserPlus className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {trip.trip_status !== 'Completed' && (
                                <button
                                  onClick={() => handleOpenCompleteModal(trip)}
                                  className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg transition-colors font-bold shadow-2xs"
                                  title="Complete Ride & Enter Expenses"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenEditTrip(trip)}
                                className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                                title="Edit Trip Details"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setTripSheetTrip(trip)}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                                title="Print Duty Slip / Trip Sheet"
                              >
                                <Printer className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setDispatchTrip(trip)}
                                className="p-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors"
                                title="WhatsApp Dispatch Message"
                              >
                                <MessageSquare className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setViewTrip(trip)}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteTrip(trip)}
                                className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                                title="Delete Trip"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="mt-1 flex justify-center">
                              <StatusBadge status={trip.trip_status} />
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
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW MODE 2: CLASSIC TABLE VIEW */}
      {/* ============================================================== */}
      {viewMode === 'standard' && (
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto scrollbar-hide text-xs font-semibold">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-lg transition-colors ${
                activeTab === 'all'
                  ? 'bg-navy-primary text-white shadow'
                  : 'bg-white text-text-secondary hover:bg-gray-100 border border-border'
              }`}
            >
              All ({allCount})
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-3.5 py-1.5 rounded-lg transition-colors ${
                activeTab === 'upcoming'
                  ? 'bg-navy-primary text-white shadow'
                  : 'bg-white text-text-secondary hover:bg-gray-100 border border-border'
              }`}
            >
              Upcoming ({upcomingCount})
            </button>
            <button
              onClick={() => setActiveTab('in_progress')}
              className={`px-3.5 py-1.5 rounded-lg transition-colors ${
                activeTab === 'in_progress'
                  ? 'bg-navy-primary text-white shadow'
                  : 'bg-white text-text-secondary hover:bg-gray-100 border border-border'
              }`}
            >
              In Progress ({inProgressCount})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-3.5 py-1.5 rounded-lg transition-colors ${
                activeTab === 'completed'
                  ? 'bg-navy-primary text-white shadow'
                  : 'bg-white text-text-secondary hover:bg-gray-100 border border-border'
              }`}
            >
              Completed ({completedCount})
            </button>
          </div>

          {/* Classic View Financial KPI Summary Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Billed</span>
              <span className="text-base font-black text-slate-900 font-mono">{formatINR(classicMetrics.totalCollect)}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-rose-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">Petrol / Fuel Exp</span>
              <span className="text-base font-black text-rose-600 font-mono">-{formatINR(classicMetrics.totalPetrol)}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-amber-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Other (Food/Toll/WS)</span>
              <span className="text-base font-black text-amber-700 font-mono">-{formatINR(classicMetrics.totalOther)}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-emerald-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Returned to Office</span>
              <span className="text-base font-black text-emerald-700 font-mono">+{formatINR(classicMetrics.totalReturned)}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-emerald-300 shadow-2xs bg-gradient-to-br from-emerald-50/40 to-white">
              <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block">Net Total Profit</span>
              <span className="text-base font-black text-emerald-600 font-mono">+{formatINR(classicMetrics.totalProfit)}</span>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="card p-3.5 flex flex-wrap items-center gap-3">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by trip, customer, driver, or location..."
              className="flex-1 min-w-[240px]"
            />

            <select
              value={selectedDriver}
              onChange={e => setSelectedDriver(e.target.value)}
              className="input-field max-w-[180px] text-xs py-2"
            >
              <option value="">All Drivers</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>
                  {d.full_name} ({d.username})
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="input-field max-w-[170px] text-xs py-2"
            >
              <option value="">All Status</option>
              <option value="confirmed">Confirmed / Upcoming</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Trips Table */}
          <div className="card p-0 overflow-hidden shadow-card">
            {loading ? (
              <div className="p-16 flex justify-center">
                <LoadingSpinner size="lg" />
              </div>
            ) : filteredTrips.length === 0 ? (
              <div className="p-12 text-center text-text-secondary text-sm">
                No trips found matching the selected filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-[#F8FAFC]">
                      <th className="table-header">Trip ID</th>
                      <th className="table-header">Customer</th>
                      <th className="table-header">Date & Time</th>
                      <th className="table-header">Route & Cab</th>
                      <th className="table-header">Driver</th>
                      <th className="table-header">Collect</th>
                      <th className="table-header">Petrol Exp</th>
                      <th className="table-header">Other Exp</th>
                      <th className="table-header">Returned Fund</th>
                      <th className="table-header">Total Profit</th>
                      <th className="table-header">Status</th>
                      <th className="table-header text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDF2F7]">
                    {filteredTrips.map(trip => {
                      const s = trip.settlement;
                      const rep = (trip as any).driver_reports ? (Array.isArray((trip as any).driver_reports) ? (trip as any).driver_reports[0] : (trip as any).driver_reports) : null;
                      const petrolExp = Number(rep?.diesel_expense ?? s?.petrol_expense ?? 0);
                      const foodTollExp = Number(rep?.parking_toll_permits_tickets_food ?? 0);
                      const workshopExp = Number(rep?.workshop_expense ?? s?.other_expenses ?? trip.other_fixed_charges ?? 0);
                      const otherExp = foodTollExp + workshopExp;
                      const totalExp = petrolExp + otherExp;

                      const collectAmt = Number(trip.trip_selling_price || trip.amount_driver_must_collect || trip.amount_to_collect || 0);
                      const driverChg = Number(trip.driver_trip_pay_override || trip.driver_charge || (trip.driver?.employment_type === 'Per-trip payment' ? trip.driver?.per_trip_payment : 0) || 0);
                      const profit = s?.net_profit !== undefined ? s.net_profit : collectAmt - driverChg - totalExp;

                      const normSt = (trip.trip_status || '').toLowerCase().replace(/[\s-]+/g, '_');
                      const isDone = normSt === 'completed' || Boolean(rep);
                      const isPrepaid = trip.collection_rule === 'Do not collect';
                      const driverCollectedAmt = Number(rep?.amount_collected ?? (isPrepaid ? 0 : (trip.amount_driver_must_collect ?? trip.amount_to_collect ?? 0)));
                      const returnedFund = driverCollectedAmt - totalExp - driverChg;
                      const dayHighlight = getTripDayHighlight(trip.trip_date || trip.pickup_date);

                      return (
                        <tr
                          key={trip.id}
                          className={`${dayHighlight.rowBgClass} transition-colors`}
                        >
                          <td className="table-cell">
                            <span className="font-mono font-bold text-navy-primary block">{trip.trip_number}</span>
                            {Boolean(trip.trip_number?.match(/-[A-Z]$/) || trip.special_instructions?.includes('[Convoy:')) && (
                              <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-black border border-purple-200">
                                Convoy Cab {trip.trip_number?.split('-').pop()}
                              </span>
                            )}
                            <div className="mt-1">
                              {renderCategoryBadge(trip.trip_category)}
                            </div>
                            {((trip.trip_category || '').toLowerCase().includes('airport') ||
                              (trip.pickup_location || '').toLowerCase().includes('airport') ||
                              (trip.dropoff_location || '').toLowerCase().includes('airport') ||
                              (trip.destination || '').toLowerCase().includes('airport')) && (
                              <div className="mt-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-[10px] inline-flex items-center gap-1">
                                <span>⚠️</span>
                                <span>Verify terminal with customer</span>
                              </div>
                            )}
                          </td>
                          <td className="table-cell">
                            <div>
                              <p className="font-semibold text-text-primary text-sm">{trip.customer_name || trip.guest_names || 'Guest'}</p>
                              <p className="text-xs text-text-secondary">{trip.customer_phone || trip.guest_contact_number || '-'}</p>
                              {(trip.total_people || trip.num_passengers) && (
                                <p className="text-[10px] text-slate-500 font-medium">{trip.total_people || trip.num_passengers} Pax</p>
                              )}
                            </div>
                          </td>
                          <td className="table-cell text-xs">
                            {dayHighlight.label && (
                              <div className="mb-1">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] ${dayHighlight.badgeClass}`}>
                                  {dayHighlight.label}
                                </span>
                              </div>
                            )}
                            <p className={`font-bold ${dayHighlight.isToday ? 'text-emerald-950 font-black' : dayHighlight.isTomorrow ? 'text-sky-950 font-black' : 'text-text-primary'}`}>
                              {formatDate(trip.pickup_date || trip.trip_date || '')}
                            </p>
                            <p className={`font-mono ${dayHighlight.isToday ? 'text-emerald-800 font-bold' : dayHighlight.isTomorrow ? 'text-sky-800 font-bold' : 'text-text-secondary'}`}>
                              {formatTime(trip.pickup_time || '')}
                            </p>
                          </td>
                          <td className="table-cell text-xs text-text-secondary">
                            <p className="font-medium text-text-primary truncate max-w-[190px]" title={`${trip.pickup_location} → ${trip.destination || trip.dropoff_location}`}>
                              {trip.pickup_location} → {trip.destination || trip.dropoff_location}
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono">
                              {trip.vehicle?.registration_number ? `${trip.vehicle.registration_number} (${trip.vehicle.vehicle_type || trip.required_cab_type || 'Cab'})` : (trip.required_cab_type || 'Cab')}
                            </p>
                            {(trip.flight_number || trip.flight_number_and_time) && (
                              <span className="text-[10px] text-blue-600 font-semibold block">
                                ✈️ {trip.flight_number || trip.flight_number_and_time}
                              </span>
                            )}
                          </td>
                          <td className="table-cell text-xs">
                            {trip.driver ? (
                              <div>
                                <span className="font-bold text-text-primary text-xs">{trip.driver.full_name}</span>
                                <p className="text-[11px] text-text-secondary font-mono">{trip.driver.phone || ''}</p>
                                {(trip.driver.employment_type as string) === 'Outside Driver' && (
                                  <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-100 text-amber-800">
                                    Outside Driver
                                  </span>
                                )}
                                <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleDriverSettlement(trip);
                                    }}
                                    disabled={togglingSettlementTripId === trip.id}
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold transition-all border inline-flex items-center gap-1 shadow-2xs ${
                                      trip.driver_settlement_status === 'Settled'
                                        ? 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600'
                                        : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                                    }`}
                                    title={trip.driver_settlement_status === 'Settled' ? 'Click to mark as Not Settled' : 'Click to mark as Driver Settled'}
                                  >
                                    {trip.driver_settlement_status === 'Settled' ? '✓ Settled' : '⏳ Not Settled'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <span className="badge-yellow text-xs">Unassigned</span>
                            )}
                          </td>
                          <td className="table-cell font-mono font-bold text-slate-900">
                            {formatINR(collectAmt)}
                            <span className="block text-[10px] font-sans font-medium text-slate-500">
                              {isPrepaid ? 'Office bill' : 'From guest'}
                            </span>
                          </td>
                          <td className="table-cell">
                            {petrolExp > 0 ? (
                              <div>
                                <span className="font-mono font-bold text-xs text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                                  {formatINR(petrolExp)}
                                </span>
                                <p className="text-[10px] text-slate-500 font-medium mt-0.5">Diesel / Petrol</p>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-mono text-xs">₹0</span>
                            )}
                          </td>
                          <td className="table-cell">
                            {otherExp > 0 ? (
                              <div>
                                <span className="font-mono font-bold text-xs text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                  {formatINR(otherExp)}
                                </span>
                                <p className="text-[10px] text-slate-500 font-medium mt-0.5 truncate max-w-[120px]" title={foodTollExp > 0 && workshopExp > 0 ? `Food/Toll: ₹${foodTollExp}, WS: ₹${workshopExp}` : foodTollExp > 0 ? `Food/Toll: ₹${foodTollExp}` : `WS: ₹${workshopExp}`}>
                                  {foodTollExp > 0 && workshopExp > 0 ? `₹${foodTollExp} toll + ₹${workshopExp} ws` : foodTollExp > 0 ? `₹${foodTollExp} food/toll` : `₹${workshopExp} workshop`}
                                </p>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-mono text-xs">₹0</span>
                            )}
                          </td>
                          <td className="table-cell">
                            {isDone ? (
                              returnedFund > 0 ? (
                                <div>
                                  <span className="font-mono font-black text-xs text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-300 inline-block shadow-2xs">
                                    +{formatINR(returnedFund)}
                                  </span>
                                  <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">Handed to Office</p>
                                </div>
                              ) : returnedFund === 0 ? (
                                <div>
                                  <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                    ₹0
                                  </span>
                                  <p className="text-[10px] text-slate-500 mt-0.5">All spent</p>
                                </div>
                              ) : (
                                <div>
                                  <span className="font-mono font-black text-xs text-blue-800 bg-blue-100/90 px-2 py-0.5 rounded-md border border-blue-300 inline-block">
                                    -{formatINR(Math.abs(returnedFund))}
                                  </span>
                                  <p className="text-[10px] text-blue-700 font-semibold mt-0.5">Office Paid Driver</p>
                                </div>
                              )
                            ) : isPrepaid ? (
                              <div>
                                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                  Prepaid
                                </span>
                                <p className="text-[10px] text-slate-400 mt-0.5">No guest cash</p>
                              </div>
                            ) : (
                              <div>
                                <span className="font-mono text-xs font-semibold text-slate-600">
                                  Est: {formatINR(trip.amount_driver_must_collect || trip.amount_to_collect || 0)}
                                </span>
                                <p className="text-[10px] text-amber-600 font-semibold mt-0.5">Pending duty</p>
                              </div>
                            )}
                          </td>
                          <td className="table-cell">
                            <div>
                              <span className={`font-mono font-black text-sm px-2.5 py-1 rounded-lg border inline-block shadow-2xs ${
                                profit >= 0
                                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                  : 'text-rose-700 bg-rose-50 border-rose-200'
                              }`}>
                                {profit >= 0 ? `+${formatINR(profit)}` : `-${formatINR(Math.abs(profit))}`}
                              </span>
                              {driverChg > 0 && (
                                <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                                  Driver pay: ₹{driverChg}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="table-cell">
                            <StatusBadge status={trip.trip_status} />
                          </td>
                          <td className="table-cell text-right">
                            <div className="flex items-center justify-end gap-1">
                              {trip.trip_status === 'Pending Approval' && (
                                <button
                                  onClick={() => handleApproveTrip(trip.id)}
                                  className="px-2 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                                  title="Approve partner trip request"
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span>Approve</span>
                                </button>
                              )}
                              {trip.trip_status !== 'Completed' && (
                                <button
                                  onClick={() => handleOpenCompleteModal(trip)}
                                  className="px-2 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                                  title="Complete Ride & Enter Expenses"
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span>Complete</span>
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenEditTrip(trip)}
                                className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                                title="Edit Trip Details"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setDispatchTrip(trip)}
                                className="p-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors"
                                title="Generate WhatsApp Driver Dispatch"
                              >
                                <MessageSquare className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setTripSheetTrip(trip)}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                                title="Print Duty Trip Sheet"
                              >
                                <Printer className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setViewTrip(trip)}
                                className="p-1.5 bg-gray-100 hover:bg-gray-200 text-text-primary rounded-lg transition-colors"
                                title="View Trip Details"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              {!trip.assigned_driver_id && (
                                <button
                                  onClick={() => {
                                    setAssignModalTrip(trip);
                                    setSelectedAssignDriverId('');
                                  }}
                                  className="px-2.5 py-1 text-xs bg-navy-primary hover:bg-navy-light text-white font-semibold rounded-lg transition-colors"
                                >
                                  Assign
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteTrip(trip)}
                                className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                                title="Delete Trip"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
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
        </div>
      )}

      {/* Assign Driver Modal */}
      {assignModalTrip && (
        <Modal
          isOpen={Boolean(assignModalTrip)}
          onClose={() => setAssignModalTrip(null)}
          title={`Assign Driver to ${assignModalTrip.trip_number}`}
        >
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-xl text-xs space-y-1">
              <p><strong>Customer:</strong> {assignModalTrip.customer_name || assignModalTrip.guest_names}</p>
              <p><strong>Route:</strong> {assignModalTrip.pickup_location} → {assignModalTrip.dropoff_location || assignModalTrip.destination}</p>
              <p><strong>Date & Time:</strong> {formatDate(assignModalTrip.pickup_date || assignModalTrip.trip_date || '')} at {formatTime(assignModalTrip.pickup_time || '')}</p>
            </div>

            {/* Assignment Mode Toggle */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setAssignType('fleet')}
                className={`py-1.5 px-3 rounded-lg font-bold text-xs transition-all ${
                  assignType === 'fleet' ? 'bg-navy-primary text-white shadow-sm' : 'text-slate-600'
                }`}
              >
                Fleet Driver (Profile)
              </button>
              <button
                type="button"
                onClick={() => setAssignType('outside')}
                className={`py-1.5 px-3 rounded-lg font-bold text-xs transition-all ${
                  assignType === 'outside' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600'
                }`}
              >
                Outside Driver
              </button>
            </div>

            {assignType === 'fleet' ? (
              <div>
                <label className="label">Select Fleet Driver with Profile</label>
                <select
                  value={selectedAssignDriverId}
                  onChange={e => setSelectedAssignDriverId(e.target.value)}
                  className="input-field"
                >
                  <option value="">-- Choose an active driver --</option>
                  {drivers
                    .filter(d => d.employment_status === 'active' || d.status === 'Active')
                    .map(d => (
                      <option key={d.id} value={d.id}>
                        {d.full_name} ({d.phone}) • {d.vehicle_number || 'No Vehicle'}
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <div className="space-y-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Outside Driver Name *</label>
                  <input
                    type="text"
                    value={assignOutsideName}
                    onChange={e => setAssignOutsideName(e.target.value)}
                    placeholder="e.g. Ramesh External"
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">Driver Phone</label>
                    <input
                      type="tel"
                      value={assignOutsidePhone}
                      onChange={e => setAssignOutsidePhone(e.target.value)}
                      placeholder="e.g. 9847123456"
                      className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">Vehicle Reg No *</label>
                    <input
                      type="text"
                      value={assignOutsideVeh}
                      onChange={e => setAssignOutsideVeh(e.target.value.toUpperCase())}
                      placeholder="e.g. KL 16 Q 7965"
                      className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white font-mono uppercase"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setAssignModalTrip(null)} className="btn-secondary text-xs">
                Cancel
              </button>
              <button
                onClick={handleAssignDriver}
                disabled={assignType === 'fleet' ? !selectedAssignDriverId : (!assignOutsideName.trim() || !assignOutsideVeh.trim())}
                className="btn-primary text-xs"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Complete Ride by Admin Modal */}
      {completeModalTrip && (
        <Modal
          isOpen={Boolean(completeModalTrip)}
          onClose={() => setCompleteModalTrip(null)}
          title={`Complete Ride: ${completeModalTrip.trip_number}`}
          size="lg"
        >
          <form onSubmit={handleCompleteTripSubmit} className="space-y-4 text-xs">
            {/* Trip Info Header */}
            <div className="p-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 text-white rounded-2xl shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-amber-400 text-sm">{completeModalTrip.trip_number}</span>
                <span className="text-[11px] bg-white/10 px-2 py-0.5 rounded-md font-semibold text-slate-200">
                  {completeModalTrip.trip_category || 'Duty'}
                </span>
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-100">{completeModalTrip.guest_names || completeModalTrip.customer_name || 'Guest'}</span>
                <span className="text-slate-400 mx-1.5">•</span>
                <span className="text-slate-300">{completeModalTrip.pickup_location} → {completeModalTrip.dropoff_location || completeModalTrip.destination}</span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-white/10">
                <span>Trip Date: <strong>{formatDate(completeModalTrip.trip_date || completeModalTrip.pickup_date || '')}</strong></span>
                <span>Trip Selling Price: <strong className="text-emerald-400 font-mono">{formatINR(completeModalTrip.trip_selling_price || 0)}</strong></span>
              </div>
            </div>

            {/* Driver Assignment if unassigned or change */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Assigned Driver *</label>
                <select
                  value={completeDriverId}
                  onChange={e => {
                    setCompleteDriverId(e.target.value);
                    const drv = drivers.find(d => d.id === e.target.value);
                    if (drv?.per_trip_payment) {
                      setCompleteDriverPay(drv.per_trip_payment);
                    }
                  }}
                  required
                  className="input-field font-semibold"
                >
                  <option value="">-- Select Driver --</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.full_name} ({d.phone}) {d.employment_type ? `• ${d.employment_type}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Driver Duty Pay (₹)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={completeDriverPay}
                  onChange={e => setCompleteDriverPay(e.target.value)}
                  className="input-field font-mono font-bold"
                />
              </div>
            </div>

            {/* 1. Guest Cash Collection */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                  <span>1. Guest Collection (Actual Cash Received by Driver)</span>
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCompleteAmountCollected(0)}
                    className="px-2 py-0.5 rounded text-[10px] bg-slate-200 hover:bg-slate-300 font-bold text-slate-700"
                  >
                    ₹0 (Prepaid / Hotel Bill)
                  </button>
                  {completeModalTrip.amount_driver_must_collect && (
                    <button
                      type="button"
                      onClick={() => setCompleteAmountCollected(completeModalTrip.amount_driver_must_collect || 0)}
                      className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 hover:bg-emerald-200 font-bold text-emerald-800"
                    >
                      ₹{completeModalTrip.amount_driver_must_collect} (Expected)
                    </button>
                  )}
                </div>
              </div>

              <div>
                <input
                  type="number"
                  min="0"
                  required
                  value={completeAmountCollected}
                  onChange={e => setCompleteAmountCollected(e.target.value)}
                  placeholder="0"
                  className="input-field font-mono font-bold text-sm"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Enter 0 if the ride is prepaid by customer or billed directly to hotel / homestay on monthly account.
                </span>
              </div>
            </div>

            {/* 2. On-Trip Running Expenses */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <label className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Fuel className="w-3.5 h-3.5 text-rose-600" />
                <span>2. On-Trip Running Expenses (Spent by Driver)</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Diesel / Petrol Expense (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={completeDiesel}
                    onChange={e => setCompleteDiesel(e.target.value)}
                    placeholder="0"
                    className="input-field font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="label">Toll, Parking, Permits (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={completeParkingToll}
                    onChange={e => setCompleteParkingToll(e.target.value)}
                    placeholder="0"
                    className="input-field font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="label">Toll / Parking / Other Details (Optional)</label>
                <input
                  type="text"
                  value={completeTollDetails}
                  onChange={e => setCompleteTollDetails(e.target.value)}
                  placeholder="e.g. Airport parking ₹120, Highway toll ₹80"
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="label">Workshop / Repairs (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={completeWorkshop}
                    onChange={e => setCompleteWorkshop(e.target.value)}
                    placeholder="0"
                    className="input-field font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="label">Repair Description (Optional)</label>
                  <input
                    type="text"
                    value={completeWorkshopDetails}
                    onChange={e => setCompleteWorkshopDetails(e.target.value)}
                    placeholder="e.g. Puncture repair, Bulb change"
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {/* 3. Driver Settlement Option & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <label className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={completeDriverSettled}
                  onChange={e => setCompleteDriverSettled(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-slate-800 text-xs block">Mark Driver as Settled</span>
                  <span className="text-[10px] text-slate-500">Check if payment/balance for this ride is already settled with driver</span>
                </div>
              </label>

              <div>
                <label className="label">Admin Notes</label>
                <input
                  type="text"
                  value={completeAdminNotes}
                  onChange={e => setCompleteAdminNotes(e.target.value)}
                  placeholder="Completed on behalf of driver"
                  className="input-field"
                />
              </div>
            </div>

            {/* Financial Accounting Calculation Breakdown */}
            {(() => {
              const pay = Number(completeDriverPay) || 0;
              const exp = (Number(completeDiesel) || 0) + (Number(completeParkingToll) || 0) + (Number(completeWorkshop) || 0);
              const credit = pay + exp;
              const collected = Number(completeAmountCollected) || 0;
              const netBalance = credit - collected;

              return (
                <div className="p-3.5 bg-slate-900 text-white rounded-2xl space-y-2">
                  <span className="font-bold text-[11px] text-slate-300 uppercase tracking-wider block border-b border-white/10 pb-1.5">
                    Live Duty Accounting Balance:
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white/5 p-2 rounded-xl">
                      <span className="text-slate-400 block text-[10px]">Driver Credit</span>
                      <span className="font-mono font-bold text-emerald-400">₹{credit.toLocaleString('en-IN')}</span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">(Pay ₹{pay} + Exp ₹{exp})</span>
                    </div>
                    <div className="bg-white/5 p-2 rounded-xl">
                      <span className="text-slate-400 block text-[10px]">Guest Cash</span>
                      <span className="font-mono font-bold text-amber-300">₹{collected.toLocaleString('en-IN')}</span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">(Collected)</span>
                    </div>
                    <div className={`p-2 rounded-xl font-bold ${netBalance >= 0 ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30' : 'bg-blue-950/80 text-blue-300 border border-blue-500/30'}`}>
                      <span className="text-[10px] block opacity-80">{netBalance >= 0 ? 'Office Pays Driver' : 'Driver Holds Cash'}</span>
                      <span className="font-mono text-sm font-black">₹{Math.abs(netBalance).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setCompleteModalTrip(null)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={completingTrip || !completeDriverId}
                className="btn-primary text-xs flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700"
              >
                {completingTrip ? <LoadingSpinner size="sm" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{completingTrip ? 'Completing Ride...' : 'Complete Ride & Save'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* View Full Trip Details Modal */}
      {viewTrip && (
        <Modal
          isOpen={Boolean(viewTrip)}
          onClose={() => setViewTrip(null)}
          title={`Trip Details: ${viewTrip.trip_number}`}
          size="lg"
        >
          <div className="space-y-5">
            {/* Header pill */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <StatusBadge status={viewTrip.trip_status} />
                {viewTrip.trip_status !== 'Completed' && (
                  <button
                    type="button"
                    onClick={() => {
                      const t = viewTrip;
                      setViewTrip(null);
                      handleOpenCompleteModal(t);
                    }}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Complete Ride</span>
                  </button>
                )}
                <span className="text-xs text-text-secondary">
                  Created {formatDate(viewTrip.created_at || '')}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-text-secondary block">Amount to Collect</span>
                <span className="text-lg font-black text-navy-primary font-mono">
                  {formatINR(viewTrip.amount_to_collect || viewTrip.amount_driver_must_collect || 0)}
                </span>
              </div>
            </div>

            {/* Customer & Route Details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                <p className="text-text-secondary font-semibold uppercase text-[10px]">Customer Information</p>
                <p className="font-bold text-text-primary text-sm">{viewTrip.customer_name || viewTrip.guest_names || 'Guest'}</p>
                <p className="text-text-primary flex items-center gap-1 font-medium">
                  <Phone className="h-3.5 w-3.5 text-green-primary" /> {viewTrip.customer_phone || viewTrip.guest_contact_number || '-'}
                </p>
                <p className="text-text-secondary">Passengers: {viewTrip.num_passengers || viewTrip.total_people || 1}</p>
                {(viewTrip.flight_number || viewTrip.flight_number_and_time) && (
                  <p className="text-blue-600 font-bold flex items-center gap-1">
                    <Plane className="h-3.5 w-3.5" /> Flight: {viewTrip.flight_number || viewTrip.flight_number_and_time}
                  </p>
                )}
              </div>

              <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                <p className="text-text-secondary font-semibold uppercase text-[10px]">Route & Schedule</p>
                <p className="font-semibold text-text-primary">
                  {viewTrip.pickup_location} → {viewTrip.destination || viewTrip.dropoff_location}
                </p>
                <p className="text-text-secondary flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-green-primary" /> {formatDate(viewTrip.pickup_date || viewTrip.trip_date || '')} at {formatTime(viewTrip.pickup_time || '')}
                </p>
                <p className="text-text-secondary mt-1">
                  Driver: <strong className="text-text-primary">{viewTrip.driver?.full_name || 'Unassigned'}</strong>
                </p>
              </div>
            </div>

            {/* Highlighted Driver Notice for Airport Trips */}
            {Boolean(
              (viewTrip.trip_category || '').toLowerCase().includes('airport') ||
              (viewTrip.pickup_location || '').toLowerCase().includes('airport') ||
              (viewTrip.dropoff_location || '').toLowerCase().includes('airport') ||
              (viewTrip.destination || '').toLowerCase().includes('airport')
            ) && (
              <div className="p-3.5 bg-amber-50 border-2 border-amber-300 rounded-xl text-amber-950 flex items-center gap-3 shadow-xs">
                <span className="text-xl">⚠️</span>
                <div>
                  <p className="font-extrabold text-[11px] uppercase tracking-wide text-amber-800">
                    Airport Duty Note for Driver:
                  </p>
                  <p className="font-black text-xs text-amber-950">
                    Verify the terminal with customer!
                  </p>
                  <p className="text-[11px] text-amber-700 font-medium">
                    Driver must confirm whether Domestic (Terminal 1) or International (Terminal 2) with customer before trip.
                  </p>
                </div>
              </div>
            )}

            {/* Placard Preview */}
            <div>
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <span className="font-bold text-text-secondary uppercase">Airport Name Board / Placard</span>
                <button
                  onClick={() => handleCopyPlacard(viewTrip.placard_text || `VARKALA HOLIDAYS - ${(viewTrip.customer_name || viewTrip.guest_names || 'GUEST').toUpperCase()}`)}
                  className="text-xs font-semibold text-green-primary hover:underline flex items-center gap-1"
                >
                  {copiedPlacard ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedPlacard ? 'Copied' : 'Copy Placard'}</span>
                </button>
              </div>
              <div className="p-4 bg-navy-sidebar text-white rounded-xl text-center border-2 border-dashed border-green-primary/50 font-mono font-bold tracking-widest text-sm">
                {viewTrip.placard_text || `VARKALA HOLIDAYS - ${(viewTrip.customer_name || viewTrip.guest_names || 'GUEST').toUpperCase()}`}
              </div>
            </div>

            {/* Financial Breakdown */}
            {(() => {
              const rep = (viewTrip as any).driver_reports ? (Array.isArray((viewTrip as any).driver_reports) ? (viewTrip as any).driver_reports[0] : (viewTrip as any).driver_reports) : null;
              const dPetrol = Number(rep?.diesel_expense || viewTrip.settlement?.petrol_expense || 0);
              const dFoodToll = Number(rep?.parking_toll_permits_tickets_food || 0);
              const dWorkshop = Number(rep?.workshop_expense || viewTrip.settlement?.other_expenses || viewTrip.other_fixed_charges || 0);
              const dCollect = Number(viewTrip.trip_selling_price || viewTrip.amount_to_collect || viewTrip.amount_driver_must_collect || 0);
              const dDriverCharge = Number(viewTrip.driver_trip_pay_override || viewTrip.driver_charge || (viewTrip.driver?.employment_type === 'Per-trip payment' ? viewTrip.driver?.per_trip_payment : 0) || 0);
              const dProfit = viewTrip.settlement?.net_profit !== undefined ? viewTrip.settlement.net_profit : (dCollect - dDriverCharge - dPetrol - dFoodToll - dWorkshop);

              return (
                <div className="p-3.5 bg-green-light/40 rounded-xl border border-green-primary/20 space-y-1.5 text-xs">
                  <p className="font-bold text-navy-primary uppercase text-[10px] tracking-wide">Financial Summary</p>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Customer Collection:</span>
                    <span className="font-bold text-text-primary">{formatINR(dCollect)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Driver Pay / Charge:</span>
                    {(viewTrip.special_instructions || '').includes('Settle Later') && dDriverCharge === 0 ? (
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          ⏳ Settle After Trip
                        </span>
                        <button
                          type="button"
                          onClick={() => handlePromptSetDriverPay(viewTrip.id, viewTrip.trip_number)}
                          className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] transition-colors shadow-2xs"
                        >
                          + Enter Pay
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-text-primary">{formatINR(dDriverCharge)}</span>
                        <button
                          type="button"
                          onClick={() => handlePromptSetDriverPay(viewTrip.id, viewTrip.trip_number, dDriverCharge)}
                          className="text-[10px] text-blue-600 hover:underline font-bold"
                          title="Edit Driver Pay"
                        >
                          ✏️ Edit
                        </button>
                      </div>
                    )}
                  </div>
                  {dPetrol > 0 && (
                    <div className="flex justify-between text-expense">
                      <span>Petrol / Diesel Expense:</span>
                      <span className="font-medium">-{formatINR(dPetrol)}</span>
                    </div>
                  )}
                  {dFoodToll > 0 && (
                    <div className="flex justify-between text-expense">
                      <span>Toll / Parking / Other Expense:</span>
                      <span className="font-medium">-{formatINR(dFoodToll)}</span>
                    </div>
                  )}
                  {dWorkshop > 0 && (
                    <div className="flex justify-between text-expense">
                      <span>Workshop / Other Expense:</span>
                      <span className="font-medium">-{formatINR(dWorkshop)}</span>
                    </div>
                  )}
                  <div className="pt-1.5 border-t border-green-primary/20 flex justify-between font-bold">
                    <span>Net Trip Profit:</span>
                    <span className={`font-black text-sm ${dProfit >= 0 ? 'text-green-primary' : 'text-expense'}`}>{formatINR(dProfit)}</span>
                  </div>
                </div>
              );
            })()}

            {/* Organization Billing & Pending Bill Details */}
            <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-950 uppercase text-[10px] tracking-wide">
                  Organization Billing & Pending Status
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  viewTrip.billing_status === 'Paid'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {viewTrip.billing_status === 'Paid' ? '✓ Bill Paid' : '⏳ Payment Pending'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 font-mono text-center pt-1">
                <div className="p-2 bg-white rounded-lg border border-amber-200">
                  <span className="text-[9px] font-sans text-slate-400 block uppercase">Trip Cost</span>
                  <span className="font-bold text-slate-900">{formatINR(viewTrip.trip_selling_price || 0)}</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-amber-200">
                  <span className="text-[9px] font-sans text-slate-400 block uppercase">Advance</span>
                  <span className="font-bold text-emerald-600">{formatINR(viewTrip.advance_amount || 0)}</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-amber-200">
                  <span className="text-[9px] font-sans text-slate-400 block uppercase">Pending Due</span>
                  <span className="font-black text-amber-900">{formatINR(viewTrip.pending_amount !== undefined ? viewTrip.pending_amount : ((viewTrip.trip_selling_price || 0) - (viewTrip.advance_amount || 0)))}</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-amber-200/60 flex-wrap gap-2">
                <span className="text-[11px] text-slate-600">
                  Organization: <strong>{viewTrip.organization?.name || 'Villa Lemon'}</strong>
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    const newStatus: 'Pending' | 'Paid' = viewTrip.billing_status === 'Paid' ? 'Pending' : 'Paid';
                    await tripService.updateTripBilling(viewTrip.id, { billingStatus: newStatus });
                    setViewTrip({
                      ...viewTrip,
                      billing_status: newStatus,
                      pending_amount: newStatus === 'Paid' ? 0 : Math.max(0, (viewTrip.trip_selling_price || 0) - (viewTrip.advance_amount || 0)),
                    });
                    loadData();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px]"
                >
                  Mark as {viewTrip.billing_status === 'Paid' ? 'Pending' : 'Paid'}
                </button>
              </div>
            </div>

            {/* Driver Periodic Settlement Status Card */}
            {viewTrip.assigned_driver_id && (
              <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-950 uppercase text-[10px] tracking-wide">
                    Driver Periodic Settlement Status
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    viewTrip.driver_settlement_status === 'Settled'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {viewTrip.driver_settlement_status === 'Settled' ? '✓ Driver Settled' : '⏳ Settlement Pending'}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-blue-200/60 flex-wrap gap-2">
                  <span className="text-[11px] text-slate-600">
                    Assigned Driver: <strong>{viewTrip.driver?.full_name || 'Driver'}</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleDriverSettlement(viewTrip)}
                      disabled={togglingSettlementTripId === viewTrip.id}
                      className={`px-3 py-1 rounded-lg font-bold text-[11px] shadow-2xs transition-all ${
                        viewTrip.driver_settlement_status === 'Settled'
                          ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {viewTrip.driver_settlement_status === 'Settled' ? 'Mark as Not Settled' : '✓ Mark as Driver Settled'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {viewTrip.trip_notes && (
              <div className="text-xs text-text-secondary bg-gray-50 p-3 rounded-xl">
                <strong className="text-text-primary block mb-0.5">Special Instructions:</strong>
                {viewTrip.trip_notes}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Complete Ride by Admin Modal */}
      {completeModalTrip && (
        <Modal
          isOpen={Boolean(completeModalTrip)}
          onClose={() => setCompleteModalTrip(null)}
          title={`Complete Ride: ${completeModalTrip.trip_number}`}
          size="lg"
        >
          <form onSubmit={handleCompleteTripSubmit} className="space-y-4 text-xs">
            {/* Trip Info Header */}
            <div className="p-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 text-white rounded-2xl shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-amber-400 text-sm">{completeModalTrip.trip_number}</span>
                <span className="text-[11px] bg-white/10 px-2 py-0.5 rounded-md font-semibold text-slate-200">
                  {completeModalTrip.trip_category || 'Duty'}
                </span>
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-100">{completeModalTrip.guest_names || completeModalTrip.customer_name || 'Guest'}</span>
                <span className="text-slate-400 mx-1.5">•</span>
                <span className="text-slate-300">{completeModalTrip.pickup_location} → {completeModalTrip.dropoff_location || completeModalTrip.destination}</span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-white/10">
                <span>Trip Date: <strong>{formatDate(completeModalTrip.trip_date || completeModalTrip.pickup_date || '')}</strong></span>
                <span>Trip Selling Price: <strong className="text-emerald-400 font-mono">{formatINR(completeModalTrip.trip_selling_price || 0)}</strong></span>
              </div>
            </div>

            {/* Driver Assignment if unassigned or change */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Assigned Driver *</label>
                <select
                  value={completeDriverId}
                  onChange={e => {
                    setCompleteDriverId(e.target.value);
                    const drv = drivers.find(d => d.id === e.target.value);
                    if (drv?.per_trip_payment) {
                      setCompleteDriverPay(drv.per_trip_payment);
                    }
                  }}
                  required
                  className="input-field font-semibold"
                >
                  <option value="">-- Select Driver --</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.full_name} ({d.phone}) {d.employment_type ? `• ${d.employment_type}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Driver Duty Pay (₹)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={completeDriverPay}
                  onChange={e => setCompleteDriverPay(e.target.value)}
                  className="input-field font-mono font-bold"
                />
              </div>
            </div>

            {/* 1. Guest Cash Collection */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                  <span>1. Guest Collection (Actual Cash Received by Driver)</span>
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCompleteAmountCollected(0)}
                    className="px-2 py-0.5 rounded text-[10px] bg-slate-200 hover:bg-slate-300 font-bold text-slate-700"
                  >
                    ₹0 (Prepaid / Hotel Bill)
                  </button>
                  {completeModalTrip.amount_driver_must_collect && (
                    <button
                      type="button"
                      onClick={() => setCompleteAmountCollected(completeModalTrip.amount_driver_must_collect || 0)}
                      className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 hover:bg-emerald-200 font-bold text-emerald-800"
                    >
                      ₹{completeModalTrip.amount_driver_must_collect} (Expected)
                    </button>
                  )}
                </div>
              </div>

              <div>
                <input
                  type="number"
                  min="0"
                  required
                  value={completeAmountCollected}
                  onChange={e => setCompleteAmountCollected(e.target.value)}
                  placeholder="0"
                  className="input-field font-mono font-bold text-sm"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Enter 0 if the ride is prepaid by customer or billed directly to hotel / homestay on monthly account.
                </span>
              </div>
            </div>

            {/* 2. On-Trip Running Expenses */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <label className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Fuel className="w-3.5 h-3.5 text-rose-600" />
                <span>2. On-Trip Running Expenses (Spent by Driver)</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Diesel / Petrol Expense (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={completeDiesel}
                    onChange={e => setCompleteDiesel(e.target.value)}
                    placeholder="0"
                    className="input-field font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="label">Toll, Parking, Permits (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={completeParkingToll}
                    onChange={e => setCompleteParkingToll(e.target.value)}
                    placeholder="0"
                    className="input-field font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="label">Toll / Parking / Other Details (Optional)</label>
                <input
                  type="text"
                  value={completeTollDetails}
                  onChange={e => setCompleteTollDetails(e.target.value)}
                  placeholder="e.g. Airport parking ₹120, Highway toll ₹80"
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="label">Workshop / Repairs (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={completeWorkshop}
                    onChange={e => setCompleteWorkshop(e.target.value)}
                    placeholder="0"
                    className="input-field font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="label">Repair Description (Optional)</label>
                  <input
                    type="text"
                    value={completeWorkshopDetails}
                    onChange={e => setCompleteWorkshopDetails(e.target.value)}
                    placeholder="e.g. Puncture repair, Bulb change"
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {/* 3. Driver Settlement Option & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <label className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={completeDriverSettled}
                  onChange={e => setCompleteDriverSettled(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-slate-800 text-xs block">Mark Driver as Settled</span>
                  <span className="text-[10px] text-slate-500">Check if payment/balance for this ride is already settled with driver</span>
                </div>
              </label>

              <div>
                <label className="label">Admin Notes</label>
                <input
                  type="text"
                  value={completeAdminNotes}
                  onChange={e => setCompleteAdminNotes(e.target.value)}
                  placeholder="Completed on behalf of driver"
                  className="input-field"
                />
              </div>
            </div>

            {/* Financial Accounting Calculation Breakdown */}
            {(() => {
              const pay = Number(completeDriverPay) || 0;
              const exp = (Number(completeDiesel) || 0) + (Number(completeParkingToll) || 0) + (Number(completeWorkshop) || 0);
              const credit = pay + exp;
              const collected = Number(completeAmountCollected) || 0;
              const netBalance = credit - collected;

              return (
                <div className="p-3.5 bg-slate-900 text-white rounded-2xl space-y-2">
                  <span className="font-bold text-[11px] text-slate-300 uppercase tracking-wider block border-b border-white/10 pb-1.5">
                    Live Duty Accounting Balance:
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white/5 p-2 rounded-xl">
                      <span className="text-slate-400 block text-[10px]">Driver Credit</span>
                      <span className="font-mono font-bold text-emerald-400">₹{credit.toLocaleString('en-IN')}</span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">(Pay ₹{pay} + Exp ₹{exp})</span>
                    </div>
                    <div className="bg-white/5 p-2 rounded-xl">
                      <span className="text-slate-400 block text-[10px]">Guest Cash</span>
                      <span className="font-mono font-bold text-amber-300">₹{collected.toLocaleString('en-IN')}</span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">(Collected)</span>
                    </div>
                    <div className={`p-2 rounded-xl font-bold ${netBalance >= 0 ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30' : 'bg-blue-950/80 text-blue-300 border border-blue-500/30'}`}>
                      <span className="text-[10px] block opacity-80">{netBalance >= 0 ? 'Office Pays Driver' : 'Driver Holds Cash'}</span>
                      <span className="font-mono text-sm font-black">₹{Math.abs(netBalance).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setCompleteModalTrip(null)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={completingTrip || !completeDriverId}
                className="btn-primary text-xs flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700"
              >
                {completingTrip ? <LoadingSpinner size="sm" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{completingTrip ? 'Completing Ride...' : 'Complete Ride & Save'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* WhatsApp Dispatch Modal */}
      {dispatchTrip && (
        <Modal
          isOpen={Boolean(dispatchTrip)}
          onClose={() => setDispatchTrip(null)}
          title={`WhatsApp Dispatch: ${dispatchTrip.trip_number}`}
          size="md"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-500">
              Generated in Varkala Holidays driver dispatch format. One-click share directly to the driver via WhatsApp.
            </p>
            <pre className="p-4 bg-slate-900 text-emerald-400 font-mono rounded-xl whitespace-pre-wrap leading-relaxed text-[11px] select-all max-h-80 overflow-y-auto">
              {generateWhatsAppText(dispatchTrip)}
            </pre>
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => handleCopyDispatch(dispatchTrip)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 flex items-center gap-1.5"
              >
                {copiedDispatch ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedDispatch ? 'Copied to Clipboard!' : 'Copy Text'}</span>
              </button>
              <button
                onClick={() => handleShareWhatsApp(dispatchTrip)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-md"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Send via WhatsApp</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Complete Ride by Admin Modal */}
      {completeModalTrip && (
        <Modal
          isOpen={Boolean(completeModalTrip)}
          onClose={() => setCompleteModalTrip(null)}
          title={`Complete Ride: ${completeModalTrip.trip_number}`}
          size="lg"
        >
          <form onSubmit={handleCompleteTripSubmit} className="space-y-4 text-xs">
            {/* Trip Info Header */}
            <div className="p-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 text-white rounded-2xl shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-amber-400 text-sm">{completeModalTrip.trip_number}</span>
                <span className="text-[11px] bg-white/10 px-2 py-0.5 rounded-md font-semibold text-slate-200">
                  {completeModalTrip.trip_category || 'Duty'}
                </span>
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-100">{completeModalTrip.guest_names || completeModalTrip.customer_name || 'Guest'}</span>
                <span className="text-slate-400 mx-1.5">•</span>
                <span className="text-slate-300">{completeModalTrip.pickup_location} → {completeModalTrip.dropoff_location || completeModalTrip.destination}</span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-white/10">
                <span>Trip Date: <strong>{formatDate(completeModalTrip.trip_date || completeModalTrip.pickup_date || '')}</strong></span>
                <span>Trip Selling Price: <strong className="text-emerald-400 font-mono">{formatINR(completeModalTrip.trip_selling_price || 0)}</strong></span>
              </div>
            </div>

            {/* Driver Assignment if unassigned or change */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Assigned Driver *</label>
                <select
                  value={completeDriverId}
                  onChange={e => {
                    setCompleteDriverId(e.target.value);
                    const drv = drivers.find(d => d.id === e.target.value);
                    if (drv?.per_trip_payment) {
                      setCompleteDriverPay(drv.per_trip_payment);
                    }
                  }}
                  required
                  className="input-field font-semibold"
                >
                  <option value="">-- Select Driver --</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.full_name} ({d.phone}) {d.employment_type ? `• ${d.employment_type}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Driver Duty Pay (₹)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={completeDriverPay}
                  onChange={e => setCompleteDriverPay(e.target.value)}
                  className="input-field font-mono font-bold"
                />
              </div>
            </div>

            {/* 1. Guest Cash Collection */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                  <span>1. Guest Collection (Actual Cash Received by Driver)</span>
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCompleteAmountCollected(0)}
                    className="px-2 py-0.5 rounded text-[10px] bg-slate-200 hover:bg-slate-300 font-bold text-slate-700"
                  >
                    ₹0 (Prepaid / Hotel Bill)
                  </button>
                  {completeModalTrip.amount_driver_must_collect && (
                    <button
                      type="button"
                      onClick={() => setCompleteAmountCollected(completeModalTrip.amount_driver_must_collect || 0)}
                      className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 hover:bg-emerald-200 font-bold text-emerald-800"
                    >
                      ₹{completeModalTrip.amount_driver_must_collect} (Expected)
                    </button>
                  )}
                </div>
              </div>

              <div>
                <input
                  type="number"
                  min="0"
                  required
                  value={completeAmountCollected}
                  onChange={e => setCompleteAmountCollected(e.target.value)}
                  placeholder="0"
                  className="input-field font-mono font-bold text-sm"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Enter 0 if the ride is prepaid by customer or billed directly to hotel / homestay on monthly account.
                </span>
              </div>
            </div>

            {/* 2. On-Trip Running Expenses */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <label className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Fuel className="w-3.5 h-3.5 text-rose-600" />
                <span>2. On-Trip Running Expenses (Spent by Driver)</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Diesel / Petrol Expense (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={completeDiesel}
                    onChange={e => setCompleteDiesel(e.target.value)}
                    placeholder="0"
                    className="input-field font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="label">Toll, Parking, Permits (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={completeParkingToll}
                    onChange={e => setCompleteParkingToll(e.target.value)}
                    placeholder="0"
                    className="input-field font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="label">Toll / Parking / Other Details (Optional)</label>
                <input
                  type="text"
                  value={completeTollDetails}
                  onChange={e => setCompleteTollDetails(e.target.value)}
                  placeholder="e.g. Airport parking ₹120, Highway toll ₹80"
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="label">Workshop / Repairs (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={completeWorkshop}
                    onChange={e => setCompleteWorkshop(e.target.value)}
                    placeholder="0"
                    className="input-field font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="label">Repair Description (Optional)</label>
                  <input
                    type="text"
                    value={completeWorkshopDetails}
                    onChange={e => setCompleteWorkshopDetails(e.target.value)}
                    placeholder="e.g. Puncture repair, Bulb change"
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {/* 3. Driver Settlement Option & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <label className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={completeDriverSettled}
                  onChange={e => setCompleteDriverSettled(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-slate-800 text-xs block">Mark Driver as Settled</span>
                  <span className="text-[10px] text-slate-500">Check if payment/balance for this ride is already settled with driver</span>
                </div>
              </label>

              <div>
                <label className="label">Admin Notes</label>
                <input
                  type="text"
                  value={completeAdminNotes}
                  onChange={e => setCompleteAdminNotes(e.target.value)}
                  placeholder="Completed on behalf of driver"
                  className="input-field"
                />
              </div>
            </div>

            {/* Financial Accounting Calculation Breakdown */}
            {(() => {
              const pay = Number(completeDriverPay) || 0;
              const exp = (Number(completeDiesel) || 0) + (Number(completeParkingToll) || 0) + (Number(completeWorkshop) || 0);
              const credit = pay + exp;
              const collected = Number(completeAmountCollected) || 0;
              const netBalance = credit - collected;

              return (
                <div className="p-3.5 bg-slate-900 text-white rounded-2xl space-y-2">
                  <span className="font-bold text-[11px] text-slate-300 uppercase tracking-wider block border-b border-white/10 pb-1.5">
                    Live Duty Accounting Balance:
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white/5 p-2 rounded-xl">
                      <span className="text-slate-400 block text-[10px]">Driver Credit</span>
                      <span className="font-mono font-bold text-emerald-400">₹{credit.toLocaleString('en-IN')}</span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">(Pay ₹{pay} + Exp ₹{exp})</span>
                    </div>
                    <div className="bg-white/5 p-2 rounded-xl">
                      <span className="text-slate-400 block text-[10px]">Guest Cash</span>
                      <span className="font-mono font-bold text-amber-300">₹{collected.toLocaleString('en-IN')}</span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">(Collected)</span>
                    </div>
                    <div className={`p-2 rounded-xl font-bold ${netBalance >= 0 ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30' : 'bg-blue-950/80 text-blue-300 border border-blue-500/30'}`}>
                      <span className="text-[10px] block opacity-80">{netBalance >= 0 ? 'Office Pays Driver' : 'Driver Holds Cash'}</span>
                      <span className="font-mono text-sm font-black">₹{Math.abs(netBalance).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setCompleteModalTrip(null)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={completingTrip || !completeDriverId}
                className="btn-primary text-xs flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700"
              >
                {completingTrip ? <LoadingSpinner size="sm" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{completingTrip ? 'Completing Ride...' : 'Complete Ride & Save'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Printable Trip Sheet Modal */}
      {tripSheetTrip && (
        <Modal
          isOpen={Boolean(tripSheetTrip)}
          onClose={() => setTripSheetTrip(null)}
          title={`Duty Slip / Trip Sheet: ${tripSheetTrip.trip_number}`}
          size="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-4 print:p-0 print:border-none">
              <div className="flex justify-between items-start border-b pb-3">
                <div>
                  <h2 className="text-base font-black text-slate-900 tracking-wide">VARKALA HOLIDAYS</h2>
                  <p className="text-[11px] text-slate-500">Taxi & Transport Management System</p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-blue-900 text-sm">{tripSheetTrip.trip_number}</span>
                  <p className="text-[11px] text-slate-500">Date: {formatDate(tripSheetTrip.trip_date || tripSheetTrip.pickup_date || '')}</p>
                </div>
              </div>

              {/* Route & Duty Details - PLACED FIRST */}
              <div className="border rounded-lg p-3 space-y-1 bg-slate-50/50">
                <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wide">Route & Duty Details</p>
                <p className="text-slate-700">Pickup: <strong>{tripSheetTrip.pickup_location}</strong> at {formatTime(tripSheetTrip.pickup_time || '')}</p>
                <p className="text-slate-700">Drop-off: <strong>{tripSheetTrip.dropoff_location || tripSheetTrip.destination}</strong></p>
                <p className="text-slate-700">Collection: <strong>{tripSheetTrip.collection_rule === 'Do not collect' ? 'Do not collect (Office)' : `Collect ${formatINR(tripSheetTrip.amount_driver_must_collect || tripSheetTrip.amount_to_collect || 0)}`}</strong></p>
              </div>

              {/* Highlighted Driver Instruction for Airport Trips */}
              {Boolean(
                (tripSheetTrip.trip_category || '').toLowerCase().includes('airport') ||
                (tripSheetTrip.pickup_location || '').toLowerCase().includes('airport') ||
                (tripSheetTrip.dropoff_location || '').toLowerCase().includes('airport') ||
                (tripSheetTrip.destination || '').toLowerCase().includes('airport')
              ) && (
                <div className="p-2.5 bg-amber-50 border-2 border-amber-300 rounded-lg text-amber-950 flex items-center gap-2">
                  <span className="text-base">⚠️</span>
                  <div className="text-xs">
                    <span className="font-bold text-amber-900 uppercase">Driver Instruction: </span>
                    <strong className="text-amber-950 font-black">Verify the terminal with customer!</strong>
                    <span className="text-amber-800 text-[11px] block mt-0.5">Please confirm Domestic (Terminal 1) vs International (Terminal 2) with passenger before trip.</span>
                  </div>
                </div>
              )}

              {/* Guest & Driver Information - PLACED AFTER PICKUP AND DROPOFF */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Guest Information</p>
                  <p className="font-bold text-slate-900">{tripSheetTrip.guest_names || tripSheetTrip.customer_name}</p>
                  <p className="text-slate-600">Phone: {tripSheetTrip.guest_contact_number || tripSheetTrip.customer_phone || '-'}</p>
                  <p className="text-slate-600">Pax: {tripSheetTrip.total_people || 1}</p>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Driver & Cab</p>
                  <p className="font-bold text-slate-900">{tripSheetTrip.driver?.full_name || 'Driver'}</p>
                  <p className="text-slate-600">Vehicle: {tripSheetTrip.vehicle?.registration_number || tripSheetTrip.required_cab_type}</p>
                  <p className="text-slate-600">Driver Phone: {tripSheetTrip.driver?.phone || '-'}</p>
                </div>
              </div>

              {/* Odometer & Signature Blocks */}
              {(() => {
                const rep = (tripSheetTrip as any).driver_reports ? (Array.isArray((tripSheetTrip as any).driver_reports) ? (tripSheetTrip as any).driver_reports[0] : (tripSheetTrip as any).driver_reports) : null;
                const sheetDiesel = rep?.diesel_expense || tripSheetTrip.settlement?.petrol_expense;
                const sheetToll = rep?.parking_toll_permits_tickets_food || tripSheetTrip.settlement?.other_expenses;

                return (
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                    <div className="border border-dashed p-3 rounded-lg space-y-3">
                      <p className="font-bold text-slate-700 text-[10px] uppercase">Duty Expenses & Odometer</p>
                      <div className="flex justify-between">
                        <span>Starting KM: __________</span>
                        <span>Ending KM: __________</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tolls/Parking/Other: <strong>{sheetToll ? formatINR(sheetToll) : '₹_______'}</strong></span>
                        <span>Diesel/Petrol: <strong>{sheetDiesel ? formatINR(sheetDiesel) : '₹_______'}</strong></span>
                      </div>
                    </div>

                    <div className="border border-dashed p-3 rounded-lg flex flex-col justify-between">
                      <p className="font-bold text-slate-700 text-[10px] uppercase">Guest Signature</p>
                      <p className="text-[10px] text-slate-400 mt-6 pt-2 border-t">Signature / Rating / Feedback</p>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setTripSheetTrip(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Print Trip Sheet</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Complete Ride by Admin Modal */}
      {completeModalTrip && (
        <Modal
          isOpen={Boolean(completeModalTrip)}
          onClose={() => setCompleteModalTrip(null)}
          title={`Complete Ride: ${completeModalTrip.trip_number}`}
          size="lg"
        >
          <form onSubmit={handleCompleteTripSubmit} className="space-y-4 text-xs">
            {/* Trip Info Header */}
            <div className="p-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 text-white rounded-2xl shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-amber-400 text-sm">{completeModalTrip.trip_number}</span>
                <span className="text-[11px] bg-white/10 px-2 py-0.5 rounded-md font-semibold text-slate-200">
                  {completeModalTrip.trip_category || 'Duty'}
                </span>
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-100">{completeModalTrip.guest_names || completeModalTrip.customer_name || 'Guest'}</span>
                <span className="text-slate-400 mx-1.5">•</span>
                <span className="text-slate-300">{completeModalTrip.pickup_location} → {completeModalTrip.dropoff_location || completeModalTrip.destination}</span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-white/10">
                <span>Trip Date: <strong>{formatDate(completeModalTrip.trip_date || completeModalTrip.pickup_date || '')}</strong></span>
                <span>Trip Selling Price: <strong className="text-emerald-400 font-mono">{formatINR(completeModalTrip.trip_selling_price || 0)}</strong></span>
              </div>
            </div>

            {/* Driver Assignment if unassigned or change */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Assigned Driver *</label>
                <select
                  value={completeDriverId}
                  onChange={e => {
                    setCompleteDriverId(e.target.value);
                    const drv = drivers.find(d => d.id === e.target.value);
                    if (drv?.per_trip_payment) {
                      setCompleteDriverPay(drv.per_trip_payment);
                    }
                  }}
                  required
                  className="input-field font-semibold"
                >
                  <option value="">-- Select Driver --</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.full_name} ({d.phone}) {d.employment_type ? `• ${d.employment_type}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Driver Duty Pay (₹)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={completeDriverPay}
                  onChange={e => setCompleteDriverPay(e.target.value)}
                  className="input-field font-mono font-bold"
                />
              </div>
            </div>

            {/* 1. Guest Cash Collection */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                  <span>1. Guest Collection (Actual Cash Received by Driver)</span>
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCompleteAmountCollected(0)}
                    className="px-2 py-0.5 rounded text-[10px] bg-slate-200 hover:bg-slate-300 font-bold text-slate-700"
                  >
                    ₹0 (Prepaid / Hotel Bill)
                  </button>
                  {completeModalTrip.amount_driver_must_collect && (
                    <button
                      type="button"
                      onClick={() => setCompleteAmountCollected(completeModalTrip.amount_driver_must_collect || 0)}
                      className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 hover:bg-emerald-200 font-bold text-emerald-800"
                    >
                      ₹{completeModalTrip.amount_driver_must_collect} (Expected)
                    </button>
                  )}
                </div>
              </div>

              <div>
                <input
                  type="number"
                  min="0"
                  required
                  value={completeAmountCollected}
                  onChange={e => setCompleteAmountCollected(e.target.value)}
                  placeholder="0"
                  className="input-field font-mono font-bold text-sm"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Enter 0 if the ride is prepaid by customer or billed directly to hotel / homestay on monthly account.
                </span>
              </div>
            </div>

            {/* 2. On-Trip Running Expenses */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <label className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Fuel className="w-3.5 h-3.5 text-rose-600" />
                <span>2. On-Trip Running Expenses (Spent by Driver)</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Diesel / Petrol Expense (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={completeDiesel}
                    onChange={e => setCompleteDiesel(e.target.value)}
                    placeholder="0"
                    className="input-field font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="label">Toll, Parking, Permits (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={completeParkingToll}
                    onChange={e => setCompleteParkingToll(e.target.value)}
                    placeholder="0"
                    className="input-field font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="label">Toll / Parking / Other Details (Optional)</label>
                <input
                  type="text"
                  value={completeTollDetails}
                  onChange={e => setCompleteTollDetails(e.target.value)}
                  placeholder="e.g. Airport parking ₹120, Highway toll ₹80"
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="label">Workshop / Repairs (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={completeWorkshop}
                    onChange={e => setCompleteWorkshop(e.target.value)}
                    placeholder="0"
                    className="input-field font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="label">Repair Description (Optional)</label>
                  <input
                    type="text"
                    value={completeWorkshopDetails}
                    onChange={e => setCompleteWorkshopDetails(e.target.value)}
                    placeholder="e.g. Puncture repair, Bulb change"
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {/* 3. Driver Settlement Option & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <label className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={completeDriverSettled}
                  onChange={e => setCompleteDriverSettled(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-slate-800 text-xs block">Mark Driver as Settled</span>
                  <span className="text-[10px] text-slate-500">Check if payment/balance for this ride is already settled with driver</span>
                </div>
              </label>

              <div>
                <label className="label">Admin Notes</label>
                <input
                  type="text"
                  value={completeAdminNotes}
                  onChange={e => setCompleteAdminNotes(e.target.value)}
                  placeholder="Completed on behalf of driver"
                  className="input-field"
                />
              </div>
            </div>

            {/* Financial Accounting Calculation Breakdown */}
            {(() => {
              const pay = Number(completeDriverPay) || 0;
              const exp = (Number(completeDiesel) || 0) + (Number(completeParkingToll) || 0) + (Number(completeWorkshop) || 0);
              const credit = pay + exp;
              const collected = Number(completeAmountCollected) || 0;
              const netBalance = credit - collected;

              return (
                <div className="p-3.5 bg-slate-900 text-white rounded-2xl space-y-2">
                  <span className="font-bold text-[11px] text-slate-300 uppercase tracking-wider block border-b border-white/10 pb-1.5">
                    Live Duty Accounting Balance:
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white/5 p-2 rounded-xl">
                      <span className="text-slate-400 block text-[10px]">Driver Credit</span>
                      <span className="font-mono font-bold text-emerald-400">₹{credit.toLocaleString('en-IN')}</span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">(Pay ₹{pay} + Exp ₹{exp})</span>
                    </div>
                    <div className="bg-white/5 p-2 rounded-xl">
                      <span className="text-slate-400 block text-[10px]">Guest Cash</span>
                      <span className="font-mono font-bold text-amber-300">₹{collected.toLocaleString('en-IN')}</span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">(Collected)</span>
                    </div>
                    <div className={`p-2 rounded-xl font-bold ${netBalance >= 0 ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30' : 'bg-blue-950/80 text-blue-300 border border-blue-500/30'}`}>
                      <span className="text-[10px] block opacity-80">{netBalance >= 0 ? 'Office Pays Driver' : 'Driver Holds Cash'}</span>
                      <span className="font-mono text-sm font-black">₹{Math.abs(netBalance).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setCompleteModalTrip(null)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={completingTrip || !completeDriverId}
                className="btn-primary text-xs flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700"
              >
                {completingTrip ? <LoadingSpinner size="sm" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{completingTrip ? 'Completing Ride...' : 'Complete Ride & Save'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
      {/* Edit Trip Modal */}
      {isEditModalOpen && editingTrip && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Trip: ${editingTrip.trip_number}`}
          size="lg"
        >
          <form onSubmit={handleSaveTripEdit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="label">Trip Date *</label>
                <input
                  type="date"
                  required
                  value={editForm.trip_date}
                  onChange={e => setEditForm({ ...editForm, trip_date: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">Pickup Time *</label>
                <input
                  type="time"
                  required
                  value={editForm.pickup_time}
                  onChange={e => setEditForm({ ...editForm, pickup_time: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">Trip Category *</label>
                <select
                  value={editForm.trip_category}
                  onChange={e => setEditForm({ ...editForm, trip_category: e.target.value })}
                  className="input-field font-semibold"
                >
                  <option value="Airport Pick-up">Airport Pick-up</option>
                  <option value="Airport Drop">Airport Drop</option>
                  <option value="Sightseeing">Sightseeing</option>
                  <option value="Others">Others</option>
                  <option value="Drop Only at Location">Drop Only at Location</option>
                  <option value="Pick-up from Location">Pick-up from Location</option>
                </select>
              </div>
            </div>

            {/* Guest details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="label">Guest Name(s) *</label>
                <input
                  type="text"
                  required
                  value={editForm.guest_names}
                  onChange={e => setEditForm({ ...editForm, guest_names: e.target.value })}
                  className="input-field font-semibold"
                />
              </div>
              <div>
                <label className="label">Guest Phone / WhatsApp</label>
                <input
                  type="tel"
                  value={editForm.guest_contact_number}
                  onChange={e => setEditForm({ ...editForm, guest_contact_number: e.target.value })}
                  placeholder="+91..."
                  className="input-field font-mono"
                />
              </div>
              <div>
                <label className="label">Number of Passengers</label>
                <input
                  type="number"
                  min="1"
                  value={editForm.total_people}
                  onChange={e => setEditForm({ ...editForm, total_people: Number(e.target.value) || 1 })}
                  className="input-field font-bold"
                />
              </div>
            </div>

            {/* Route Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Pickup Location *</label>
                <input
                  type="text"
                  required
                  value={editForm.pickup_location}
                  onChange={e => setEditForm({ ...editForm, pickup_location: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">Drop-off / Places to Visit *</label>
                <input
                  type="text"
                  required
                  value={editForm.dropoff_location}
                  onChange={e => setEditForm({ ...editForm, dropoff_location: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            {/* Airport Terminal & Flight (if airport) */}
            {editForm.trip_category.toLowerCase().includes('airport') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-sky-50 rounded-xl border border-sky-200">
                <div>
                  <label className="label text-sky-900">Airport Terminal</label>
                  <select
                    value={editForm.airport_terminal}
                    onChange={e => setEditForm({ ...editForm, airport_terminal: e.target.value })}
                    className="input-field"
                  >
                    <option value="Terminal 1">Terminal 1 (Domestic)</option>
                    <option value="Terminal 2">Terminal 2 (International)</option>
                    <option value="NOT SET">NOT SET</option>
                  </select>
                </div>
                <div>
                  <label className="label text-sky-900">Flight Number & Time</label>
                  <input
                    type="text"
                    value={editForm.flight_number_and_time}
                    onChange={e => setEditForm({ ...editForm, flight_number_and_time: e.target.value })}
                    placeholder="e.g. 6E 521 at 18:30"
                    className="input-field uppercase font-mono"
                  />
                </div>
              </div>
            )}

            {/* Driver & Cab Assignment */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="label">Assigned Driver</label>
                <select
                  value={editForm.assigned_driver_id}
                  onChange={e => {
                    const drvId = e.target.value;
                    const drv = drivers.find(d => d.id === drvId);
                    setEditForm({
                      ...editForm,
                      assigned_driver_id: drvId,
                      driver_trip_pay_override: drv?.per_trip_payment ? drv.per_trip_payment : editForm.driver_trip_pay_override,
                    });
                  }}
                  className="input-field"
                >
                  <option value="">-- Unassigned --</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.full_name} ({d.phone}) • {d.vehicle_number || 'Fleet'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Assigned Vehicle / Cab</label>
                <select
                  value={editForm.assigned_vehicle_id}
                  onChange={e => setEditForm({ ...editForm, assigned_vehicle_id: e.target.value })}
                  className="input-field"
                >
                  <option value="">-- Default / Driver's Cab --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.registration_number} • {v.vehicle_type} ({v.ownership})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Required Cab Type</label>
                <select
                  value={editForm.required_cab_type}
                  onChange={e => setEditForm({ ...editForm, required_cab_type: e.target.value })}
                  className="input-field"
                >
                  <option value="Sedan">Sedan</option>
                  <option value="SUV">SUV</option>
                  <option value="Innova">Innova</option>
                  <option value="Ertiga">Ertiga</option>
                  <option value="Tempo Traveller 17-seater">Tempo Traveller 17-seater</option>
                  <option value="Tempo Traveller 26-seater">Tempo Traveller 26-seater</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Financials & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="label">Trip Selling Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={editForm.trip_selling_price}
                  onChange={e => setEditForm({ ...editForm, trip_selling_price: Number(e.target.value) || 0 })}
                  className="input-field font-mono font-bold"
                />
              </div>
              <div>
                <label className="label">Collection Rule</label>
                <select
                  value={editForm.collection_rule}
                  onChange={e => setEditForm({ ...editForm, collection_rule: e.target.value })}
                  className="input-field"
                >
                  <option value="Collect from guest">Collect from guest</option>
                  <option value="Do not collect">Do not collect</option>
                </select>
              </div>
              <div>
                <label className="label">Driver Collects (₹)</label>
                <input
                  type="number"
                  min="0"
                  disabled={editForm.collection_rule === 'Do not collect'}
                  value={editForm.collection_rule === 'Do not collect' ? 0 : editForm.amount_driver_must_collect}
                  onChange={e => setEditForm({ ...editForm, amount_driver_must_collect: Number(e.target.value) || 0 })}
                  className="input-field font-mono font-bold"
                />
              </div>
              <div>
                <label className="label">Driver Pay (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={editForm.driver_trip_pay_override}
                  onChange={e => setEditForm({ ...editForm, driver_trip_pay_override: Number(e.target.value) || 0 })}
                  className="input-field font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Trip Status</label>
                <select
                  value={editForm.trip_status}
                  onChange={e => setEditForm({ ...editForm, trip_status: e.target.value })}
                  className="input-field font-semibold"
                >
                  <option value="Confirmed">Confirmed / Upcoming</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Pending Approval">Pending Approval</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="label">Special Instructions / Notes</label>
                <input
                  type="text"
                  value={editForm.special_instructions}
                  onChange={e => setEditForm({ ...editForm, special_instructions: e.target.value })}
                  placeholder="e.g. Flight arrival delayed, 2 large luggage"
                  className="input-field"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingTrip}
                className="btn-primary text-xs"
              >
                {savingTrip ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Complete Ride by Admin Modal */}
      {completeModalTrip && (
        <Modal
          isOpen={Boolean(completeModalTrip)}
          onClose={() => setCompleteModalTrip(null)}
          title={`Complete Ride: ${completeModalTrip.trip_number}`}
          size="lg"
        >
          <form onSubmit={handleCompleteTripSubmit} className="space-y-4 text-xs">
            {/* Trip Info Header */}
            <div className="p-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 text-white rounded-2xl shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-amber-400 text-sm">{completeModalTrip.trip_number}</span>
                <span className="text-[11px] bg-white/10 px-2 py-0.5 rounded-md font-semibold text-slate-200">
                  {completeModalTrip.trip_category || 'Duty'}
                </span>
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-100">{completeModalTrip.guest_names || completeModalTrip.customer_name || 'Guest'}</span>
                <span className="text-slate-400 mx-1.5">•</span>
                <span className="text-slate-300">{completeModalTrip.pickup_location} → {completeModalTrip.dropoff_location || completeModalTrip.destination}</span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-white/10">
                <span>Trip Date: <strong>{formatDate(completeModalTrip.trip_date || completeModalTrip.pickup_date || '')}</strong></span>
                <span>Trip Selling Price: <strong className="text-emerald-400 font-mono">{formatINR(completeModalTrip.trip_selling_price || 0)}</strong></span>
              </div>
            </div>

            {/* Driver Assignment if unassigned or change */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Assigned Driver *</label>
                <select
                  value={completeDriverId}
                  onChange={e => {
                    setCompleteDriverId(e.target.value);
                    const drv = drivers.find(d => d.id === e.target.value);
                    if (drv?.per_trip_payment) {
                      setCompleteDriverPay(drv.per_trip_payment);
                    }
                  }}
                  required
                  className="input-field font-semibold"
                >
                  <option value="">-- Select Driver --</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.full_name} ({d.phone}) {d.employment_type ? `• ${d.employment_type}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Driver Duty Pay (₹)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={completeDriverPay}
                  onChange={e => setCompleteDriverPay(e.target.value)}
                  className="input-field font-mono font-bold"
                />
              </div>
            </div>

            {/* 1. Guest Cash Collection */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                  <span>1. Guest Collection (Actual Cash Received by Driver)</span>
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCompleteAmountCollected(0)}
                    className="px-2 py-0.5 rounded text-[10px] bg-slate-200 hover:bg-slate-300 font-bold text-slate-700"
                  >
                    ₹0 (Prepaid / Hotel Bill)
                  </button>
                  {completeModalTrip.amount_driver_must_collect && (
                    <button
                      type="button"
                      onClick={() => setCompleteAmountCollected(completeModalTrip.amount_driver_must_collect || 0)}
                      className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 hover:bg-emerald-200 font-bold text-emerald-800"
                    >
                      ₹{completeModalTrip.amount_driver_must_collect} (Expected)
                    </button>
                  )}
                </div>
              </div>

              <div>
                <input
                  type="number"
                  min="0"
                  required
                  value={completeAmountCollected}
                  onChange={e => setCompleteAmountCollected(e.target.value)}
                  placeholder="0"
                  className="input-field font-mono font-bold text-sm"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Enter 0 if the ride is prepaid by customer or billed directly to hotel / homestay on monthly account.
                </span>
              </div>
            </div>

            {/* 2. On-Trip Running Expenses */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <label className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Fuel className="w-3.5 h-3.5 text-rose-600" />
                <span>2. On-Trip Running Expenses (Spent by Driver)</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Diesel / Petrol Expense (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={completeDiesel}
                    onChange={e => setCompleteDiesel(e.target.value)}
                    placeholder="0"
                    className="input-field font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="label">Toll, Parking, Permits (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={completeParkingToll}
                    onChange={e => setCompleteParkingToll(e.target.value)}
                    placeholder="0"
                    className="input-field font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="label">Toll / Parking / Other Details (Optional)</label>
                <input
                  type="text"
                  value={completeTollDetails}
                  onChange={e => setCompleteTollDetails(e.target.value)}
                  placeholder="e.g. Airport parking ₹120, Highway toll ₹80"
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="label">Workshop / Repairs (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={completeWorkshop}
                    onChange={e => setCompleteWorkshop(e.target.value)}
                    placeholder="0"
                    className="input-field font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="label">Repair Description (Optional)</label>
                  <input
                    type="text"
                    value={completeWorkshopDetails}
                    onChange={e => setCompleteWorkshopDetails(e.target.value)}
                    placeholder="e.g. Puncture repair, Bulb change"
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {/* 3. Driver Settlement Option & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <label className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={completeDriverSettled}
                  onChange={e => setCompleteDriverSettled(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-slate-800 text-xs block">Mark Driver as Settled</span>
                  <span className="text-[10px] text-slate-500">Check if payment/balance for this ride is already settled with driver</span>
                </div>
              </label>

              <div>
                <label className="label">Admin Notes</label>
                <input
                  type="text"
                  value={completeAdminNotes}
                  onChange={e => setCompleteAdminNotes(e.target.value)}
                  placeholder="Completed on behalf of driver"
                  className="input-field"
                />
              </div>
            </div>

            {/* Financial Accounting Calculation Breakdown */}
            {(() => {
              const pay = Number(completeDriverPay) || 0;
              const exp = (Number(completeDiesel) || 0) + (Number(completeParkingToll) || 0) + (Number(completeWorkshop) || 0);
              const credit = pay + exp;
              const collected = Number(completeAmountCollected) || 0;
              const netBalance = credit - collected;

              return (
                <div className="p-3.5 bg-slate-900 text-white rounded-2xl space-y-2">
                  <span className="font-bold text-[11px] text-slate-300 uppercase tracking-wider block border-b border-white/10 pb-1.5">
                    Live Duty Accounting Balance:
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white/5 p-2 rounded-xl">
                      <span className="text-slate-400 block text-[10px]">Driver Credit</span>
                      <span className="font-mono font-bold text-emerald-400">₹{credit.toLocaleString('en-IN')}</span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">(Pay ₹{pay} + Exp ₹{exp})</span>
                    </div>
                    <div className="bg-white/5 p-2 rounded-xl">
                      <span className="text-slate-400 block text-[10px]">Guest Cash</span>
                      <span className="font-mono font-bold text-amber-300">₹{collected.toLocaleString('en-IN')}</span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">(Collected)</span>
                    </div>
                    <div className={`p-2 rounded-xl font-bold ${netBalance >= 0 ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30' : 'bg-blue-950/80 text-blue-300 border border-blue-500/30'}`}>
                      <span className="text-[10px] block opacity-80">{netBalance >= 0 ? 'Office Pays Driver' : 'Driver Holds Cash'}</span>
                      <span className="font-mono text-sm font-black">₹{Math.abs(netBalance).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setCompleteModalTrip(null)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={completingTrip || !completeDriverId}
                className="btn-primary text-xs flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700"
              >
                {completingTrip ? <LoadingSpinner size="sm" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{completingTrip ? 'Completing Ride...' : 'Complete Ride & Save'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default TripsPage;
