import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Car,
  Search,
  Filter,
  PlusCircle,
  Calendar,
  MapPin,
  Phone,
  Plane,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Trip, TripStatus } from '../../types';
import { formatINR, formatDate, formatTime } from '../../utils/formatters';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/ui/StatusBadge';

const OrganizationTrips: React.FC = () => {
  const { organization } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  useEffect(() => {
    loadTrips();
  }, [organization?.id]);

  const loadTrips = async () => {
    try {
      setLoading(true);
      if (isSupabaseConfigured && organization?.id) {
        const { data, error } = await supabase
          .from('trips')
          .select('*, driver:drivers(full_name, phone), vehicle:vehicles(registration_number, vehicle_type)')
          .eq('organization_id', organization.id)
          .order('trip_date', { ascending: false });

        if (error) throw error;
        setTrips((data as Trip[]) || []);
      } else {
        setTrips([]);
      }
    } catch (err) {
      console.error('Error fetching partner trips:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = trips.filter(t => {
    if (statusFilter !== 'all' && t.trip_status !== statusFilter) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNumber = (t.trip_number || '').toLowerCase().includes(q);
      const matchGuest = (t.guest_names || t.customer_name || '').toLowerCase().includes(q);
      const matchPickup = (t.pickup_location || '').toLowerCase().includes(q);
      const matchDrop = (t.dropoff_location || t.destination || '').toLowerCase().includes(q);
      return matchNumber || matchGuest || matchPickup || matchDrop;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Partner Duty Trips</h1>
          <p className="text-xs text-slate-500">
            View all guest pickups, approval progress, and real-time driver dispatch tracking
          </p>
        </div>

        <Link
          to="/org/trips/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Request New Trip</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search trip #, guest, route..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="all">All Statuses ({trips.length})</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Trips Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Car className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No trips match your filter</p>
            <p className="text-xs text-slate-500 mt-1">Try selecting another status or submit a new pickup request.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Trip #</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Guest Info</th>
                  <th className="py-3 px-4">Route</th>
                  <th className="py-3 px-4">Cab Type</th>
                  <th className="py-3 px-4">Assigned Driver</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Price</th>
                  <th className="py-3 px-4 text-center">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(trip => (
                  <tr key={trip.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-900">
                      {trip.trip_number}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{formatDate(trip.trip_date || trip.pickup_date || '')}</p>
                      <p className="text-slate-500 text-[11px]">{formatTime(trip.pickup_time || '')}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{trip.guest_names || trip.customer_name || 'Guest'}</p>
                      <p className="text-slate-500 text-[11px]">
                        {trip.guest_contact_number || trip.customer_phone || '-'} ({trip.total_people || 1} pax)
                      </p>
                    </td>
                    <td className="py-3 px-4 max-w-[200px] truncate">
                      <p className="font-medium text-slate-900">{trip.pickup_location}</p>
                      <p className="text-slate-500 text-[11px]">→ {trip.dropoff_location || trip.destination}</p>
                      {trip.flight_number_and_time && (
                        <p className="text-blue-600 font-mono text-[10px] font-bold mt-0.5">
                          ✈ {trip.flight_number_and_time}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-700">{trip.required_cab_type || 'Sedan'}</span>
                    </td>
                    <td className="py-3 px-4">
                      {trip.driver ? (
                        <div>
                          <p className="font-semibold text-slate-900">{trip.driver.full_name}</p>
                          <a
                            href={`tel:${trip.driver.phone}`}
                            className="text-emerald-700 hover:underline text-[11px] font-mono flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{trip.driver.phone}</span>
                          </a>
                          {trip.vehicle && (
                            <p className="text-slate-400 font-mono text-[10px]">
                              {trip.vehicle.registration_number}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Pending dispatch</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={trip.trip_status} />
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatINR(trip.trip_selling_price || trip.amount_to_collect || 0)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedTrip(trip)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                        title="View Trip Duty Sheet"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Duty Sheet Modal */}
      {selectedTrip && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-blue-900 block">{selectedTrip.trip_number}</span>
                <h3 className="text-base font-bold text-slate-900">Duty Sheet & Instructions</h3>
              </div>
              <button
                onClick={() => setSelectedTrip(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <p className="text-slate-400 uppercase text-[10px] font-bold">Guest & Schedule</p>
                <p className="font-bold text-slate-900 text-sm">{selectedTrip.guest_names || 'Guest'}</p>
                <p className="text-slate-600">
                  {formatDate(selectedTrip.trip_date || selectedTrip.pickup_date || '')} at {formatTime(selectedTrip.pickup_time || '')}
                </p>
                <p className="text-slate-600">Phone: {selectedTrip.guest_contact_number || '-'}</p>
                <p className="text-slate-600">Passengers: {selectedTrip.total_people || 1}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <p className="text-slate-400 uppercase text-[10px] font-bold">Routing</p>
                <p className="font-semibold text-slate-900">
                  {selectedTrip.pickup_location} → {selectedTrip.dropoff_location || selectedTrip.destination}
                </p>
                {selectedTrip.flight_number_and_time && (
                  <p className="text-blue-600 font-bold">Flight: {selectedTrip.flight_number_and_time}</p>
                )}
                {selectedTrip.airport_terminal && (
                  <p className="text-slate-600">Terminal: {selectedTrip.airport_terminal}</p>
                )}
              </div>

              {selectedTrip.special_instructions && (
                <div className="p-3 bg-amber-50 border border-amber-200/60 rounded-xl space-y-1">
                  <p className="text-amber-800 uppercase text-[10px] font-bold">Placard & Instructions</p>
                  <p className="text-amber-900 font-medium">{selectedTrip.special_instructions}</p>
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <p className="text-slate-400 uppercase text-[10px] font-bold">Assigned Crew</p>
                {selectedTrip.driver ? (
                  <div>
                    <p className="font-bold text-slate-900">{selectedTrip.driver.full_name} ({selectedTrip.driver.phone})</p>
                    <p className="text-slate-600">Vehicle: {selectedTrip.vehicle?.registration_number || selectedTrip.required_cab_type}</p>
                  </div>
                ) : (
                  <p className="text-slate-500 italic">Operations team is finalizing driver assignment.</p>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedTrip(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationTrips;
