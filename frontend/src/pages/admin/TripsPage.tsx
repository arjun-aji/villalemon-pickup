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
} from 'lucide-react';
import { tripService } from '../../services/tripService';
import { driverService } from '../../services/driverService';
import { excelExportService } from '../../services/excelExportService';
import { Trip, DriverEmployee, TripStatus } from '../../types';
import StatusBadge from '../../components/ui/StatusBadge';
import SearchInput from '../../components/ui/SearchInput';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { formatINR, formatDate, formatTime } from '../../utils/formatters';

const TripsPage: React.FC = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [drivers, setDrivers] = useState<DriverEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingExcel, setExportingExcel] = useState(false);

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
  const [selectedAssignDriverId, setSelectedAssignDriverId] = useState('');
  const [viewTrip, setViewTrip] = useState<Trip | null>(null);
  const [dispatchTrip, setDispatchTrip] = useState<Trip | null>(null);
  const [tripSheetTrip, setTripSheetTrip] = useState<Trip | null>(null);
  const [copiedPlacard, setCopiedPlacard] = useState(false);
  const [copiedDispatch, setCopiedDispatch] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allTrips, allDrivers] = await Promise.all([
        tripService.getAll(),
        driverService.getAll(),
      ]);
      setTrips(allTrips);
      setDrivers(allDrivers);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
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
    if (!assignModalTrip || !selectedAssignDriverId) return;
    try {
      await tripService.assignDriver(assignModalTrip.id, selectedAssignDriverId);
      setAssignModalTrip(null);
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
    const tripNum = t.trip_number;
    const dateStr = formatDate(t.trip_date || t.pickup_date || '');
    const timeStr = formatTime(t.pickup_time || '');
    const guest = t.guest_names || t.customer_name || 'Guest';
    const phone = t.guest_contact_number || t.customer_phone || '-';
    const pax = t.total_people || t.num_passengers || 1;
    const cat = t.trip_category || 'Airport Pick-up';
    const flight = t.flight_number_and_time || t.flight_number || '-';
    const terminal = t.airport_terminal ? ` (${t.airport_terminal})` : '';
    const pickup = t.pickup_location;
    const drop = t.dropoff_location || t.destination;
    const vehicle = t.vehicle ? `${t.vehicle.vehicle_type} (${t.vehicle.registration_number})` : (t.required_cab_type || 'Cab');
    const driver = t.driver ? `${t.driver.full_name} (${t.driver.phone})` : 'Unassigned';
    const collect = t.collection_rule === 'Do not collect'
      ? 'DO NOT COLLECT (Office Billed)'
      : `Collect ${formatINR(t.amount_driver_must_collect || t.amount_to_collect || 0)} from guest`;
    const pay = formatINR(t.driver_trip_pay_override || t.driver_charge || 0);
    const placard = t.placard_text || `VARKALA HOLIDAYS - ${guest.toUpperCase()}`;
    const notes = t.special_instructions || t.trip_notes || 'None';

    return `🚖 *VARKALA HOLIDAYS — TRIP DISPATCH* 🚖
━━━━━━━━━━━━━━━━━━━━━
📋 *Trip ID:* ${tripNum}
📅 *Date & Time:* ${dateStr} at ${timeStr}
🏷️ *Category:* ${cat}

👤 *Guest Name:* ${guest}
📞 *Guest Phone:* ${phone}
👥 *Passengers:* ${pax} pax

📍 *Pickup:* ${pickup}
🏁 *Drop-off:* ${drop}
✈️ *Flight/Train:* ${flight}${terminal}

🚗 *Vehicle:* ${vehicle}
👨‍✈️ *Driver:* ${driver}

💰 *Collection Rule:* *${collect}*
💵 *Driver Pay:* ${pay}
🪧 *Airport Placard:* ${placard}

📝 *Special Instructions:*
${notes}
━━━━━━━━━━━━━━━━━━━━━
_Please confirm receipt and report duty start._`;
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

  // Helper to sort trips: Upcoming first (with latest upcoming trip first), and Completed after upcoming
  const sortTripsUpcomingFirst = (tripsList: Trip[]): Trip[] => {
    const getStatusRank = (status?: string) => {
      const s = (status || '').toLowerCase().replace(/[\s-]+/g, '_');
      if (s === 'in_progress') return 1;
      if (['assigned', 'confirmed', 'pending_approval', 'upcoming', 'available_for_enrollment', 'open_for_enrollment'].includes(s)) return 2;
      if (s === 'completed') return 3;
      if (s === 'cancelled') return 4;
      return 2;
    };

    return [...tripsList].sort((a, b) => {
      const rankA = getStatusRank(a.trip_status);
      const rankB = getStatusRank(b.trip_status);
      if (rankA !== rankB) return rankA - rankB;

      const dateA = a.trip_date || a.pickup_date || '';
      const dateB = b.trip_date || b.pickup_date || '';
      if (dateA !== dateB) return dateB.localeCompare(dateA);

      const timeA = a.pickup_time || '';
      const timeB = b.pickup_time || '';
      if (timeA !== timeB) return timeB.localeCompare(timeA);

      return (b.created_at || '').localeCompare(a.created_at || '');
    });
  };

  // Filtered trips for Standard View (ordered: latest upcoming first, completed after upcoming)
  const filteredTrips = sortTripsUpcomingFirst(
    trips.filter(trip => {
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
    .sort((a, b) => {
      const dateA = a.trip_date || a.pickup_date || '';
      const dateB = b.trip_date || b.pickup_date || '';
      if (dateA !== dateB) return dateA.localeCompare(dateB);

      const timeA = a.pickup_time || '';
      const timeB = b.pickup_time || '';
      if (timeA !== timeB) return timeA.localeCompare(timeB);

      return (a.trip_number || '').localeCompare(b.trip_number || '');
    });

  // End date calculation for Trip Sheet summary banner
  const getTripSheetEndDate = () => {
    const s = new Date(tripSheetStartDate || '2026-11-01');
    s.setDate(s.getDate() + (tripSheetDays > 1 ? tripSheetDays - 1 : 0));
    return s.toISOString().slice(0, 10);
  };

  const allCount = trips.length;
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
                      <th className="py-3 px-3 font-bold text-center border-r border-[#153b49] w-[190px]">
                        Guest / Passengers / Contact
                      </th>
                      <th className="py-3 px-3 font-bold text-center border-r border-[#153b49] w-[180px]">
                        Pickup (terminal)
                      </th>
                      <th className="py-3 px-3 font-bold text-center border-r border-[#153b49] w-[240px]">
                        Drop-off / places to visit
                      </th>
                      <th className="py-3 px-3 font-bold text-center border-r border-[#153b49] w-[150px]">
                        Vehicle
                      </th>
                      <th className="py-3 px-3 font-bold text-center border-r border-[#153b49] w-[140px]">
                        Collect from guest
                      </th>
                      <th className="py-3 px-3 font-bold text-center border-r border-[#153b49] w-[200px]">
                        Note
                      </th>
                      <th className="py-3 px-3 font-bold text-center w-[110px]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {tripSheetTrips.map(trip => {
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
                      const vehicleReg = trip.vehicle?.registration_number || (trip as any).vehicle_reg || 'not assigned';
                      const cabType = trip.vehicle?.vehicle_type || trip.required_cab_type || 'Sedan';
                      const collectAmt = Number(trip.amount_driver_must_collect || trip.amount_to_collect || 0);
                      const note = trip.special_instructions || '-';

                      return (
                        <tr key={trip.id} className="hover:bg-slate-50 transition-colors align-top">
                          {/* Col 1: Date / Time */}
                          <td className="p-3 border-r border-slate-200 text-slate-800 leading-snug">
                            <div className="font-bold text-slate-900">{dateStr}</div>
                            <div className="text-slate-500 text-[11px] font-medium">{timeStr}</div>
                          </td>

                          {/* Col 2: Trip ID / Category / Flight */}
                          <td className="p-3 border-r border-slate-200 leading-snug">
                            <div className="font-mono font-bold text-navy-primary">{trip.trip_number}</div>
                            <div className="text-slate-700 font-medium">{category}</div>
                            {flightInfo && (
                              <div className="text-blue-700 text-[11px] font-semibold">
                                Flight: {flightInfo}
                              </div>
                            )}
                          </td>

                          {/* Col 3: Guest / Passengers / Contact */}
                          <td className="p-3 border-r border-slate-200 leading-snug">
                            <div className="font-bold text-slate-900">{guest}</div>
                            <div className="text-slate-600 text-[11px]">Passengers: {pax}</div>
                            <div className="text-slate-500 text-[11px]">Contact: {contact}</div>
                          </td>

                          {/* Col 4: Pickup (terminal) */}
                          <td className="p-3 border-r border-slate-200 leading-snug">
                            <div className="font-medium text-slate-900">{pickup}</div>
                            {terminal && (
                              <div className="text-slate-600 text-[11px]">
                                Terminal: <strong className="text-slate-800">{terminal}</strong>
                              </div>
                            )}
                          </td>

                          {/* Col 5: Drop-off / places to visit */}
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

                          {/* Col 6: Vehicle */}
                          <td className="p-3 border-r border-slate-200 leading-snug">
                            <div className="font-mono font-bold text-slate-900">{vehicleReg}</div>
                            <div className="text-slate-500 text-[11px]">({cabType})</div>
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
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setTripSheetTrip(trip)}
                                className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
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
                      <th className="table-header">Route</th>
                      <th className="table-header">Driver</th>
                      <th className="table-header">Collect</th>
                      <th className="table-header">Profit</th>
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
                      const otherExp = Number(rep?.workshop_expense ?? s?.other_expenses ?? trip.other_fixed_charges ?? 0);
                      const totalExp = petrolExp + foodTollExp + otherExp;

                      const collectAmt = Number(trip.trip_selling_price || trip.amount_driver_must_collect || trip.amount_to_collect || 0);
                      const driverChg = Number(trip.driver_trip_pay_override || trip.driver_charge || (trip.driver?.employment_type === 'Per-trip payment' ? trip.driver?.per_trip_payment : 0) || 0);
                      const profit = s?.net_profit !== undefined ? s.net_profit : collectAmt - driverChg - totalExp;

                      return (
                        <tr key={trip.id} className="hover:bg-slate-50 transition-colors">
                          <td className="table-cell font-mono font-bold text-navy-primary">
                            {trip.trip_number}
                          </td>
                          <td className="table-cell">
                            <div>
                              <p className="font-semibold text-text-primary text-sm">{trip.customer_name || trip.guest_names || 'Guest'}</p>
                              <p className="text-xs text-text-secondary">{trip.customer_phone || trip.guest_contact_number || '-'}</p>
                            </div>
                          </td>
                          <td className="table-cell text-xs">
                            <p className="font-semibold text-text-primary">{formatDate(trip.pickup_date || trip.trip_date || '')}</p>
                            <p className="text-text-secondary">{formatTime(trip.pickup_time || '')}</p>
                          </td>
                          <td className="table-cell text-xs text-text-secondary">
                            <p className="font-medium text-text-primary truncate max-w-[200px]">
                              {trip.pickup_location} → {trip.destination || trip.dropoff_location}
                            </p>
                            {trip.flight_number && (
                              <span className="text-[11px] text-blue-600 font-semibold">
                                Flt: {trip.flight_number}
                              </span>
                            )}
                          </td>
                          <td className="table-cell text-sm">
                            {trip.driver ? (
                              <div>
                                <span className="font-semibold text-text-primary text-xs">{trip.driver.full_name}</span>
                                <p className="text-[11px] text-text-secondary font-mono">{trip.driver.vehicle_number || ''}</p>
                              </div>
                            ) : (
                              <span className="badge-yellow text-xs">Unassigned</span>
                            )}
                          </td>
                          <td className="table-cell font-bold text-text-primary">
                            {formatINR(collectAmt)}
                          </td>
                          <td className="table-cell">
                            <div>
                              <p className={`font-mono font-extrabold text-sm ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatINR(profit)}
                              </p>
                              {totalExp > 0 && (
                                <p className="text-[10px] text-slate-500 font-medium">
                                  -₹{totalExp} exp ({petrolExp > 0 ? `₹${petrolExp} fuel` : ''}{petrolExp > 0 && foodTollExp > 0 ? ', ' : ''}{foodTollExp > 0 ? `₹${foodTollExp} food/toll` : ''})
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="table-cell">
                            <StatusBadge status={trip.trip_status} />
                          </td>
                          <td className="table-cell text-right">
                            <div className="flex items-center justify-end gap-1.5">
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
                              <button
                                onClick={() => setDispatchTrip(trip)}
                                className="p-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors"
                                title="Generate WhatsApp Driver Dispatch"
                              >
                                <MessageSquare className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setTripSheetTrip(trip)}
                                className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
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
                                <>
                                  <button
                                    onClick={() => {
                                      setAssignModalTrip(trip);
                                      setSelectedAssignDriverId('');
                                    }}
                                    className="px-2.5 py-1 text-xs bg-navy-primary hover:bg-navy-light text-white font-semibold rounded-lg transition-colors"
                                  >
                                    Assign
                                  </button>
                                  {!trip.is_published_for_enrollment && (
                                    <button
                                      onClick={() => handlePublishForEnrollment(trip.id)}
                                      className="px-2.5 py-1 text-xs bg-green-light hover:bg-green-100 text-green-primary font-semibold rounded-lg transition-colors"
                                      title="Publish for driver enrollment"
                                    >
                                      Publish
                                    </button>
                                  )}
                                </>
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
              <p><strong>Customer:</strong> {assignModalTrip.customer_name}</p>
              <p><strong>Route:</strong> {assignModalTrip.pickup_location} → {assignModalTrip.destination}</p>
              <p><strong>Date & Time:</strong> {formatDate(assignModalTrip.pickup_date || assignModalTrip.trip_date || '')} at {formatTime(assignModalTrip.pickup_time || '')}</p>
              <p><strong>Driver Charge:</strong> {formatINR(assignModalTrip.driver_charge || assignModalTrip.driver_trip_pay_override || 0)}</p>
            </div>

            <div>
              <label className="label">Select Driver</label>
              <select
                value={selectedAssignDriverId}
                onChange={e => setSelectedAssignDriverId(e.target.value)}
                className="input-field"
              >
                <option value="">-- Choose an active driver --</option>
                {drivers
                  .filter(d => d.employment_status === 'active')
                  .map(d => (
                    <option key={d.id} value={d.id}>
                      {d.full_name} ({d.username}) • {d.vehicle_number || 'No Vehicle'}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setAssignModalTrip(null)} className="btn-secondary text-xs">
                Cancel
              </button>
              <button
                onClick={handleAssignDriver}
                disabled={!selectedAssignDriverId}
                className="btn-primary text-xs"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
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
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Driver Pay / Charge:</span>
                    <span className="font-medium text-text-primary">{formatINR(dDriverCharge)}</span>
                  </div>
                  {dPetrol > 0 && (
                    <div className="flex justify-between text-expense">
                      <span>Petrol / Diesel Expense:</span>
                      <span className="font-medium">-{formatINR(dPetrol)}</span>
                    </div>
                  )}
                  {dFoodToll > 0 && (
                    <div className="flex justify-between text-expense">
                      <span>Food / Toll / Parking Expense:</span>
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

            {viewTrip.trip_notes && (
              <div className="text-xs text-text-secondary bg-gray-50 p-3 rounded-xl">
                <strong className="text-text-primary block mb-0.5">Special Instructions:</strong>
                {viewTrip.trip_notes}
              </div>
            )}
          </div>
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

              <div className="border rounded-lg p-3 space-y-1">
                <p className="font-bold text-slate-800">Route & Duty Details</p>
                <p className="text-slate-700">Pickup: <strong>{tripSheetTrip.pickup_location}</strong> at {formatTime(tripSheetTrip.pickup_time || '')}</p>
                <p className="text-slate-700">Drop-off: <strong>{tripSheetTrip.dropoff_location || tripSheetTrip.destination}</strong></p>
                <p className="text-slate-700">Collection: <strong>{tripSheetTrip.collection_rule === 'Do not collect' ? 'Do not collect (Office)' : `Collect ${formatINR(tripSheetTrip.amount_driver_must_collect || tripSheetTrip.amount_to_collect || 0)}`}</strong></p>
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
                        <span>Tolls/Food/Parking: <strong>{sheetToll ? formatINR(sheetToll) : '₹_______'}</strong></span>
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
    </div>
  );
};

export default TripsPage;
