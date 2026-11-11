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
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { tripService } from '../../services/tripService';
import { driverService } from '../../services/driverService';
import { settlementService } from '../../services/settlementService';
import { formatINR } from '../../utils/formatters';

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
      const stats = await tripService.getDashboardStats();
      const now = new Date();
      const currentMonth = now.toLocaleString('en-US', { month: 'short', year: 'numeric' });

      if (stats.total_trips > 0) {
        setReports([
          {
            month: currentMonth,
            year: now.getFullYear(),
            trips: stats.total_trips,
            revenue: stats.total_collections,
            expenses: stats.total_expenses,
            profit: stats.net_profit,
            generatedOn: now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          },
        ]);
      } else {
        setReports([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Generate Excel workbook with ExcelJS
  const generateAndDownloadExcel = async (report: ReportRow) => {
    try {
      const trips = await tripService.getAll();
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'VillaLemon Pickup';
      workbook.created = new Date();

      // ==========================================
      // SHEET 1: Monthly Summary
      // ==========================================
      const summarySheet = workbook.addWorksheet('Monthly Summary');
      summarySheet.addRow(['VILLALEMON PICKUP']);
      summarySheet.addRow([`Monthly Business Summary - ${report.month}`]);
      summarySheet.addRow([]);

      summarySheet.addRow(['Metric', 'Amount (INR)']);
      summarySheet.addRow(['Total Trips Completed', report.trips]);
      summarySheet.addRow(['Total Customer Collections', report.revenue]);
      summarySheet.addRow(['Total Operational Expenses', report.expenses]);
      summarySheet.addRow(['Net Business Profit', report.profit]);

      summarySheet.getRow(1).font = { bold: true, size: 14, color: { argb: 'FF10243A' } };
      summarySheet.getRow(2).font = { bold: true, size: 11, color: { argb: 'FF07966E' } };
      summarySheet.getRow(4).font = { bold: true };
      summarySheet.getColumn(1).width = 30;
      summarySheet.getColumn(2).width = 25;

      // ==========================================
      // SHEET 2: Trip Details
      // ==========================================
      const tripSheet = workbook.addWorksheet('Trip Details');
      const tripHeaders = [
        'Trip ID', 'Customer', 'Phone', 'Date', 'Time', 'Pickup Location',
        'Destination', 'Driver', 'Amount to Collect', 'Petrol Expense',
        'Driver Charge', 'Other Expenses', 'Net Profit', 'Status',
      ];
      const headerRow = tripSheet.addRow(tripHeaders);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF10243A' },
      };

      trips.forEach(t => {
        const s = t.settlement;
        const petrol = s?.petrol_expense || 0;
        const dCharge = Number(s?.driver_charge || t.driver_charge || t.driver_trip_pay_override || 0);
        const other = s?.other_expenses || t.other_fixed_charges || 0;
        const collect = Number(s?.customer_collection || t.amount_to_collect || t.trip_selling_price || 0);
        const profit = collect - petrol - dCharge - other;

        tripSheet.addRow([
          t.trip_number,
          t.customer_name,
          t.customer_phone,
          t.pickup_date,
          t.pickup_time,
          t.pickup_location,
          t.destination,
          t.driver?.full_name || 'Unassigned',
          t.amount_to_collect,
          petrol,
          dCharge,
          other,
          profit,
          t.trip_status,
        ]);
      });

      tripSheet.columns.forEach(col => { col.width = 18; });
      tripSheet.getColumn(1).width = 12;
      tripSheet.getColumn(6).width = 25;
      tripSheet.getColumn(7).width = 25;

      // ==========================================
      // SHEET 3: Driver Summary
      // ==========================================
      const driverSheet = workbook.addWorksheet('Driver Summary');
      const driverHeaders = ['Driver Name', 'Vehicle Number', 'Total Trips', 'Driver Earnings (INR)', 'Petrol Spent (INR)'];
      const dHeaderRow = driverSheet.addRow(driverHeaders);
      dHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      dHeaderRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF07966E' },
      };

      const [driversList, settlementsList] = await Promise.all([
        driverService.getAll(),
        settlementService.getAll(),
      ]);

      driversList.forEach(d => {
        const dTrips = trips.filter(t => t.assigned_driver_id === d.id);
        const dSettlements = settlementsList.filter(s => s.driver_id === d.id);
        const totalEarnings = dSettlements.reduce((sum, s) => sum + (Number(s.driver_charge) || 0), 0);
        const totalPetrol = dSettlements.reduce((sum, s) => sum + (Number(s.petrol_expense) || 0), 0);
        driverSheet.addRow([d.full_name, d.vehicle_number || '-', dTrips.length, totalEarnings, totalPetrol]);
      });
      driverSheet.columns.forEach(col => { col.width = 24; });

      // ==========================================
      // SHEET 4: Settlement Details
      // ==========================================
      const settlementSheet = workbook.addWorksheet('Settlement Details');
      const sHeaders = ['Trip ID', 'Driver', 'Expected Cash Return', 'Actual Cash Returned', 'Difference', 'Status'];
      const sHeaderRow = settlementSheet.addRow(sHeaders);
      sHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      sHeaderRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0B1B2D' },
      };

      settlementsList.forEach(s => {
        settlementSheet.addRow([
          s.trip?.trip_number || 'TRIP',
          s.driver?.full_name || 'Driver',
          s.expected_return || 0,
          s.actual_return || 0,
          s.settlement_difference || 0,
          s.settlement_status || 'Pending',
        ]);
      });
      settlementSheet.columns.forEach(col => { col.width = 22; });

      // Download file
      const buffer = await workbook.xlsx.writeBuffer();
      const filename = `VillaLemon_Pickup_Report_${report.month.replace(/\s+/g, '_')}.xlsx`;
      saveAs(new Blob([buffer]), filename);
    } catch (e: any) {
      alert('Error generating report: ' + e.message);
    }
  };

  const handleGenerateNewReport = async () => {
    try {
      setGenerating(true);
      const stats = await tripService.getDashboardStats();
      const now = new Date();
      const currentMonth = now.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      const newEntry: ReportRow = {
        month: currentMonth,
        year: now.getFullYear(),
        trips: stats.total_trips,
        revenue: stats.total_collections,
        expenses: stats.total_expenses,
        profit: stats.net_profit,
        generatedOn: now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      };
      setReports(prev => [newEntry, ...prev.filter(r => r.month !== currentMonth)]);
      await generateAndDownloadExcel(newEntry);
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
          className="btn-primary rounded-xl text-xs py-2 px-3.5 shadow-sm"
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
            <p className="text-sm font-bold">Standard 5-Sheet Excel Workbook</p>
            <p className="text-xs text-gray-300">
              Includes Monthly Summary, Detailed Trips, Driver Metrics, Expense Breakdown, & Settlement Audit
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

