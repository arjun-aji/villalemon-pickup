import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Clock,
  Car,
  IndianRupee,
  Check,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { tripService } from '../../services/tripService';
import { enrollmentService } from '../../services/enrollmentService';
import { Trip, TripEnrollment } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { formatINR, formatDate, formatTime } from '../../utils/formatters';

const DriverAvailableTrips: React.FC = () => {
  const navigate = useNavigate();
  const { driver } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [enrolledMap, setEnrolledMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  const driverId = driver?.id || '';

  useEffect(() => {
    loadTrips();
  }, [driverId]);

  const loadTrips = async () => {
    try {
      setLoading(true);
      const [allTrips, myEnrollments] = await Promise.all([
        tripService.getAvailableForEnrollment(),
        driverId ? enrollmentService.getDriverEnrollments(driverId) : Promise.resolve([]),
      ]);

      setTrips(allTrips);
      const map: Record<string, boolean> = {};
      myEnrollments.forEach(e => {
        map[e.trip_id] = true;
      });
      setEnrolledMap(map);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (tripId: string) => {
    try {
      setEnrollingId(tripId);
      await enrollmentService.enroll(tripId, driverId);
      setEnrolledMap(prev => ({ ...prev, [tripId]: true }));
      alert('Enrollment submitted! Admin will review and confirm your assignment.');
    } catch (err: any) {
      alert(err.message || 'Failed to submit enrollment request');
    } finally {
      setEnrollingId(null);
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
          <h1 className="text-xl font-bold text-text-primary">Available Trips</h1>
          <p className="text-xs text-text-secondary">
            Trips published by admin open for driver enrollment
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-16 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : trips.length === 0 ? (
        <div className="card text-center py-12 text-text-secondary text-sm">
          No open trips available for enrollment right now.
        </div>
      ) : (
        <div className="space-y-3.5">
          {trips.map(trip => {
            const isEnrolled = enrolledMap[trip.id];

            return (
              <div key={trip.id} className="card p-5 border border-border space-y-3 hover:shadow-card-hover transition-all">
                {/* Trip ID & Fare Header */}
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="font-extrabold text-navy-primary font-mono text-sm">
                    {trip.trip_number}
                  </span>
                  <div className="text-right">
                    <span className="text-xs text-text-secondary block">Driver Earnings</span>
                    <span className="text-sm font-black text-green-primary">
                      {formatINR(trip.driver_charge)}
                    </span>
                  </div>
                </div>

                {/* Customer & Route */}
                <div>
                  <p className="font-bold text-text-primary text-base">{trip.customer_name}</p>
                  <div className="mt-1 flex items-start gap-1.5 text-xs text-text-secondary">
                    <MapPin className="h-4 w-4 text-green-primary shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-text-primary">{trip.pickup_location}</strong> → {trip.destination}
                    </span>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-2 p-2.5 bg-gray-50 rounded-xl text-xs">
                  <div>
                    <span className="text-text-secondary block">Date:</span>
                    <span className="font-semibold text-text-primary">{formatDate(trip.pickup_date)}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary block">Time:</span>
                    <span className="font-semibold text-text-primary">{formatTime(trip.pickup_time)}</span>
                  </div>
                </div>

                {/* Collect & Notes */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-text-secondary">
                    Collect from guest: <strong className="text-navy-primary font-bold">{formatINR(trip.amount_to_collect)}</strong>
                  </span>
                </div>

                {/* Action button */}
                <button
                  onClick={() => handleEnroll(trip.id)}
                  disabled={isEnrolled || enrollingId === trip.id}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                    isEnrolled
                      ? 'bg-amber-100 text-amber-800 cursor-not-allowed'
                      : 'btn-primary'
                  }`}
                >
                  {isEnrolled ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>ENROLLED (AWAITING APPROVAL)</span>
                    </>
                  ) : enrollingId === trip.id ? (
                    <span>Submitting Request...</span>
                  ) : (
                    <>
                      <Car className="h-4 w-4" />
                      <span>ENROLL IN TRIP</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DriverAvailableTrips;

