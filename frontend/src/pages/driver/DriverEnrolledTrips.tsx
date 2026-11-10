import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { enrollmentService } from '../../services/enrollmentService';
import { TripEnrollment } from '../../types';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { formatINR, formatDate, formatTime } from '../../utils/formatters';

const DriverEnrolledTrips: React.FC = () => {
  const navigate = useNavigate();
  const { driver } = useAuth();
  const [enrollments, setEnrollments] = useState<TripEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  const driverId = driver?.id || '';

  useEffect(() => {
    loadMyEnrollments();
  }, [driverId]);

  const loadMyEnrollments = async () => {
    try {
      setLoading(true);
      if (!driverId) {
        setEnrollments([]);
        return;
      }
      const list = await enrollmentService.getDriverEnrollments(driverId);
      setEnrollments(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-4 pb-12">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/driver/dashboard')}
          className="p-2 hover:bg-gray-100 rounded-xl text-text-secondary"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-text-primary">My Enrolled Trips</h1>
          <p className="text-xs text-text-secondary">
            Trips you have requested and their approval status
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-16 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : enrollments.length === 0 ? (
        <div className="card text-center py-12 text-text-secondary text-sm">
          You haven't enrolled in any trips yet. Check available trips to find open bookings!
        </div>
      ) : (
        <div className="space-y-3">
          {enrollments.map(item => (
            <div key={item.id} className="card p-4 border border-border space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="font-extrabold text-navy-primary font-mono text-sm">
                  {item.trip?.trip_number || 'Trip'}
                </span>
                <StatusBadge status={item.status} type="enrollment" />
              </div>

              <div>
                <p className="font-bold text-text-primary text-sm">{item.trip?.customer_name}</p>
                <p className="text-xs text-text-secondary mt-0.5">
                  {item.trip?.pickup_location} → {item.trip?.destination}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-text-secondary pt-1">
                <span>{formatDate(item.trip?.pickup_date || '')}</span>
                <span className="font-bold text-green-primary">
                  Charge: {formatINR(item.trip?.driver_charge || 0)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DriverEnrolledTrips;

