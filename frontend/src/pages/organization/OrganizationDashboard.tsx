import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Car,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Receipt,
  Building2,
  Calendar,
  MapPin,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Trip, Organization } from '../../types';
import { formatINR, formatDate, formatTime } from '../../utils/formatters';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/ui/StatusBadge';

const OrganizationDashboard: React.FC = () => {
  const { profile, organization } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalTrips: 0,
    upcomingTrips: 0,
    completedTrips: 0,
    pendingApproval: 0,
    outstandingBalance: 0,
    creditLimit: 0,
    creditStatus: 'OK',
  });

  useEffect(() => {
    loadOrgData();
  }, [organization?.id, profile?.id]);

  const loadOrgData = async () => {
    try {
      setLoading(true);
      const orgId = organization?.id;

      if (isSupabaseConfigured && orgId) {
        // Fetch trips for this organization
        const { data: tripData } = await supabase
          .from('trips')
          .select('*, driver:drivers(full_name, phone), vehicle:vehicles(registration_number, vehicle_type)')
          .eq('organization_id', orgId)
          .order('trip_date', { ascending: false });

        if (tripData) {
          setTrips(tripData as Trip[]);

          // Fetch organization summary view
          const { data: sumData } = await supabase
            .from('v_client_summary')
            .select('*')
            .eq('id', orgId)
            .maybeSingle();

          const total = tripData.length;
          const upcoming = tripData.filter(t => ['Confirmed', 'Assigned', 'In Progress'].includes(t.trip_status)).length;
          const completed = tripData.filter(t => t.trip_status === 'Completed').length;
          const pending = tripData.filter(t => t.trip_status === 'Pending Approval').length;

          setSummary({
            totalTrips: total,
            upcomingTrips: upcoming,
            completedTrips: completed,
            pendingApproval: pending,
            outstandingBalance: sumData?.outstanding_balance || 0,
            creditLimit: organization?.credit_limit || 0,
            creditStatus: sumData?.credit_check || 'OK',
          });
        }
      } else {
        // Mock fallback
        setSummary({
          totalTrips: 4,
          upcomingTrips: 2,
          completedTrips: 2,
          pendingApproval: 0,
          outstandingBalance: 3500,
          creditLimit: organization?.credit_limit || 15000,
          creditStatus: 'OK',
        });
      }
    } catch (err) {
      console.error('Failed to load partner dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const orgName = organization?.name || profile?.full_name || 'Partner';
  const orgType = organization?.type || 'Hotel / Travel Partner';

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0F1E36] to-[#1E3A8A] rounded-2xl text-white p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-900 uppercase">
                {orgType}
              </span>
              <span className="text-xs text-blue-200">
                Payment Terms: {organization?.payment_terms || 'Weekly settlement'}
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">{orgName}</h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Welcome to the VillaLemon Pickup Partner Portal. Submit guest pickup requests, track assigned drivers in real time, and view account statements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/org/trips/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Request New Pickup</span>
            </Link>
          </div>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 rounded-full bg-blue-500/10 pointer-events-none" />
      </div>

      {/* Credit Status Warning if Over Limit */}
      {summary.creditStatus === 'OVER LIMIT' && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold">Credit Limit Exceeded</p>
            <p className="text-red-700 mt-0.5">
              Your outstanding balance ({formatINR(summary.outstandingBalance)}) has exceeded your agreed credit limit of {formatINR(summary.creditLimit)}. Please settle pending invoices to ensure uninterrupted pickup dispatches.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pickups */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Total Pickups</span>
            <Car className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{summary.totalTrips}</p>
          <p className="text-[11px] text-slate-500 mt-1">Booked via portal</p>
        </div>

        {/* Upcoming / Active */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Upcoming</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-600">{summary.upcomingTrips}</p>
          <p className="text-[11px] text-slate-500 mt-1">Confirmed & assigned</p>
        </div>

        {/* Completed */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-600">{summary.completedTrips}</p>
          <p className="text-[11px] text-slate-500 mt-1">Safely dropped</p>
        </div>

        {/* Outstanding Balance */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Account Balance</span>
            <Receipt className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{formatINR(summary.outstandingBalance)}</p>
          <div className="flex items-center justify-between mt-1 text-[11px]">
            <span className="text-slate-500">Limit: {formatINR(summary.creditLimit)}</span>
            <span className={`font-bold ${summary.creditStatus === 'OVER LIMIT' ? 'text-red-600' : 'text-emerald-600'}`}>
              {summary.creditStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Trips Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Guest Pickups</h2>
            <p className="text-xs text-slate-500">Latest travel requests and live dispatch status</p>
          </div>
          <Link
            to="/org/trips"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <LoadingSpinner size="md" />
          </div>
        ) : trips.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Car className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No pickup requests yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Ready to schedule an airport transfer or sightseeing trip for your guests? Click below to request.
            </p>
            <Link
              to="/org/trips/new"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Submit First Request</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Trip #</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Guest Name(s)</th>
                  <th className="py-3 px-4">Route</th>
                  <th className="py-3 px-4">Assigned Driver</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trips.slice(0, 5).map(trip => (
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
                      <p className="text-slate-500 text-[11px]">{trip.guest_contact_number || trip.customer_phone || '-'}</p>
                    </td>
                    <td className="py-3 px-4 max-w-[200px] truncate">
                      <p className="font-medium text-slate-900">{trip.pickup_location}</p>
                      <p className="text-slate-500 text-[11px]">→ {trip.dropoff_location || trip.destination}</p>
                    </td>
                    <td className="py-3 px-4">
                      {trip.driver ? (
                        <div>
                          <p className="font-semibold text-slate-900">{trip.driver.full_name}</p>
                          <p className="text-slate-500 text-[11px]">{trip.driver.phone}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Assigning...</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={trip.trip_status} />
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatINR(trip.trip_selling_price || trip.amount_to_collect || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizationDashboard;

