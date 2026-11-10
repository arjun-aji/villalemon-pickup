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

  // Assign Driver Modal
  const [assignModalTrip, setAssignModalTrip] = useState<Trip | null>(null);
  const [selectedAssignDriverId, setSelectedAssignDriverId] = useState('');

  // View Trip Details Modal
  const [viewTrip, setViewTrip] = useState<Trip | null>(null);
  const [copiedPlacard, setCopiedPlacard] = useState(false);

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
      const matchNumber = trip.trip_number.toLowerCase().includes(q);
      const matchCustomer = trip.customer_name.toLowerCase().includes(q);
      const matchDriver = trip.driver?.full_name?.toLowerCase().includes(q);
      const matchLocation = trip.pickup_location.toLowerCase().includes(q);
      const matchDest = trip.destination.toLowerCase().includes(q);
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
                  const profit = s?.net_profit !== undefined
                    ? s.net_profit
                    : trip.amount_to_collect - trip.driver_charge - (trip.other_fixed_charges || 0);

                  return (
                    <tr key={trip.id} className="hover:bg-slate-50 transition-colors">
                      <td className="table-cell font-mono font-bold text-navy-primary">
                        {trip.trip_number}
                      </td>
                      <td className="table-cell">
                        <div>
                          <p className="font-semibold text-text-primary text-sm">{trip.customer_name}</p>
                          <p className="text-xs text-text-secondary">{trip.customer_phone}</p>
                        </div>
                      </td>
                      <td className="table-cell text-xs">
                        <p className="font-semibold text-text-primary">{formatDate(trip.pickup_date)}</p>
                        <p className="text-text-secondary">{formatTime(trip.pickup_time)}</p>
                      </td>
                      <td className="table-cell text-xs text-text-secondary">
                        <p className="font-medium text-text-primary truncate max-w-[200px]">
                          {trip.pickup_location} → {trip.destination}
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
                        {formatINR(trip.amount_to_collect)}
                      </td>
                      <td className="table-cell font-extrabold text-green-primary">
                        {formatINR(profit)}
                      </td>
                      <td className="table-cell">
                        <StatusBadge status={trip.trip_status} />
                      </td>
                      <td className="table-cell text-right">
                        <div className="flex items-center justify-end gap-1.5">
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
              <p><strong>Date & Time:</strong> {formatDate(assignModalTrip.pickup_date)} at {formatTime(assignModalTrip.pickup_time)}</p>
              <p><strong>Driver Charge:</strong> {formatINR(assignModalTrip.driver_charge)}</p>
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
                  Created {formatDate(viewTrip.created_at)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-text-secondary block">Amount to Collect</span>
                <span className="text-lg font-black text-navy-primary font-mono">
                  {formatINR(viewTrip.amount_to_collect)}
                </span>
              </div>
            </div>

            {/* Customer & Route Details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                <p className="text-text-secondary font-semibold uppercase text-[10px]">Customer Information</p>
                <p className="font-bold text-text-primary text-sm">{viewTrip.customer_name}</p>
                <p className="text-text-primary flex items-center gap-1 font-medium">
                  <Phone className="h-3.5 w-3.5 text-green-primary" /> {viewTrip.customer_phone}
                </p>
                <p className="text-text-secondary">Passengers: {viewTrip.num_passengers || 1}</p>
                {viewTrip.flight_number && (
                  <p className="text-blue-600 font-bold flex items-center gap-1">
                    <Plane className="h-3.5 w-3.5" /> Flight: {viewTrip.flight_number}
                  </p>
                )}
              </div>

              <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                <p className="text-text-secondary font-semibold uppercase text-[10px]">Route & Schedule</p>
                <p className="font-semibold text-text-primary">
                  {viewTrip.pickup_location} → {viewTrip.destination}
                </p>
                <p className="text-text-secondary flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-green-primary" /> {formatDate(viewTrip.pickup_date)} at {formatTime(viewTrip.pickup_time)}
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
                  onClick={() => handleCopyPlacard(viewTrip.placard_text || `VARKALA HOLIDAYS - ${viewTrip.customer_name.toUpperCase()}`)}
                  className="text-xs font-semibold text-green-primary hover:underline flex items-center gap-1"
                >
                  {copiedPlacard ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedPlacard ? 'Copied' : 'Copy Placard'}</span>
                </button>
              </div>
              <div className="p-4 bg-navy-sidebar text-white rounded-xl text-center border-2 border-dashed border-green-primary/50 font-mono font-bold tracking-widest text-sm">
                {viewTrip.placard_text || `VARKALA HOLIDAYS - ${viewTrip.customer_name.toUpperCase()}`}
              </div>
            </div>

            {/* Financial Breakdown */}
            <div className="p-3.5 bg-green-light/40 rounded-xl border border-green-primary/20 space-y-1.5 text-xs">
              <p className="font-bold text-navy-primary uppercase text-[10px] tracking-wide">Financial Summary</p>
              <div className="flex justify-between">
                <span className="text-text-secondary">Customer Collection:</span>
                <span className="font-bold text-text-primary">{formatINR(viewTrip.amount_to_collect)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Driver Charge:</span>
                <span className="font-medium text-text-primary">{formatINR(viewTrip.driver_charge)}</span>
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
    </div>
  );
};

export default TripsPage;
