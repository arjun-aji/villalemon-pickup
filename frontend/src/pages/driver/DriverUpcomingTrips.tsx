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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { tripService } from '../../services/tripService';
import { Trip } from '../../types';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { formatINR, formatDate, formatTime } from '../../utils/formatters';

const DriverUpcomingTrips: React.FC = () => {
  const navigate = useNavigate();
  const { driver } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const driverId = driver?.id || '';

  useEffect(() => {
    loadMyTrips();
  }, [driverId]);

  const loadMyTrips = async () => {
    try {
      setLoading(true);
      if (!driverId) {
        setTrips([]);
        return;
      }
      const all = await tripService.getAll();
      const myTrips = all.filter(
        t => t.assigned_driver_id === driverId && ['upcoming', 'assigned', 'in_progress'].includes(t.trip_status)
      );
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

  const handleStartTrip = async (tripId: string) => {
    try {
      await tripService.updateStatus(tripId, 'in_progress');
      loadMyTrips();
    } catch (e: any) {
      alert(e.message || 'Failed to start trip');
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-4 pb-12">
      {/* Header */}
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

      {loading ? (
        <div className="p-16 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : trips.length === 0 ? (
        <div className="card text-center py-12 text-text-secondary text-sm">
          No upcoming trips scheduled for your vehicle right now.
        </div>
      ) : (
        <div className="space-y-4">
          {trips.map(trip => (
            <div key={trip.id} className="card p-5 border border-border space-y-3 shadow-card">
              {/* Trip ID & Status Header */}
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="font-extrabold text-navy-primary font-mono text-sm">
                  {trip.trip_number}
                </span>
                <StatusBadge status={trip.trip_status} />
              </div>

              {/* Customer Info */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-text-primary text-base">{trip.customer_name}</p>
                  <a
                    href={`tel:${trip.customer_phone}`}
                    className="text-xs text-green-primary font-semibold flex items-center gap-1 mt-0.5"
                  >
                    <Phone className="h-3 w-3" />
                    <span>{trip.customer_phone}</span>
                  </a>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-text-secondary block">Collect</span>
                  <span className="text-sm font-black text-text-primary">
                    {formatINR(trip.amount_to_collect)}
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
                  <span className="font-medium text-text-primary">{trip.destination}</span>
                </div>
                <div className="pt-1 text-[11px] text-text-secondary flex justify-between border-t border-border/60">
                  <span>{formatDate(trip.pickup_date)}</span>
                  <span className="font-semibold text-text-primary">{formatTime(trip.pickup_time)}</span>
                </div>
              </div>

              {/* Placard Box */}
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

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => navigate(`/driver/trips/${trip.id}`)}
                  className="btn-secondary text-xs py-2 justify-center rounded-xl"
                >
                  View Details
                </button>

                {trip.trip_status === 'in_progress' ? (
                  <button
                    onClick={() => navigate(`/driver/trips/${trip.id}/expenses`)}
                    className="btn-primary text-xs py-2 justify-center rounded-xl shadow-sm"
                  >
                    <span>Complete & Expenses</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleStartTrip(trip.id)}
                    className="btn-primary text-xs py-2 justify-center rounded-xl shadow-sm bg-blue-600 hover:bg-blue-700"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    <span>Start Trip</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DriverUpcomingTrips;

