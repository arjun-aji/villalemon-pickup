import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Car,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  Wallet,
  ChevronRight,
  TrendingUp,
  Fuel,
  IndianRupee,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { tripService } from '../../services/tripService';
import { enrollmentService } from '../../services/enrollmentService';
import { settlementService } from '../../services/settlementService';
import { Trip } from '../../types';
import { formatINR } from '../../utils/formatters';

const DriverDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { driver, profile } = useAuth();
  const [upcomingTrips, setUpcomingTrips] = useState<Trip[]>([]);
  const [availableCount, setAvailableCount] = useState(0);
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [pendingSettlementAmount, setPendingSettlementAmount] = useState(0);
  const [inProgressCount, setInProgressCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const driverId = driver?.id || '';
  const driverName = driver?.full_name || profile?.full_name || 'Driver';

  useEffect(() => {
    loadDriverData();
  }, [driverId]);

  const loadDriverData = async () => {
    try {
      setLoading(true);
      const [allTrips, enrollments, settlements] = await Promise.all([
        tripService.getAll(),
        driverId ? enrollmentService.getDriverEnrollments(driverId) : Promise.resolve([]),
        settlementService.getAll(),
      ]);

      const myAssigned = allTrips.filter(t => t.assigned_driver_id === driverId);
      const upcoming = myAssigned.filter(t => ['upcoming', 'assigned'].includes(t.trip_status));
      const inProg = myAssigned.filter(t => t.trip_status === 'in_progress');
      const completed = myAssigned.filter(t => t.trip_status === 'completed');

      setUpcomingTrips(upcoming);
      setInProgressCount(inProg.length);
      setCompletedCount(completed.length);

      const openTrips = allTrips.filter(t => t.is_published_for_enrollment && !t.assigned_driver_id);
      setAvailableCount(openTrips.length);

      const pendingEnrollments = enrollments.filter(e => e.status === 'pending');
      setEnrolledCount(pendingEnrollments.length);

      const myPending = settlements.filter(s => s.driver_id === driverId && s.settlement_status !== 'settled');
      const totalPending = myPending.reduce((sum, s) => sum + (Number(s.expected_return) || 0), 0);
      setPendingSettlementAmount(totalPending);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Driver Welcome Hero Card (matching phone screen 2 in the reference image) */}
      <div className="card p-6 bg-gradient-to-br from-white to-[#F0FAF5] border border-green-primary/20 shadow-md relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-green-primary/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-black text-[#10243A] flex items-center gap-1.5">
              <span>Hi, {driverName}</span>
              <span>👋</span>
            </h1>
            <p className="text-xs font-bold text-green-primary tracking-wide uppercase mt-0.5">
              Driver Portal • {driver?.vehicle_number || 'Registered Driver'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-green-primary to-green-secondary flex items-center justify-center text-white shadow-lg shadow-green-primary/30">
            <Car className="h-6 w-6" />
          </div>
        </div>

        {/* 3 Top Status Pills (matching reference screen) */}
        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div
            onClick={() => navigate('/driver/upcoming-trips')}
            className="p-3 bg-white rounded-2xl border border-green-primary/30 shadow-sm cursor-pointer hover:border-green-primary hover:scale-[1.02] transition-all"
          >
            <p className="text-2xl font-black text-green-primary">{upcomingTrips.length}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Upcoming</p>
          </div>

          <div
            onClick={() => navigate('/driver/upcoming-trips')}
            className="p-3 bg-white rounded-2xl border border-blue-200 shadow-sm cursor-pointer hover:border-blue-500 hover:scale-[1.02] transition-all"
          >
            <p className="text-2xl font-black text-blue-600">{inProgressCount}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">In Progress</p>
          </div>

          <div
            onClick={() => navigate('/driver/completed-trips')}
            className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:border-slate-400 hover:scale-[1.02] transition-all"
          >
            <p className="text-2xl font-black text-slate-700">{completedCount}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Completed</p>
          </div>
        </div>
      </div>

      {/* Main Action Navigation Cards (Matches Reference Phone Screen) */}
      <div className="space-y-2.5">
        {/* Available Trips */}
        <div
          onClick={() => navigate('/driver/available-trips')}
          className="card p-4.5 flex items-center justify-between cursor-pointer hover:border-green-primary/40 hover:shadow-md transition-all active:scale-[0.99] group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-green-light flex items-center justify-center text-green-primary group-hover:scale-105 transition-transform">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary">Available Trips</p>
              <p className="text-xs text-text-secondary">{availableCount} trips open for enrollment</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-400 group-hover:translate-x-0.5 group-hover:text-green-primary transition-all" />
        </div>

        {/* My Upcoming Trips */}
        <div
          onClick={() => navigate('/driver/upcoming-trips')}
          className="card p-4.5 flex items-center justify-between cursor-pointer hover:border-blue-400/40 hover:shadow-md transition-all active:scale-[0.99] group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary">My Upcoming Trips</p>
              <p className="text-xs text-text-secondary">{upcomingTrips.length} assigned trips</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-400 group-hover:translate-x-0.5 group-hover:text-blue-600 transition-all" />
        </div>

        {/* My Enrolled Trips */}
        <div
          onClick={() => navigate('/driver/enrolled-trips')}
          className="card p-4.5 flex items-center justify-between cursor-pointer hover:border-amber-400/40 hover:shadow-md transition-all active:scale-[0.99] group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-warning group-hover:scale-105 transition-transform">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary">My Enrolled Trips</p>
              <p className="text-xs text-text-secondary">{enrolledCount} trips (awaiting approval)</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-400 group-hover:translate-x-0.5 group-hover:text-warning transition-all" />
        </div>

        {/* Completed Trips */}
        <div
          onClick={() => navigate('/driver/completed-trips')}
          className="card p-4.5 flex items-center justify-between cursor-pointer hover:border-emerald-400/40 hover:shadow-md transition-all active:scale-[0.99] group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary">Completed Trips</p>
              <p className="text-xs text-text-secondary">{completedCount} trips</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-400 group-hover:translate-x-0.5 group-hover:text-emerald-600 transition-all" />
        </div>

        {/* My Settlements */}
        <div
          onClick={() => navigate('/driver/settlements')}
          className="card p-4.5 flex items-center justify-between cursor-pointer hover:border-purple-400/40 hover:shadow-md transition-all active:scale-[0.99] group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:scale-105 transition-transform">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary">My Settlements</p>
              <p className="text-xs text-text-secondary font-medium">
                {pendingSettlementAmount > 0 ? `Pending (${formatINR(pendingSettlementAmount)})` : 'All cleared'}
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-400 group-hover:translate-x-0.5 group-hover:text-purple-600 transition-all" />
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;
