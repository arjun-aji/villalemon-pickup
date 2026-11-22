import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Plus,
  Calendar,
  CheckCircle2,
  Table,
  Sparkles,
} from 'lucide-react';
import { saveAs } from 'file-saver';
import { tripService } from '../../services/tripService';
import { excelExportService } from '../../services/excelExportService';
import { formatINR, formatDate } from '../../utils/formatters';

interface ReportRow {
  month: string;
  year: number;
  trips: number;
  revenue: number;
  expenses: number;
  profit: number;
  generatedOn: string;
}

const MonthlyReportsPage: React.FC = () => {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrentReport();
  }, []);

  const loadCurrentReport = async () => {
    try {
      setLoading(true);
      const [trips, stats] = await Promise.all([
        tripService.getAll(),
        tripService.getDashboardStats(),
      ]);

      const now = new Date();
      const currentMonth = now.toLocaleString('en-US', { month: 'short', year: 'numeric' });

      // Group trips by month
      const monthsMap: Record<string, { trips: number; revenue: number; expenses: number; profit: number }> = {};

      trips.forEach(t => {
        const d = t.trip_date || t.pickup_date;
        if (!d) return;
        const [y, m] = d.split('-');
        const dateObj = new Date(Number(y), Number(m) - 1, 1);
        const mKey = dateObj.toLocaleString('en-US', { month: 'short', year: 'numeric' });

        if (!monthsMap[mKey]) {
          monthsMap[mKey] = { trips: 0, revenue: 0, expenses: 0, profit: 0 };
        }
        monthsMap[mKey].trips += 1;
        const rev = Number(t.trip_selling_price || t.amount_driver_must_collect || 0);
        monthsMap[mKey].revenue += rev;
      });

      // If current month (e.g. Nov 2026) exists, populate its financials from verified stats
      if (!monthsMap[currentMonth]) {
        monthsMap[currentMonth] = {
          trips: stats.total_trips,
          revenue: stats.total_collections,
          expenses: stats.total_expenses,
          profit: stats.net_profit,
        };
      } else {
        monthsMap[currentMonth].revenue = stats.total_collections || monthsMap[currentMonth].revenue;
        monthsMap[currentMonth].expenses = stats.total_expenses;
        monthsMap[currentMonth].profit = stats.net_profit;
      }

      const rows: ReportRow[] = Object.keys(monthsMap).map(mKey => ({
        month: mKey,
        year: parseInt(mKey.split(' ')[1]) || now.getFullYear(),
        trips: monthsMap[mKey].trips,
        revenue: monthsMap[mKey].revenue,
        expenses: monthsMap[mKey].expenses,
        profit: monthsMap[mKey].profit,
        generatedOn: formatDate(now.toISOString()),
      }));

      setReports(rows.length > 0 ? rows : [
        {
          month: currentMonth,
          year: now.getFullYear(),
          trips: stats.total_trips,
          revenue: stats.total_collections,
          expenses: stats.total_expenses,
          profit: stats.net_profit,
          generatedOn: formatDate(now.toISOString()),
        }
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Generate Excel master workbook with all 13 worksheets
  const generateAndDownloadExcel = async (report: ReportRow) => {
    try {
      setGenerating(true);
      const blob = await excelExportService.exportFullWorkbook();
      const filename = `VillaLemon_Pickup_Report_${report.month.replace(/\s+/g, '_')}.xlsx`;
      saveAs(blob, filename);
    } catch (e: any) {
      alert('Error generating report: ' + e.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateNewReport = async () => {
    try {
      setGenerating(true);
      const blob = await excelExportService.exportFullWorkbook();
      const now = new Date();
      const currentMonth = now.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      const filename = `VillaLemon_Pickup_Report_${currentMonth.replace(/\s+/g, '_')}.xlsx`;
      saveAs(blob, filename);
      await loadCurrentReport();
    } catch (err: any) {
      alert(err.message || 'Failed to compile report');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Monthly Reports (Excel)</h1>
          <p className="text-sm text-text-secondary">
            Generate, archive and download complete multi-sheet financial workbooks
          </p>
        </div>

        <button
          onClick={handleGenerateNewReport}
          disabled={generating}
          className="btn-primary rounded-xl text-xs py-2 px-3.5 shadow-sm inline-flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          <span>{generating ? 'Compiling Excel...' : 'Generate Report'}</span>
        </button>
      </div>

      {/* Information Banner */}
      <div className="p-4 bg-navy-primary text-white rounded-2xl flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-green-primary rounded-xl">
            <FileSpreadsheet className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold">Standard 13-Sheet Excel Workbook</p>
            <p className="text-xs text-gray-300">
              Includes Trip Sheet, Vehicles, Expenses, Driver Reports, Driver Ledger, Payments, Bills, Settings, Driver Dispatch, Receipt & Settlement
            </p>
          </div>
        </div>
        <span className="hidden md:inline-flex text-xs px-3 py-1 bg-white/10 rounded-full font-medium">
          Ready for Accounting
        </span>
      </div>

      {/* Table (Matching visual design in screenshot) */}
      <div className="card p-0 overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-gray-50/80">
                <th className="table-header">Report Month</th>
                <th className="table-header">Trips</th>
                <th className="table-header">Revenue</th>
                <th className="table-header">Expenses</th>
                <th className="table-header">Net Profit</th>
                <th className="table-header">Generated On</th>
                <th className="table-header text-right">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-text-secondary text-xs">
                    <FileSpreadsheet className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-text-primary text-sm">No monthly reports generated yet</p>
                    <p className="mt-1">Click "Generate Report" above to compile a 5-sheet financial Excel workbook from live data.</p>
                  </td>
                </tr>
              ) : (
                reports.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50/70 transition-colors">
                  <td className="table-cell font-bold text-navy-primary">
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-green-primary" />
                      {row.month}
                    </span>
                  </td>
                  <td className="table-cell font-bold text-text-primary">
                    {row.trips}
                  </td>
                  <td className="table-cell font-semibold text-text-primary">
                    {formatINR(row.revenue)}
                  </td>
                  <td className="table-cell font-medium text-expense">
                    {formatINR(row.expenses)}
                  </td>
                  <td className="table-cell font-extrabold text-green-primary">
                    {formatINR(row.profit)}
                  </td>
                  <td className="table-cell text-xs text-text-secondary">
                    {row.generatedOn}
                  </td>
                  <td className="table-cell text-right">
                    <button
                      onClick={() => generateAndDownloadExcel(row)}
                      className="px-3 py-1.5 bg-green-light hover:bg-green-100 text-green-primary font-semibold text-xs rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-sm"
                      title="Download Excel File"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Excel</span>
                    </button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MonthlyReportsPage;

