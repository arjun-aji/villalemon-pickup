import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Copy,
  Check,
  Phone,
  MapPin,
  Calendar,
  Clock,
  IndianRupee,
  Navigation,
  FileText,
  Plane,
  AlertCircle,
} from 'lucide-react';
import { tripService } from '../../services/tripService';
import { Trip } from '../../types';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { formatINR, formatDate, formatTime } from '../../utils/formatters';

const DriverTripDetail: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (tripId) {
      loadTrip(tripId);
    }
  }, [tripId]);

  const loadTrip = async (id: string) => {
    try {
      setLoading(true);
      const data = await tripService.getById(id);
      setTrip(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPlacard = () => {
    if (!trip) return;
    const cust = trip.customer_name || trip.guest_names || 'Guest';
    const text = trip.placard_text || `VILLALEMON PICKUP - ${cust.toUpperCase()}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartTrip = async () => {
    if (!trip) return;
    try {
      await tripService.updateStatus(trip.id, 'in_progress');
      loadTrip(trip.id);
    } catch (e: any) {
      alert(e.message || 'Failed to start trip');
    }
  };

  if (loading) {
    return (
      <div className="p-16 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="card text-center py-12 text-sm text-text-secondary">
        Trip not found.
      </div>
    );
  }

  const placard = trip.placard_text || `VILLALEMON PICKUP - ${(trip.customer_name || trip.guest_names || 'Guest').toUpperCase()}`;

  return (
    <div className="max-w-md mx-auto space-y-4 pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/driver/upcoming-trips')}
          className="p-2 hover:bg-gray-100 rounded-xl text-text-secondary"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="text-center">
          <h1 className="text-base font-extrabold text-navy-primary font-mono">{trip.trip_number}</h1>
          <p className="text-[11px] text-text-secondary">Trip Information</p>
        </div>
        <StatusBadge status={trip.trip_status} />
      </div>

      {/* Main Details Card (Matches reference screenshot) */}
      <div className="card p-6 border border-border space-y-4 shadow-card">
        {/* Customer & Phone */}
        <div className="space-y-1.5 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">Customer</span>
            <span className="font-bold text-text-primary text-base">{trip.customer_name || trip.guest_names || 'Guest'}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">Phone</span>
            <a
              href={`tel:${trip.customer_phone || trip.guest_contact_number || ''}`}
              className="text-xs font-semibold text-green-primary flex items-center gap-1 hover:underline"
            >
              <Phone className="h-3.5 w-3.5" />
              <span>{trip.customer_phone || trip.guest_contact_number || '-'}</span>
            </a>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">Date & Time</span>
            <span className="text-xs font-semibold text-text-primary">
              {formatDate(trip.pickup_date || trip.trip_date || '')}, {formatTime(trip.pickup_time || '')}
            </span>
          </div>

          {(trip.flight_number || trip.flight_number_and_time) && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">Flight / Train</span>
              <span className="text-xs font-bold text-blue-600 flex items-center gap-1">
                <Plane className="h-3 w-3" />
                {trip.flight_number || trip.flight_number_and_time}
              </span>
            </div>
          )}
        </div>

        {/* Route Points */}
        <div className="space-y-2 pb-4 border-b border-border text-xs">
          <div className="flex items-start justify-between">
            <span className="text-text-secondary">Pickup:</span>
            <span className="font-bold text-text-primary text-right">{trip.pickup_location}</span>
          </div>
          <div className="flex items-start justify-between">
            <span className="text-text-secondary">Destination:</span>
            <span className="font-bold text-text-primary text-right">{trip.destination || trip.dropoff_location}</span>
          </div>
        </div>

        {/* Amount to Collect & Driver Charge */}
        <div className="p-3.5 bg-green-light/70 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-green-primary font-bold uppercase tracking-wide block">
              Amount to Collect
            </span>
            <span className="text-xs text-text-secondary">From customer upon arrival</span>
          </div>
          <span className="text-xl font-black text-navy-primary font-mono">
            {formatINR(trip.amount_to_collect || trip.amount_driver_must_collect || 0)}
          </span>
        </div>

        <div className="flex items-center justify-between px-1 text-xs">
          <span className="text-text-secondary">Your Driver Charge:</span>
          <span className="font-bold text-green-primary text-sm">{formatINR(trip.driver_charge || trip.driver_trip_pay_override || 0)}</span>
        </div>

        {/* Placard / Name Board Box (Matches mockup) */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-text-secondary">Placard / Name Board</span>
            <button
              onClick={handleCopyPlacard}
              className="text-xs font-semibold text-green-primary hover:underline flex items-center gap-1"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Placard'}</span>
            </button>
          </div>
          <div className="p-4 bg-navy-sidebar text-white rounded-2xl text-center border-2 border-dashed border-green-primary/50 shadow-inner">
            <span className="text-[9px] uppercase tracking-widest text-green-primary font-extrabold block mb-1">
              Display to Guest
            </span>
            <p className="text-base font-black tracking-widest font-mono text-white">
              {placard}
            </p>
          </div>
        </div>

        {/* Trip Instructions */}
        {trip.trip_notes && (
          <div className="p-3 bg-gray-50 rounded-xl text-xs space-y-1">
            <span className="font-bold text-text-primary block">Instructions:</span>
            <p className="text-text-secondary leading-relaxed">{trip.trip_notes}</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2">
        {trip.trip_status === 'assigned' && (
          <button
            onClick={handleStartTrip}
            className="w-full btn-primary justify-center py-3 rounded-2xl text-sm font-bold shadow-md shadow-green-primary/20 bg-blue-600 hover:bg-blue-700"
          >
            <Navigation className="h-4 w-4" />
            <span>START TRIP</span>
          </button>
        )}

        {trip.trip_status === 'in_progress' && (
          <button
            onClick={() => navigate(`/driver/trips/${trip.id}/expenses`)}
            className="w-full btn-primary justify-center py-3 rounded-2xl text-sm font-bold shadow-md shadow-green-primary/20"
          >
            <FileText className="h-4 w-4" />
            <span>COMPLETE TRIP & ENTER EXPENSES</span>
          </button>
        )}

        {trip.trip_status === 'completed' && (
          <button
            onClick={() => navigate(`/driver/trips/${trip.id}/expenses`)}
            className="w-full btn-secondary justify-center py-3 rounded-2xl text-sm font-bold"
          >
            <FileText className="h-4 w-4" />
            <span>View / Edit Submitted Expenses</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default DriverTripDetail;

