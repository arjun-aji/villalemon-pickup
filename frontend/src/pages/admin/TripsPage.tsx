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
} from 'lucide-react';
import { tripService } from '../../services/tripService';
import { driverService } from '../../services/driverService';
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

  // Filters
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

  // Filtered trips
  const filteredTrips = trips.filter(trip => {
    if (activeTab === 'upcoming' && !['upcoming', 'assigned', 'available_for_enrollment'].includes(trip.trip_status)) {
      return false;
    }
    if (activeTab === 'in_progress' && trip.trip_status !== 'in_progress') {
      return false;
    }
    if (activeTab === 'completed' && trip.trip_status !== 'completed') {
      return false;
    }

    if (selectedDriver && trip.assigned_driver_id !== selectedDriver) {
      return false;
    }

    if (selectedStatus && trip.trip_status !== selectedStatus) {
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
  });

  const allCount = trips.length;
  const upcomingCount = trips.filter(t => ['upcoming', 'assigned', 'available_for_enrollment'].includes(t.trip_status)).length;
  const inProgressCount = trips.filter(t => t.trip_status === 'in_progress').length;
  const completedCount = trips.filter(t => t.trip_status === 'completed').length;

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Trips — All Pickups</h1>
          <p className="text-sm text-text-secondary">
            Manage, schedule, and assign driver pickup requests
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/trips/create')}
          className="btn-primary rounded-xl text-xs py-2.5 px-4 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Add Trip</span>
        </button>
      </div>

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
          className="input-field max-w-[160px] text-xs py-2"
        >
          <option value="">All Status</option>
          <option value="upcoming">Upcoming</option>
          <option value="available_for_enrollment">Available for Enrollment</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
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
                  const collectAmt = Number(trip.amount_to_collect || trip.amount_driver_must_collect || trip.trip_selling_price || 0);
                  const driverChg = Number(trip.driver_charge || trip.driver_trip_pay_override || 0);
                  const otherChg = Number(trip.other_fixed_charges || 0);
                  const profit = s?.net_profit !== undefined ? s.net_profit : collectAmt - driverChg - otherChg;

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
                      <td className="table-cell font-extrabold text-green-primary">
                        {formatINR(profit)}
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
            <div className="p-3.5 bg-green-light/40 rounded-xl border border-green-primary/20 space-y-1.5 text-xs">
              <p className="font-bold text-navy-primary uppercase text-[10px] tracking-wide">Financial Summary</p>
              <div className="flex justify-between">
                <span className="text-text-secondary">Customer Collection:</span>
                <span className="font-bold text-text-primary">{formatINR(viewTrip.amount_to_collect || viewTrip.amount_driver_must_collect || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Driver Charge:</span>
                <span className="font-medium text-text-primary">{formatINR(viewTrip.driver_charge || viewTrip.driver_trip_pay_override || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Additional Charges:</span>
                <span className="font-medium text-text-primary">{formatINR(viewTrip.other_fixed_charges || 0)}</span>
              </div>
              {viewTrip.settlement && (
                <div className="pt-1.5 border-t border-green-primary/20 flex justify-between font-bold">
                  <span>Net Trip Profit:</span>
                  <span className="text-green-primary font-black text-sm">{formatINR(viewTrip.settlement.net_profit)}</span>
                </div>
              )}
            </div>

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
              <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                <div className="border border-dashed p-3 rounded-lg space-y-3">
                  <p className="font-bold text-slate-700 text-[10px] uppercase">Odometer Readings</p>
                  <div className="flex justify-between">
                    <span>Starting KM: __________</span>
                    <span>Ending KM: __________</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tolls/Parking: ₹_______</span>
                    <span>Diesel: ₹_______</span>
                  </div>
                </div>

                <div className="border border-dashed p-3 rounded-lg flex flex-col justify-between">
                  <p className="font-bold text-slate-700 text-[10px] uppercase">Guest Signature</p>
                  <p className="text-[10px] text-slate-400 mt-6 pt-2 border-t">Signature / Rating / Feedback</p>
                </div>
              </div>
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
