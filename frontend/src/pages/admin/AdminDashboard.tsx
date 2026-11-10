import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Car,
  CircleDollarSign,
  Fuel,
  Users,
  TrendingUp,
  Clock,
  Plus,
  FileSpreadsheet,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Navigation,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import KPICard from '../../components/ui/KPICard';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { tripService } from '../../services/tripService';
import { formatINR } from '../../utils/formatters';
import { Trip, DashboardStats } from '../../types';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, allTrips] = await Promise.all([
        tripService.getDashboardStats(11, 2026),
        tripService.getAll(),
      ]);
      setStats(statsData);
      setRecentTrips(allTrips.slice(0, 5));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#10243A]">
            Pickup Overview
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Manage trips, drivers, expenses and business performance in real time.
          </p>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/admin/trips/create')}
            className="btn-primary text-xs py-2 px-3.5 rounded-xl shadow-md shadow-green-primary/20"
          >
            <Plus className="h-4 w-4" />
            <span>Add Trip</span>
          </button>

          <button
            onClick={() => navigate('/admin/monthly-reports')}
            className="btn-secondary text-xs py-2 px-3.5 rounded-xl"
          >
            <FileSpreadsheet className="h-4 w-4 text-green-primary" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* 6 Primary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5 sm:gap-4">
        <KPICard
          title="Total Trips"
          value={stats?.total_trips ?? 0}
          icon={Car}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <KPICard
          title="Customer Collections"
          value={formatINR(stats?.total_collections ?? 0)}
          icon={CircleDollarSign}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <KPICard
          title="Petrol Expense"
          value={formatINR(stats?.total_petrol ?? 0)}
          icon={Fuel}
          iconBg="bg-red-50"
          iconColor="text-expense"
        />
        <KPICard
          title="Driver Charges"
          value={formatINR(stats?.total_driver_charges ?? 0)}
          icon={Users}
          iconBg="bg-green-light"
          iconColor="text-green-primary"
        />
        <KPICard
          title="Net Profit"
          value={formatINR(stats?.net_profit ?? 0)}
          icon={TrendingUp}
          valueColor="text-green-primary font-black"
          iconBg="bg-green-light"
          iconColor="text-green-primary"
        />
        <KPICard
          title="Pending Settlements"
          value={formatINR(stats?.pending_settlement_amount ?? 0)}
          subtitle={`${stats?.pending_settlements ?? 0} trips waiting`}
          icon={Clock}
          iconBg="bg-amber-50"
          iconColor="text-warning"
          valueColor="text-amber-600 font-bold"
        />
      </div>

      {/* Middle Grid: Charts and Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Revenue vs Expenses Line Chart */}
        <div className="lg:col-span-6 card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-text-primary">Revenue vs Expenses</h3>
              <p className="text-xs text-text-secondary">Collections, Total Expenses & Net Profit</p>
            </div>
            <div className="flex gap-1 bg-gray-100 p-0.5 rounded-lg text-xs font-semibold">
              <span className="px-2.5 py-1 bg-green-primary text-white rounded-md shadow-sm">Monthly</span>
              <span className="px-2.5 py-1 text-text-secondary">Weekly</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={
                  (stats?.total_collections || 0) > 0
                    ? [
                      { month: 'Jul', collections: 0, expenses: 0, profit: 0 },
                      { month: 'Aug', collections: 0, expenses: 0, profit: 0 },
                      { month: 'Sep', collections: 0, expenses: 0, profit: 0 },
                      { month: 'Oct', collections: 0, expenses: 0, profit: 0 },
                      {
                        month: 'Current',
                        collections: stats?.total_collections || 0,
                        expenses: stats?.total_expenses || 0,
                        profit: stats?.net_profit || 0,
                      },
                    ]
                    : [
                      { month: 'Jul', collections: 0, expenses: 0, profit: 0 },
                      { month: 'Aug', collections: 0, expenses: 0, profit: 0 },
                      { month: 'Sep', collections: 0, expenses: 0, profit: 0 },
                      { month: 'Oct', collections: 0, expenses: 0, profit: 0 },
                      { month: 'Nov', collections: 0, expenses: 0, profit: 0 },
                    ]
                }
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7890' }} stroke="#DCE4EE" />
                <YAxis
                  tickFormatter={val => `₹${val / 1000}k`}
                  tick={{ fontSize: 11, fill: '#6B7890' }}
                  stroke="#DCE4EE"
                />
                <Tooltip
                  formatter={(val: any) => [formatINR(Number(val)), '']}
                  contentStyle={{ backgroundColor: '#10243A', borderRadius: 8, color: '#fff', fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="collections"
                  name="Collections"
                  stroke="#07966E"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#07966E' }}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  name="Total Expenses"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#F59E0B' }}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  name="Net Profit"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Breakdown Donut Chart */}
        <div className="lg:col-span-3 card">
          <h3 className="text-base font-bold text-text-primary">Expense Breakdown</h3>
          <p className="text-xs text-text-secondary mb-2">Total: {formatINR(stats?.total_expenses ?? 0)} Expenses</p>
          <div className="h-44 w-full flex items-center justify-center">
            {stats && stats.total_expenses > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Petrol', value: stats.total_petrol, color: '#3B82F6' },
                      { name: 'Driver Charge', value: stats.total_driver_charges, color: '#07966E' },
                      { name: 'Other', value: stats.total_other_expenses, color: '#F59E0B' },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {[
                      { name: 'Petrol', color: '#3B82F6' },
                      { name: 'Driver Charge', color: '#07966E' },
                      { name: 'Other', color: '#F59E0B' },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => formatINR(Number(val))} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-xs text-text-secondary py-8">
                No expense recorded yet
              </div>
            )}
          </div>
          <div className="space-y-1.5 pt-2 border-t border-border/60 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Petrol
              </span>
              <span className="font-semibold text-text-primary">{formatINR(stats?.total_petrol ?? 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Driver Charge
              </span>
              <span className="font-semibold text-text-primary">{formatINR(stats?.total_driver_charges ?? 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Other
              </span>
              <span className="font-semibold text-text-primary">{formatINR(stats?.total_other_expenses ?? 0)}</span>
            </div>
          </div>
        </div>

        {/* Trip Status (This Month) */}
        <div className="lg:col-span-3 card flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-text-primary">Trip Status</h3>
            <p className="text-xs text-text-secondary mb-4">This Month Overview</p>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3 bg-gray-50/80 rounded-xl border border-gray-100">
                <span className="flex items-center gap-2 text-xs font-semibold text-text-primary">
                  <Clock className="h-4 w-4 text-blue-500" /> Upcoming Trips
                </span>
                <span className="text-sm font-extrabold text-text-primary">{stats?.upcoming_trips ?? 0}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-light/40 rounded-xl border border-green-primary/20">
                <span className="flex items-center gap-2 text-xs font-semibold text-green-primary">
                  <CheckCircle2 className="h-4 w-4 text-green-primary" /> Completed Trips
                </span>
                <span className="text-sm font-extrabold text-green-primary">{stats?.completed_trips ?? 0}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-amber-50/40 rounded-xl border border-amber-200/50">
                <span className="flex items-center gap-2 text-xs font-semibold text-amber-700">
                  <Navigation className="h-4 w-4 text-warning" /> In Progress
                </span>
                <span className="text-sm font-extrabold text-amber-800">{stats?.in_progress_trips ?? 0}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-red-50/50 rounded-xl border border-red-200/60">
                <span className="flex items-center gap-2 text-xs font-semibold text-expense">
                  <AlertCircle className="h-4 w-4 text-expense" /> Pending Settlement
                </span>
                <span className="text-sm font-extrabold text-expense">{stats?.pending_settlements ?? 0}</span>
              </div>
            </div>
          </div>

          <Link
            to="/admin/trips"
            className="mt-4 pt-3 border-t border-border/60 text-xs font-bold text-green-primary hover:underline flex items-center justify-between group"
          >
            <span>View All Trip Details</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Recent Trips Table (Exact structure of the reference image) */}
      <div className="card p-0 overflow-hidden shadow-card">
        <div className="p-5 border-b border-border flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-green-light rounded-lg text-green-primary">
              <Car className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary leading-tight">Recent Trips</h3>
              <p className="text-[11px] text-text-secondary">Latest driver rides & collection balance</p>
            </div>
          </div>
          <Link
            to="/admin/trips"
            className="text-xs font-bold text-green-primary hover:underline flex items-center gap-1 group"
          >
            <span>View All Trips</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-[#F8FAFC]">
                <th className="table-header">Trip ID</th>
                <th className="table-header">Customer</th>
                <th className="table-header">Route</th>
                <th className="table-header">Driver</th>
                <th className="table-header">Collect</th>
                <th className="table-header">Petrol</th>
                <th className="table-header">Driver Charge</th>
                <th className="table-header">Other</th>
                <th className="table-header">Profit</th>
                <th className="table-header">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDF2F7]">
              {recentTrips.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-text-secondary text-xs">
                    <Car className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-text-primary text-sm">No trips recorded yet</p>
                    <p className="mt-1">Add a pickup trip to view real-time collections and profit breakdown.</p>
                  </td>
                </tr>
              ) : (
                recentTrips.map(trip => {
                  const s = trip.settlement;
                  const petrol = s?.petrol_expense || 0;
                  const dCharge = s?.driver_charge || trip.driver_charge;
                  const other = s?.other_expenses || 0;
                  const profit = (s?.customer_collection || trip.amount_to_collect) - petrol - dCharge - other;

                  return (
                    <tr key={trip.id} className="hover:bg-slate-50 transition-colors">
                      <td className="table-cell font-mono font-bold text-navy-primary">
                        {trip.trip_number}
                      </td>
                      <td className="table-cell font-semibold text-text-primary">
                        {trip.customer_name}
                      </td>
                      <td className="table-cell text-xs text-text-secondary">
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-primary shrink-0" />
                          <span className="font-medium text-text-primary">{trip.pickup_location}</span>
                          <span>→</span>
                          <span>{trip.destination}</span>
                        </span>
                      </td>
                      <td className="table-cell text-xs font-semibold">
                        {trip.driver?.full_name || 'Unassigned'}
                      </td>
                      <td className="table-cell font-bold text-text-primary">
                        {formatINR(s?.customer_collection || trip.amount_to_collect)}
                      </td>
                      <td className="table-cell text-xs text-text-secondary">
                        {petrol ? formatINR(petrol) : '-'}
                      </td>
                      <td className="table-cell text-xs text-text-secondary">
                        {formatINR(dCharge)}
                      </td>
                      <td className="table-cell text-xs text-text-secondary">
                        {other ? formatINR(other) : '-'}
                      </td>
                      <td className="table-cell font-extrabold text-green-primary">
                        {formatINR(profit)}
                      </td>
                      <td className="table-cell">
                        <StatusBadge status={trip.trip_status} />
                      </td>
                    </tr>
                  );
                }))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
