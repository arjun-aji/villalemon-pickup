import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Fuel,
  Receipt,
  IndianRupee,
  Save,
  CheckCircle2,
  AlertCircle,
  Car,
  Camera,
  MapPin,
  Clock,
  Wrench,
  DollarSign,
  Upload,
} from 'lucide-react';
import { tripService } from '../../services/tripService';
import { driverReportService } from '../../services/driverReportService';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Trip, DriverReport } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { formatINR, formatDate, formatTime } from '../../utils/formatters';

const DriverExpenseEntry: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { driver } = useAuth();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form Fields matching Driver Reports worksheet
  const [amountCollected, setAmountCollected] = useState<number>(0);
  const [diffNote, setDiffNote] = useState('');
  const [dieselExpense, setDieselExpense] = useState<number>(0);
  const [tollParkingExpense, setTollParkingExpense] = useState<number>(0);
  const [otherDetails, setOtherDetails] = useState('');
  const [workshopExpense, setWorkshopExpense] = useState<number>(0);
  const [workshopDetails, setWorkshopDetails] = useState('');
  const [receiptPhotoUrl, setReceiptPhotoUrl] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Cash Handover / Return Section
  const [hasReturnedCash, setHasReturnedCash] = useState(true);
  const [returnedAmount, setReturnedAmount] = useState<number>(0);
  const [returnPaymentMethod, setReturnPaymentMethod] = useState<'Cash' | 'UPI'>('Cash');
  const [isAmountManuallyEdited, setIsAmountManuallyEdited] = useState(false);
  const [priorCashHeld, setPriorCashHeld] = useState<number>(0);

  useEffect(() => {
    if (tripId) {
      loadTripAndReport(tripId);
    }
  }, [tripId]);

  const loadTripAndReport = async (id: string) => {
    try {
      setLoading(true);
      const [tripData, existingReport] = await Promise.all([
        tripService.getById(id),
        driverReportService.getByTrip(id),
      ]);
      setTrip(tripData);

      if (existingReport) {
        setAmountCollected(existingReport.amount_collected || 0);
        setDiffNote(existingReport.collection_difference_note || '');
        setDieselExpense(existingReport.diesel_expense || 0);
        setTollParkingExpense(existingReport.parking_toll_permits_tickets_food || 0);
        setOtherDetails(existingReport.other_expenses_details || '');
        setWorkshopExpense(existingReport.workshop_expense || 0);
        setWorkshopDetails(existingReport.workshop_details || '');
        setReceiptPhotoUrl(existingReport.receipt_photo_url || '');
      } else if (tripData) {
        const expected = Number(tripData.amount_driver_must_collect || tripData.amount_to_collect || 0);
        setAmountCollected(expected);
      }

      // Fetch driver's prior cash held from ledger
      const effectiveDriverId = tripData?.assigned_driver_id || driver?.id;
      if (effectiveDriverId) {
        const { data: bal } = await supabase
          .from('v_driver_balances')
          .select('cash_owed_to_office')
          .eq('driver_id', effectiveDriverId)
          .maybeSingle();
        if (bal) {
          setPriorCashHeld(Math.max(0, Number(bal.cash_owed_to_office) || 0));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tripId) return;

    try {
      setUploadingPhoto(true);
      const url = await driverReportService.uploadReceipt(file, tripId);
      if (url) {
        setReceiptPhotoUrl(url);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to upload receipt photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const expectedCollection = Number(trip?.amount_driver_must_collect || trip?.amount_to_collect || 0);
  const collectionDifference = amountCollected - expectedCollection;
  const otherExpenses = Number(tollParkingExpense) + Number(workshopExpense);
  const totalDriverExpenses = Number(dieselExpense) + otherExpenses;
  const driverPay = Number(
    trip?.driver_trip_pay_override ??
    trip?.driver_charge ??
    (trip?.driver?.employment_type === 'Per-trip payment' ? (trip?.driver?.per_trip_payment || 500) : 0) ??
    (driver?.employment_type === 'Per-trip payment' ? (driver?.per_trip_payment || 500) : 0) ??
    0
  );

  // Exact unified formula requested:
  // Return = (Amount Collected + Prior Cash Held in Ledger) - Petrol - Driver Pay - Other Expenses
  const netReturnBalance = (Number(amountCollected) + Number(priorCashHeld)) - Number(dieselExpense) - driverPay - otherExpenses;

  useEffect(() => {
    if (!isAmountManuallyEdited) {
      if (netReturnBalance > 0) {
        setReturnedAmount(netReturnBalance);
        setHasReturnedCash(true);
      } else {
        setReturnedAmount(0);
        setHasReturnedCash(false);
      }
    }
  }, [netReturnBalance, isAmountManuallyEdited]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trip) return;

    try {
      setSaving(true);
      const availableCashForSalary = Math.max(0, (Number(amountCollected) + Number(priorCashHeld)) - totalDriverExpenses);
      const cashSalaryRetained = Math.max(0, Math.min(driverPay, availableCashForSalary));

      await driverReportService.submitReport({
        trip_id: trip.id,
        driver_id: trip.assigned_driver_id || driver?.id || '',
        amount_collected: Number(amountCollected) || 0,
        collection_difference_note: diffNote || undefined,
        diesel_expense: Number(dieselExpense) || 0,
        parking_toll_permits_tickets_food: Number(tollParkingExpense) || 0,
        other_expenses_details: otherDetails || undefined,
        workshop_expense: Number(workshopExpense) || 0,
        workshop_details: workshopDetails || undefined,
        receipt_photo_url: receiptPhotoUrl || undefined,
        cash_returned_to_office: (hasReturnedCash && Number(returnedAmount) > 0) ? Number(returnedAmount) : 0,
        cash_return_method: returnPaymentMethod,
        driver_salary_deducted: cashSalaryRetained > 0 ? cashSalaryRetained : undefined,
      });

      setSavedSuccess(true);
      setTimeout(() => {
        navigate('/driver/dashboard');
      }, 1500);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to submit driver report');
    } finally {
      setSaving(false);
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
      <div className="card text-center py-12 text-sm text-slate-500">
        Trip duty record not found.
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/driver/dashboard"
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600 flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Dashboard</span>
        </Link>
        <span className="text-xs font-mono font-bold text-slate-500">
          {trip.trip_number}
        </span>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="font-bold">Trip Report Submitted Successfully!</p>
            <p className="text-[11px] text-emerald-700">Trip marked completed. Returning to dashboard...</p>
          </div>
        </div>
      )}

      {/* Duty Summary Card */}
      <div className="card p-4 bg-white border border-slate-200 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-slate-900">Post-Trip Duty Report</h1>
            <p className="text-[11px] text-slate-500">
              {trip.guest_names || trip.customer_name} • {formatDate(trip.trip_date || trip.pickup_date || '')}
            </p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
            {trip.trip_category || 'Duty'}
          </span>
        </div>

        <div className="p-2.5 bg-slate-50 rounded-xl text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">Route:</span>
            <span className="font-semibold text-slate-800">{trip.pickup_location} → {trip.dropoff_location || trip.destination}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Expected Collection:</span>
            <span className="font-bold text-slate-900">{formatINR(expectedCollection)}</span>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Section 1: Guest Cash Collection */}
        <div className="card p-4 bg-white border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>1. Guest Collection</span>
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Actual Amount Collected from Guest (₹) *
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={amountCollected || ''}
              onChange={e => setAmountCollected(parseFloat(e.target.value) || 0)}
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-base font-bold font-mono focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Collection Difference Notice */}
          {collectionDifference !== 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between text-amber-900 font-bold">
                <span>Collection Difference:</span>
                <span className="font-mono">
                  {collectionDifference > 0 ? `+${formatINR(collectionDifference)} Excess` : `${formatINR(collectionDifference)} Short`}
                </span>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-amber-800 mb-1">
                  Reason for Collection Difference *
                </label>
                <input
                  type="text"
                  value={diffNote}
                  onChange={e => setDiffNote(e.target.value)}
                  placeholder="e.g. Guest paid ₹500 tip / guest paid balance via UPI to office"
                  required={collectionDifference !== 0}
                  className="w-full px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Driver On-Trip Expenses */}
        <div className="card p-4 bg-white border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Fuel className="w-4 h-4 text-amber-600" />
            <span>2. On-Trip Running Expenses</span>
          </h2>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Diesel Expense (₹)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={dieselExpense || ''}
                onChange={e => setDieselExpense(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Toll, Parking, other (₹)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={tollParkingExpense || ''}
                onChange={e => setTollParkingExpense(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Toll / Parking / other expense Details</label>
            <input
              type="text"
              value={otherDetails}
              onChange={e => setOtherDetails(e.target.value)}
              placeholder="e.g. Airport Parking ₹120, Highway Toll ₹80, Permit ₹150"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
            />
          </div>

          {/* Workshop expense */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Wrench className="w-3.5 h-3.5 text-blue-600" />
              <span>Workshop / Repair (If any)</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Workshop Cost (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={workshopExpense || ''}
                  onChange={e => setWorkshopExpense(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">Repair Description</label>
                <input
                  type="text"
                  value={workshopDetails}
                  onChange={e => setWorkshopDetails(e.target.value)}
                  placeholder="Puncture / bulb change"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Receipt Photo Upload */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Upload Diesel / Toll / Expense Receipt Photo
            </label>
            <div className="flex items-center gap-2">
              <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 cursor-pointer text-xs font-semibold text-slate-600 transition-colors bg-slate-50">
                <Camera className="w-4 h-4 text-blue-600" />
                <span>{uploadingPhoto ? 'Uploading...' : 'Take Photo / Upload Bill'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>
            {receiptPhotoUrl && (
              <div className="mt-2 p-2 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">Receipt photo attached successfully</span>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Live Cash Reconciliation Summary (Formula Breakdown) */}
        <div className="card p-4 bg-gradient-to-br from-[#0F1E36] to-[#1E3A8A] text-white shadow-md space-y-2.5 text-xs">
          <div className="flex items-center justify-between pb-1 border-b border-white/10">
            <p className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
              Trip Cash Reconciliation & Return Formula
            </p>
            <span className="text-[10px] text-slate-300 font-mono">
              Return = (Collected + Held) − Petrol − Pay − Other
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">1. Amount Collected from Guest:</span>
              <span className="font-bold font-mono text-sm text-white">{formatINR(amountCollected)}</span>
            </div>
            <div className="flex justify-between items-center text-amber-200">
              <span className="text-slate-300">2. Prior Cash Held in Ledger:</span>
              <span className="font-bold font-mono text-sm">+{formatINR(priorCashHeld)}</span>
            </div>
            <div className="flex justify-between items-center text-amber-300">
              <span className="text-slate-300">3. Petrol / Diesel Filled:</span>
              <span className="font-bold font-mono text-sm">− {formatINR(dieselExpense)}</span>
            </div>
            {driverPay > 0 && (
              <div className="flex justify-between items-center text-emerald-300">
                <span className="text-slate-300">4. Driver Salary / Pay (Retained by you):</span>
                <span className="font-bold font-mono text-sm">− {formatINR(driverPay)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-amber-300">
              <span className="text-slate-300">5. Other Expenses (Toll, Parking, Other, Workshop):</span>
              <span className="font-bold font-mono text-sm">− {formatINR(otherExpenses)}</span>
            </div>
          </div>

          {/* Formula line */}
          <div className="pt-2 border-t border-white/10 text-[11px] font-mono text-slate-300 flex flex-wrap items-center justify-between gap-1">
            <span>Calculation:</span>
            <span>
              ₹{amountCollected} + ₹{priorCashHeld} − ₹{dieselExpense} − ₹{driverPay} − ₹{otherExpenses}
            </span>
          </div>

          {/* Final Return Balance Banner */}
          <div className={`p-3 rounded-xl border mt-2 ${
            netReturnBalance >= 0
              ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200'
              : 'bg-rose-500/15 border-rose-400/40 text-rose-200'
          }`}>
            <div className="flex justify-between items-center">
              <div>
                <span className="block font-bold text-xs uppercase tracking-wider text-white">
                  {netReturnBalance >= 0 ? 'Amount to Return to Office:' : 'Office Must Pay Driver:'}
                </span>
                <span className="text-[10px] text-slate-300">
                  {netReturnBalance >= 0
                    ? 'Total cash to be handed back to office'
                    : 'You spent more than held + collected (Reimbursement due to you)'}
                </span>
              </div>
              <span className={`font-black font-mono text-xl ${
                netReturnBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {netReturnBalance >= 0 ? formatINR(netReturnBalance) : `-₹${Math.abs(netReturnBalance).toLocaleString('en-IN')}`}
              </span>
            </div>
          </div>
        </div>

        {/* Section 4: Cash Returned by Driver */}
        <div className="card p-4 bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Cash Handover to Office</span>
            </h2>
            {netReturnBalance > 0 && (
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={hasReturnedCash}
                  onChange={e => setHasReturnedCash(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>I am handing over money now</span>
              </label>
            )}
          </div>

          {netReturnBalance <= 0 ? (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1 text-xs text-blue-900">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>No Cash Handover Required</span>
              </p>
              <p className="text-[11px] text-blue-700">
                Expenses and pay exceeded your cash in hand. The office owes you <strong>{formatINR(Math.abs(netReturnBalance))}</strong> as direct reimbursement.
              </p>
            </div>
          ) : hasReturnedCash ? (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsAmountManuallyEdited(true);
                    setReturnedAmount(netReturnBalance);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold hover:bg-emerald-100 transition-colors"
                >
                  Return Full Due ({formatINR(netReturnBalance)})
                </button>
                {Math.max(0, amountCollected - totalDriverExpenses - driverPay) > 0 && Math.max(0, amountCollected - totalDriverExpenses - driverPay) !== netReturnBalance && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAmountManuallyEdited(true);
                      setReturnedAmount(Math.max(0, amountCollected - totalDriverExpenses - driverPay));
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-300 text-blue-800 font-bold hover:bg-blue-100 transition-colors"
                  >
                    Return This Duty Only ({formatINR(Math.max(0, amountCollected - totalDriverExpenses - driverPay))})
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Amount Handed Over (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={returnedAmount || ''}
                    onChange={e => {
                      setIsAmountManuallyEdited(true);
                      setReturnedAmount(parseFloat(e.target.value) || 0);
                    }}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-sm bg-emerald-50/50 text-emerald-900 border-emerald-200 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Return Mode
                  </label>
                  <select
                    value={returnPaymentMethod}
                    onChange={e => setReturnPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                  >
                    <option value="Cash">Cash Handover</option>
                    <option value="UPI">UPI Transfer</option>
                  </select>
                </div>
              </div>

              {/* Remaining Cash Held Status */}
              {(() => {
                const remainingHeld = Math.max(0, netReturnBalance - returnedAmount);
                return (
                  <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                    remainingHeld > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'
                  }`}>
                    <div>
                      <span className="font-semibold text-slate-800 block">
                        {remainingHeld > 0 ? 'Remaining Cash Stays With You:' : 'Ledger Held Balance After Confirmation:'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {remainingHeld > 0
                          ? 'This ₹' + remainingHeld.toLocaleString('en-IN') + ' will appear as Prior Cash Held on your next ride'
                          : 'Your held cash balance will become ₹0'}
                      </span>
                    </div>
                    <span className={`font-mono font-black text-sm ${
                      remainingHeld > 0 ? 'text-amber-800' : 'text-emerald-700'
                    }`}>
                      {formatINR(remainingHeld)}
                    </span>
                  </div>
                );
              })()}

              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2 text-[11px] text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  This returned fund will be submitted with <strong>Pending Admin Confirmation</strong>. Once admin verifies, it updates your ledger balance.
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
              <p>You have chosen to retain this cash for now. The entire <strong>{formatINR(netReturnBalance)}</strong> will remain recorded as cash held in your ledger for upcoming duties.</p>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={saving || savedSuccess}
          className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50"
        >
          {saving && <LoadingSpinner size="sm" />}
          <CheckCircle2 className="w-4 h-4" />
          <span>Submit Report & Mark Completed</span>
        </button>
      </form>
    </div>
  );
};

export default DriverExpenseEntry;
