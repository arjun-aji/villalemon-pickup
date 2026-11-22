import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Car,
  Copy,
  Check,
  ArrowRight,
  Phone,
  ArrowLeft,
  Navigation,
  Table as TableIcon,
  LayoutGrid,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { tripService } from '../../services/tripService';
import { supabase } from '../../lib/supabase';
import { Trip } from '../../types';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { formatINR, formatDate, formatTime } from '../../utils/formatters';

const DriverUpcomingTrips: React.FC = () => {
  const navigate = useNavigate();
  const { driver, profile, setDriver } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const getDayHighlight = (dateStr?: string) => {
    if (!dateStr) return null;
    const today = new Date();
    const todayYMD = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowYMD = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

    const tripYMD = dateStr.slice(0, 10);
    if (tripYMD === todayYMD) {
      return {
        type: 'today',
        label: '🟢 TODAY’S TRIP',
        borderClass: 'border-2 border-emerald-500 bg-emerald-50/20 ring-2 ring-emerald-500/20 shadow-md',
        badgeClass: 'bg-emerald-600 text-white font-extrabold shadow-sm',
      };
    }
    if (tripYMD === tomorrowYMD) {
      return {
        type: 'tomorrow',
        label: '🔵 TOMORROW’S TRIP',
        borderClass: 'border-2 border-blue-400 bg-blue-50/20 shadow-sm',
        badgeClass: 'bg-blue-600 text-white font-extrabold shadow-sm',
      };
    }
    return null;
  };

  const rawDriverId = driver?.id || '';
  const initialDriverName = driver?.full_name || profile?.full_name || 'Driver';

  useEffect(() => {
    loadMyTrips();
  }, [rawDriverId, driver?.full_name, profile?.full_name, driver?.phone, profile?.phone]);

  const loadMyTrips = async () => {
    try {
      setLoading(true);

      let effectiveDriverId = rawDriverId;
      let resolvedName = initialDriverName;

      const isRealUuid = (id?: string) => Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));

      const { data: allDbDrivers } = await supabase.from('drivers').select('*');
      if (allDbDrivers && allDbDrivers.length > 0) {
        if (!isRealUuid(effectiveDriverId)) {
          const cleanAlpha = initialDriverName.toLowerCase().replace(/[^a-z]/g, '');
          const cleanPhone = (driver?.phone || profile?.phone || '').replace(/[^0-9]/g, '');

          const matched = allDbDrivers.find(d => {
            const dPhone = (d.phone || '').replace(/[^0-9]/g, '');
            if (cleanPhone && cleanPhone.length >= 6 && dPhone.includes(cleanPhone)) return true;
            const dAlpha = (d.full_name || '').toLowerCase().replace(/[^a-z]/g, '');
            if (cleanAlpha && (dAlpha === cleanAlpha || dAlpha.includes(cleanAlpha) || cleanAlpha.includes(dAlpha))) return true;
            return false;
          });

          if (matched) {
            effectiveDriverId = matched.id;
            resolvedName = matched.full_name;
            if (setDriver) setDriver(matched as any);
          }
        }
      }

      const all = await tripService.getAll();

      const isUpcomingStatus = (st?: string) => {
        const s = (st || '').toLowerCase().replace(/[\s-]+/g, '_');
        return ['upcoming', 'assigned', 'confirmed', 'in_progress', 'pending_approval'].includes(s);
      };

      const myTrips = all.filter(t => {
        if (!isUpcomingStatus(t.trip_status)) return false;
        if (effectiveDriverId && t.assigned_driver_id === effectiveDriverId) return true;
        const tDrvName = (t.driver?.full_name || '').toLowerCase();
        const myName = resolvedName.toLowerCase().replace(/[^a-z]/g, '');
        if (tDrvName && myName && (tDrvName.includes(myName) || myName.includes(tDrvName))) return true;
        const tPhone = (t.driver?.phone || '').replace(/[^0-9]/g, '');
        const myPhone = (driver?.phone || profile?.phone || '').replace(/[^0-9]/g, '');
        if (myPhone && myPhone.length >= 6 && tPhone.includes(myPhone)) return true;
        return false;
      });

      setTrips(myTrips);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPlacard = (trip: Trip) => {
    const cust = trip.customer_name || trip.guest_names || 'Guest';
    const text = trip.placard_text || `VARKALA HOLIDAYS - ${cust.toUpperCase()}`;
    navigator.clipboard.writeText(text);
    setCopiedId(trip.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const [startingId, setStartingId] = useState<string | null>(null);

  const handleStartTrip = async (tripId: string) => {
    try {
      setStartingId(tripId);
      await tripService.updateStatus(tripId, 'In Progress');
      await loadMyTrips();
    } catch (e: any) {
      alert(e.message || 'Failed to start trip');
    } finally {
      setStartingId(null);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/driver/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-xl text-text-secondary"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-text-primary">My Upcoming Trips</h1>
            <p className="text-xs text-text-secondary">
              Trips assigned to you by VillaLemon admin
            </p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setViewMode('cards')}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              viewMode === 'cards' ? 'bg-white text-navy-primary shadow' : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Card View"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline text-[11px]">Cards</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              viewMode === 'table' ? 'bg-white text-navy-primary shadow' : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Table View"
          >
            <TableIcon className="w-4 h-4" />
            <span className="hidden sm:inline text-[11px]">Table</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-16 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : trips.length === 0 ? (
        <div className="card text-center py-12 text-text-secondary text-sm">
          No upcoming trips scheduled for your vehicle right now.
        </div>
      ) : viewMode === 'table' ? (
        /* ============================================================== */
        /* TABLE VIEW (Highlighting Current & Next Day Trips)             */
        /* ============================================================== */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#1F4E5F] text-white font-bold">
                  <th className="py-3 px-3">Duty Day</th>
                  <th className="py-3 px-3">Date & Time</th>
                  <th className="py-3 px-3">Trip ID & Cab</th>
                  <th className="py-3 px-3">Guest Information</th>
                  <th className="py-3 px-3">Route (Pickup → Drop-off)</th>
                  <th className="py-3 px-3">Collect</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trips.map(trip => {
                  const tripDate = trip.trip_date || trip.pickup_date || '';
                  const dayHighlight = getDayHighlight(tripDate);
                  const collectAmt = Number(trip.amount_driver_must_collect ?? trip.amount_to_collect ?? 0);
                  const isInProgress = (trip.trip_status || '').toLowerCase().replace(/[\s-]+/g, '_') === 'in_progress';

                  return (
                    <tr
                      key={trip.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        dayHighlight?.type === 'today'
                          ? 'bg-emerald-50/40 font-medium'
                          : dayHighlight?.type === 'tomorrow'
                          ? 'bg-blue-50/40'
                          : ''
                      }`}
                    >
                      <td className="py-3 px-3">
                        {dayHighlight ? (
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black ${dayHighlight.badgeClass}`}>
                            {dayHighlight.label}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-semibold">Scheduled</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{formatDate(tripDate)}</div>
                        <div className="text-slate-500 text-[11px]">{formatTime(trip.pickup_time || '')}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-navy-primary">{trip.trip_number}</div>
                        <div className="text-[11px] text-slate-500">
                          {trip.vehicle?.registration_number || trip.required_cab_type || 'Cab'}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{trip.guest_names || trip.customer_name || 'Guest'}</div>
                        {(trip.guest_contact_number || trip.customer_phone) && (
                          <a
                            href={`tel:${trip.guest_contact_number || trip.customer_phone}`}
                            className="text-[11px] text-emerald-700 font-semibold hover:underline block"
                          >
                            📞 {trip.guest_contact_number || trip.customer_phone}
                          </a>
                        )}
                        <span className="text-[10px] text-slate-400">{trip.total_people || 1} Pax</span>
                      </td>
                      <td className="py-3 px-3 max-w-[200px]">
                        <div className="font-medium text-slate-900 truncate" title={trip.pickup_location}>
                          📍 {trip.pickup_location}
                        </div>
                        <div className="text-slate-500 text-[11px] truncate" title={trip.dropoff_location || trip.destination}>
                          → {trip.dropoff_location || trip.destination}
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
                      <td className="py-3 px-3 font-mono">
                        {collectAmt > 0 ? (
                          <div>
                            <span className="font-black text-slate-900">{formatINR(collectAmt)}</span>
                            <span className="block text-[9px] font-bold text-emerald-700 uppercase">Collect Cash</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-semibold text-[11px]">Do not collect</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => navigate(`/driver/trips/${trip.id}`)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px]"
                          >
                            View
                          </button>
                          {isInProgress ? (
                            <button
                              onClick={() => navigate(`/driver/trips/${trip.id}/expenses`)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px]"
                            >
                              Expenses
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStartTrip(trip.id)}
                              disabled={startingId === trip.id}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px]"
                            >
                              {startingId === trip.id ? 'Starting...' : 'Start'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ============================================================== */
        /* CARDS VIEW (Highlighting Current & Next Day Trips)             */
        /* ============================================================== */
        <div className="max-w-md mx-auto space-y-4">
          {trips.map(trip => {
            const tripDate = trip.trip_date || trip.pickup_date || '';
            const dayHighlight = getDayHighlight(tripDate);

            return (
              <div
                key={trip.id}
                className={`card p-5 border space-y-3 shadow-card transition-all ${
                  dayHighlight?.borderClass || 'border-border'
                }`}
              >
                {/* Day Highlight Alert Ribbon */}
                {dayHighlight && (
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide uppercase ${dayHighlight.badgeClass}`}>
                      {dayHighlight.label}
                    </span>
                    <span className="text-[11px] font-bold text-slate-700">
                      {dayHighlight.type === 'today' ? 'Duty Scheduled For Today' : 'Duty Scheduled For Tomorrow'}
                    </span>
                  </div>
                )}

                {/* Trip ID & Status Header */}
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-navy-primary font-mono text-sm">
                      {trip.trip_number}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                      {trip.trip_category || 'Duty'}
                    </span>
                  </div>
                  <StatusBadge status={trip.trip_status} />
                </div>

                {/* Customer Info */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-text-primary text-base">{trip.guest_names || trip.customer_name || 'Guest'}</p>
                    {(trip.guest_contact_number || trip.customer_phone) && (
                      <a
                        href={`tel:${trip.guest_contact_number || trip.customer_phone}`}
                        className="text-xs text-green-primary font-semibold flex items-center gap-1 mt-0.5"
                      >
                        <Phone className="h-3 w-3" />
                        <span>{trip.guest_contact_number || trip.customer_phone}</span>
                      </a>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-text-secondary block">Collect</span>
                    <span className="text-sm font-black text-text-primary">
                      {formatINR(trip.amount_driver_must_collect ?? trip.amount_to_collect ?? 0)}
                    </span>
                  </div>
                </div>

                {/* Route */}
                <div className="p-3 bg-gray-50 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <span className="w-2 h-2 rounded-full bg-green-primary shrink-0" />
                    <span className="font-medium text-text-primary">{trip.pickup_location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-text-secondary">
                    <span className="w-2 h-2 rounded-full bg-navy-primary shrink-0" />
                    <span className="font-medium text-text-primary">{trip.dropoff_location || trip.destination}</span>
                  </div>
                  <div className="pt-1 text-[11px] text-text-secondary flex justify-between border-t border-border/60">
                    <span className="font-bold text-slate-900">{formatDate(tripDate)}</span>
                    <span className="font-semibold text-text-primary">{formatTime(trip.pickup_time || '')}</span>
                  </div>
                  {((trip.trip_category || '').toLowerCase().includes('airport') ||
                    (trip.pickup_location || '').toLowerCase().includes('airport') ||
                    (trip.dropoff_location || '').toLowerCase().includes('airport') ||
                    (trip.destination || '').toLowerCase().includes('airport')) && (
                    <div className="mt-1 p-2 bg-amber-50 border border-amber-300 rounded-lg text-amber-950 flex items-center gap-1.5 text-[11px]">
                      <span className="text-sm">⚠️</span>
                      <span className="font-extrabold">Verify the terminal with customer!</span>
                    </div>
                  )}
                </div>

                {/* Placard Box (Only for Airport trips or when placard text is set) */}
                {(trip.trip_category?.toLowerCase().includes('airport') || Boolean(trip.placard_text)) && (
                  <div className="p-3 bg-navy-sidebar text-white rounded-xl flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <span className="text-[9px] uppercase tracking-wider text-green-primary font-bold block">
                        Name Board / Placard
                      </span>
                      <p className="text-xs font-mono font-bold truncate">
                        {trip.placard_text || `VARKALA HOLIDAYS - ${(trip.customer_name || trip.guest_names || 'Guest').toUpperCase()}`}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCopyPlacard(trip)}
                      className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold shrink-0 flex items-center gap-1"
                    >
                      {copiedId === trip.id ? <Check className="h-3 w-3 text-green-primary" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedId === trip.id ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => navigate(`/driver/trips/${trip.id}`)}
                    className="btn-secondary text-xs py-2 justify-center rounded-xl"
                  >
                    View Details
                  </button>

                  {((trip.trip_status || '').toLowerCase().replace(/[\s-]+/g, '_') === 'in_progress') ? (
                    <button
                      onClick={() => navigate(`/driver/trips/${trip.id}/expenses`)}
                      className="btn-primary text-xs py-2 justify-center rounded-xl shadow-sm bg-emerald-600 hover:bg-emerald-700"
                    >
                      <span>Complete & Expenses</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartTrip(trip.id)}
                      disabled={startingId === trip.id}
                      className="btn-primary text-xs py-2 justify-center rounded-xl shadow-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
                    >
                      <Navigation className="h-3.5 w-3.5" />
                      <span>{startingId === trip.id ? 'Starting...' : 'Start Trip'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DriverUpcomingTrips;

