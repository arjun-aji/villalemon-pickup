import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Fuel,
  Receipt,
  IndianRupee,
  Save,
  CheckCircle2,
  AlertCircle,
  Car,
  FileCheck,
  MapPin,
  Clock,
} from 'lucide-react';
import { tripService } from '../../services/tripService';
import { expenseService } from '../../services/expenseService';
import { useAuth } from '../../context/AuthContext';
import { Trip } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { formatINR, calculateFinancials, formatDate } from '../../utils/formatters';

const DriverExpenseEntry: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { driver } = useAuth();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form Fields
  const [petrolExpense, setPetrolExpense] = useState<number>(0);
  const [otherExpense, setOtherExpense] = useState<number>(0);
  const [otherDescription, setOtherDescription] = useState('');
  const [actualAmountReturned, setActualAmountReturned] = useState<number>(0);
  const [driverNotes, setDriverNotes] = useState('');

  useEffect(() => {
    if (tripId) {
      loadTripAndExpenses(tripId);
    }
  }, [tripId]);

  const loadTripAndExpenses = async (id: string) => {
    try {
      setLoading(true);
      const [tripData, existingExpense] = await Promise.all([
        tripService.getById(id),
        expenseService.getByTrip(id),
      ]);
      setTrip(tripData);

      if (existingExpense) {
        setPetrolExpense(existingExpense.petrol_expense || 0);
        setOtherExpense(existingExpense.other_expense || 0);
        setOtherDescription(existingExpense.expense_description || '');
        setActualAmountReturned(existingExpense.actual_amount_returned || 0);
        setDriverNotes(existingExpense.notes || '');
      } else if (tripData) {
        const toCollect = Number(tripData.amount_to_collect || tripData.amount_driver_must_collect || 0);
        const dCharge = Number(tripData.driver_charge || tripData.driver_trip_pay_override || 0);
        const expected = Math.max(toCollect - dCharge, 0);
        setActualAmountReturned(expected);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExpenses = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trip) return;

    try {
      setSaving(true);
      if (trip.trip_status !== 'completed') {
        await tripService.updateStatus(trip.id, 'completed');
      }

      await expenseService.saveExpenses({
        trip_id: trip.id,
        driver_id: trip.assigned_driver_id || driver?.id || '',
        petrol_expense: Number(petrolExpense),
        other_expense: Number(otherExpense),
        expense_description: otherDescription,
        actual_amount_returned: Number(actualAmountReturned),
        notes: driverNotes,
        customer_collection: Number(trip.amount_to_collect || trip.amount_driver_must_collect || 0),
        driver_charge: Number(trip.driver_charge || trip.driver_trip_pay_override || 0),
      });

      setSavedSuccess(true);
      setTimeout(() => {
        navigate('/driver/dashboard');
      }, 1200);
    } catch (err: any) {
      alert(err.message || 'Failed to save expenses');
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
      <div className="card text-center py-12 text-sm text-text-secondary">
        Trip not found.
      </div>
    );
  }

  const financials = calculateFinancials(
    Number(trip.amount_to_collect || trip.amount_driver_must_collect || 0),
    petrolExpense,
    Number(trip.driver_charge || trip.driver_trip_pay_override || 0),
    otherExpense,
    actualAmountReturned
  );

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Header bar matching Phone 3 in reference */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(`/driver/trips/${trip.id}`)}
          className="p-2 hover:bg-white rounded-xl text-text-secondary transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="text-center">
          <h1 className="text-base font-black text-navy-primary font-mono">{trip.trip_number}</h1>
          <p className="text-[11px] text-text-secondary font-medium">Expense & Settlement</p>
        </div>
        <span className="badge-green text-[11px]">In Progress</span>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-green-light border border-green-primary text-green-primary rounded-2xl flex items-center gap-2.5 text-xs font-bold shadow-md animate-in zoom-in-95">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>Expenses submitted successfully! Admin dashboard synchronized.</span>
        </div>
      )}

      {/* Trip Information Card */}
      <div className="card p-4 space-y-2 bg-white border border-[#E2E8F0]">
        <div className="flex items-center justify-between text-xs pb-2 border-b border-border/70">
          <span className="text-text-secondary">Customer</span>
          <span className="font-bold text-text-primary text-sm">{trip.customer_name}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-secondary">Route</span>
          <span className="font-semibold text-text-primary">
            {trip.pickup_location} → {trip.destination}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-secondary">Customer Collect</span>
          <span className="font-extrabold text-navy-primary text-sm">
            {formatINR(trip.amount_to_collect)}
          </span>
        </div>
      </div>

      {/* Main Expense Form (Matching Rightmost Screen in Reference Image) */}
      <form onSubmit={handleSaveExpenses} className="card p-5 sm:p-6 space-y-4 shadow-md border border-border">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-navy-primary flex items-center gap-2 pb-2 border-b border-border">
          <Fuel className="h-4 w-4 text-green-primary" />
          Enter Trip Expenses
        </h2>

        {/* Petrol Expense */}
        <div>
          <label className="label">Petrol Expense</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">
              ₹
            </span>
            <input
              type="number"
              min="0"
              required
              value={petrolExpense}
              onChange={e => setPetrolExpense(Number(e.target.value))}
              className="input-field pl-8 font-bold text-text-primary text-base"
              placeholder="900"
            />
          </div>
        </div>

        {/* Other Expense */}
        <div>
          <label className="label">Other Expense</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">
              ₹
            </span>
            <input
              type="number"
              min="0"
              value={otherExpense}
              onChange={e => setOtherExpense(Number(e.target.value))}
              className="input-field pl-8 font-bold text-text-primary text-base"
              placeholder="200"
            />
          </div>
        </div>

        {/* Other Expense Description */}
        <div>
          <label className="label">Other Expense Description</label>
          <input
            type="text"
            value={otherDescription}
            onChange={e => setOtherDescription(e.target.value)}
            placeholder="e.g. Parking and toll"
            className="input-field text-sm"
          />
        </div>

        {/* Actual Amount Returned */}
        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between mb-1">
            <label className="label mb-0">Actual Amount Returned *</label>
            <button
              type="button"
              onClick={() => setActualAmountReturned(financials.expectedReturn)}
              className="text-[11px] text-green-primary font-bold hover:underline"
            >
              Exact Match (₹{financials.expectedReturn})
            </button>
          </div>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">
              ₹
            </span>
            <input
              type="number"
              required
              value={actualAmountReturned}
              onChange={e => setActualAmountReturned(Number(e.target.value))}
              className="input-field pl-8 font-black text-navy-primary text-lg"
              placeholder="1400"
            />
          </div>
        </div>

        {/* Financial Calculation Box (matching visual design) */}
        <div className="p-4 bg-gradient-to-br from-[#F8FAFC] to-[#EDF4F9] rounded-2xl border border-border space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Expected Return</span>
            <span className="font-extrabold text-green-primary text-sm">
              {formatINR(financials.expectedReturn)}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-border/70">
            <span className="text-text-secondary">Settlement Difference</span>
            <span
              className={`font-black text-sm ${
                financials.settlementDifference === 0 ? 'text-green-primary' : 'text-expense'
              }`}
            >
              {financials.settlementDifference === 0
                ? '₹0'
                : `-₹${Math.abs(financials.settlementDifference)}`}
            </span>
          </div>
        </div>

        {/* Driver Notes */}
        <div>
          <label className="label">Driver Notes (Optional)</label>
          <textarea
            rows={2}
            value={driverNotes}
            onChange={e => setDriverNotes(e.target.value)}
            placeholder="Notes for management..."
            className="input-field text-xs"
          />
        </div>

        {/* Save Expenses Button (Large green action button) */}
        <button
          type="submit"
          disabled={saving}
          className="w-full btn-primary justify-center py-3.5 rounded-2xl text-sm font-black tracking-wide shadow-lg shadow-green-primary/30"
        >
          {saving ? <LoadingSpinner size="sm" /> : <Save className="h-4 w-4" />}
          <span>{saving ? 'SAVING EXPENSES...' : 'SAVE EXPENSES'}</span>
        </button>
      </form>
    </div>
  );
};

export default DriverExpenseEntry;
