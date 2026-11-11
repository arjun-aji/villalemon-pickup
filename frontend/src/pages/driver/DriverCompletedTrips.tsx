import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, MapPin, Receipt, IndianRupee } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { tripService } from '../../services/tripService';
import { supabase } from '../../lib/supabase';
import { Trip } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { formatINR, formatDate, formatTime } from '../../utils/formatters';

const DriverCompletedTrips: React.FC = () => {
  const navigate = useNavigate();
  const { driver, profile, setDriver } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  const rawDriverId = driver?.id || '';
  const initialDriverName = driver?.full_name || profile?.full_name || 'Driver';

  useEffect(() => {
    loadCompleted();
  }, [rawDriverId]);

  const loadCompleted = async () => {
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
      const isCompletedStatus = (st?: string) => (st || '').toLowerCase().replace(/[\s-]+/g, '_') === 'completed';

      const myCompleted = all.filter(t => {
        if (!isCompletedStatus(t.trip_status)) return false;
        if (effectiveDriverId && t.assigned_driver_id === effectiveDriverId) return true;
        const tDrvName = (t.driver?.full_name || '').toLowerCase();
        const myName = resolvedName.toLowerCase().replace(/[^a-z]/g, '');
        if (tDrvName && myName && (tDrvName.includes(myName) || myName.includes(tDrvName))) return true;
        return false;
      });

      setTrips(myCompleted);
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
          <h1 className="text-xl font-bold text-text-primary">Completed Trips</h1>
          <p className="text-xs text-text-secondary">Your completed rides and expense status</p>
        </div>
      </div>

      {loading ? (
        <div className="p-16 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : trips.length === 0 ? (
        <div className="card text-center py-12 text-sm text-text-secondary">
          No completed trips recorded yet.
        </div>
      ) : (
        <div className="space-y-3">
          {trips.map(trip => {
            const s = trip.settlement;
            return (
              <div key={trip.id} className="card p-4 border border-border space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="font-extrabold text-navy-primary font-mono text-sm">
                    {trip.trip_number}
                  </span>
                  <span className="badge-green text-xs font-semibold">Completed</span>
                </div>

                <div>
                  <p className="font-bold text-text-primary text-sm">{trip.guest_names || trip.customer_name || 'Guest'}</p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {trip.pickup_location} → {trip.dropoff_location || trip.destination}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 p-2.5 bg-gray-50 rounded-xl text-xs">
                  <div>
                    <span className="text-text-secondary block">Date:</span>
                    <span className="font-semibold text-text-primary">{formatDate(trip.pickup_date || trip.trip_date || '')}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary block">Earnings:</span>
                    <span className="font-bold text-green-primary">{formatINR(trip.driver_charge || trip.driver_trip_pay_override || 0)}</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/driver/trips/${trip.id}/expenses`)}
                  className="w-full btn-secondary text-xs py-2 justify-center rounded-xl font-semibold"
                >
                  <Receipt className="h-3.5 w-3.5 text-green-primary" />
                  <span>Review / Update Expenses</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DriverCompletedTrips;

