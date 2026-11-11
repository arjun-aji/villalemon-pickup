import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Car,
  Fuel,
  Users,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import KPICard from '../../components/ui/KPICard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { tripService } from '../../services/tripService';
import { formatINR } from '../../utils/formatters';
import { Trip, DashboardStats } from '../../types';

interface DriverProfitStat {
  driver: string;
  profit: number;
  trips: number;
}

const ProfitAnalyticsPage: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState('Current Month');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [driverProfitData, setDriverProfitData] = useState<DriverProfitStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [statsData, allTrips] = await Promise.all([
        tripService.getDashboardStats(),
        tripService.getAll(),
      ]);
      setStats(statsData);

      // Compute driver-wise profitability from actual trips
      const driverMap = new Map<string, { name: string; profit: number; trips: number }>();
      allTrips.forEach(t => {
        if (!t.assigned_driver_id || !t.driver) return;
        const key = t.assigned_driver_id;
        const current = driverMap.get(key) || { name: t.driver.full_name, profit: 0, trips: 0 };
        const s = t.settlement;
        const collect = Number(s?.customer_collection || t.amount_to_collect || t.trip_selling_price || 0);
        const petrol = s?.petrol_expense || 0;
        const dCharge = Number(s?.driver_charge || t.driver_charge || t.driver_trip_pay_override || 0);
        const other = s?.other_expenses || 0;
        const profit = collect - petrol - dCharge - other;

        current.profit += profit;
        current.trips += 1;
        driverMap.set(key, current);
      });

      const driverStats: DriverProfitStat[] = Array.from(driverMap.values())
        .map(d => ({ driver: d.name, profit: d.profit, trips: d.trips }))
        .sort((a, b) => b.profit - a.profit);

      setDriverProfitData(driverStats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const monthlyProfitData = [
    { month: 'Jul', profit: 0 },
    { month: 'Aug', profit: 0 },
    { month: 'Sep', profit: 0 },
    { month: 'Oct', profit: 0 },
    { month: 'Current', profit: stats?.net_profit || 0 },
  ];

  const profitMargin =
    stats && stats.total_collections > 0
      ? ((stats.net_profit / stats.total_collections) * 100).toFixed(1)
      : '0.0';

  const maxDriverProfit = Math.max(...driverProfitData.map(d => d.profit), 1000);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Profit Analytics</h1>
          <p className="text-sm text-text-secondary">
            Business performance metrics, monthly trends and driver profitability
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3.5 py-2 bg-white border border-border rounded-xl text-xs font-semibold text-text-primary shadow-sm">
            <Calendar className="h-4 w-4 text-green-primary" />
            <span>{selectedMonth}</span>
          </div>
        </div>
      </div>

      {/* Top 4 Summary Cards (As in reference screenshot) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-xs font-semibold text-text-secondary uppercase">Trips</p>
          <p className="text-3xl font-extrabold text-text-primary mt-1">{stats?.total_trips ?? 0}</p>
          <p className="text-[11px] text-text-secondary mt-1">Total recorded pickups</p>
        </div>

        <div className="card">
          <p className="text-xs font-semibold text-text-secondary uppercase">Revenue</p>
          <p className="text-3xl font-extrabold text-navy-primary mt-1">{formatINR(stats?.total_collections ?? 0)}</p>
          <p className="text-[11px] text-green-primary mt-1">Customer collections</p>
        </div>

        <div className="card">
          <p className="text-xs font-semibold text-text-secondary uppercase">Expenses</p>
          <p className="text-3xl font-extrabold text-expense mt-1">{formatINR(stats?.total_expenses ?? 0)}</p>
          <p className="text-[11px] text-text-secondary mt-1">Petrol + Driver + Other</p>
        </div>

        <div className="card bg-gradient-to-br from-green-light/80 to-white border-green-primary/30">
          <p className="text-xs font-bold text-green-primary uppercase">Net Profit</p>
          <p className="text-3xl font-black text-green-primary mt-1">{formatINR(stats?.net_profit ?? 0)}</p>
          <p className="text-[11px] text-green-primary font-semibold mt-1">{profitMargin}% Profit Margin</p>
        </div>
      </div>

      {/* 2 Main Visual Analytics Charts (As seen in the screenshot) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Profit Trend Bar Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-text-primary">Monthly Profit Trend</h2>
              <p className="text-xs text-text-secondary">Historical Net Profit by Month</p>
            </div>
            <span className="text-xs font-bold text-green-primary px-2.5 py-1 bg-green-light rounded-lg">
              {formatINR(stats?.net_profit ?? 0)} Net
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyProfitData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7890' }} stroke="#DCE4EE" />
                <YAxis
                  tickFormatter={val => `₹${val / 1000}k`}
                  tick={{ fontSize: 11, fill: '#6B7890' }}
                  stroke="#DCE4EE"
                />
                <Tooltip
                  formatter={(val: any) => [formatINR(Number(val)), 'Net Profit']}
                  contentStyle={{ backgroundColor: '#10243A', borderRadius: 8, color: '#fff', fontSize: 12 }}
                />
                <Bar dataKey="profit" radius={[6, 6, 0, 0]}>
                  {monthlyProfitData.map((_entry, index) => (
                    <Cell
                      key={`bar-${index}`}
                      fill={index === monthlyProfitData.length - 1 ? '#07966E' : '#86EFAC'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Driver-wise Profit Horizontal Bar View */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-text-primary">Driver-wise Profit</h2>
              <p className="text-xs text-text-secondary">Net business margin generated per driver</p>
            </div>
            <Users className="h-4 w-4 text-green-primary" />
          </div>

          {driverProfitData.length === 0 ? (
            <div className="text-center py-12 text-text-secondary text-xs">
              <Users className="h-8 w-8 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-text-primary text-sm">No driver trip data yet</p>
              <p className="mt-1">Add drivers and assign trips to track individual profitability.</p>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {driverProfitData.map((item) => {
                const percentage = Math.round((Math.max(item.profit, 0) / maxDriverProfit) * 100);

                return (
                  <div key={item.driver} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-text-primary">{item.driver}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-text-secondary">{item.trips} Trips</span>
                        <span className="font-extrabold text-green-primary">{formatINR(item.profit)}</span>
                      </div>
                    </div>
                    <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-secondary to-green-primary rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(percentage, 5)}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              <div className="mt-8 p-3.5 bg-gray-50 rounded-xl border border-border text-xs flex items-center justify-between">
                <span className="text-text-secondary">Top performing driver:</span>
                <span className="font-bold text-text-primary">
                  {driverProfitData[0].driver} ({formatINR(driverProfitData[0].profit)} profit contribution)
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfitAnalyticsPage;
