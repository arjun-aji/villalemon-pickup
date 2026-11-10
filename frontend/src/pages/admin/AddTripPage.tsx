import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Car,
  Calendar,
  Clock,
  Phone,
  User,
  MapPin,
  Plane,
  IndianRupee,
  Users,
  Copy,
  Check,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { tripService } from '../../services/tripService';
import { driverService } from '../../services/driverService';
import { useAuth } from '../../context/AuthContext';
import { DriverEmployee } from '../../types';
import { generatePlacardText } from '../../utils/formatters';

const AddTripPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [drivers, setDrivers] = useState<DriverEmployee[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedPlacard, setCopiedPlacard] = useState(false);

  // Form State
  const today = new Date().toISOString().split('T')[0];
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [pickupDate, setPickupDate] = useState(today);
  const [pickupTime, setPickupTime] = useState('10:00');
  const [pickupLocation, setPickupLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [numPassengers, setNumPassengers] = useState(1);

  // Financials
  const [amountToCollect, setAmountToCollect] = useState<number | ''>('');
  const [driverCharge, setDriverCharge] = useState<number | ''>('');
  const [otherCharges, setOtherCharges] = useState<number | ''>(0);

  // Assignment Options
  const [assignmentType, setAssignmentType] = useState<'assign' | 'enroll' | 'unassigned'>('enroll');
  const [assignedDriverId, setAssignedDriverId] = useState('');

  // Placard & Instructions
  const [placardText, setPlacardText] = useState('');
  const [tripNotes, setTripNotes] = useState('');

  useEffect(() => {
    driverService.getAll().then(list => {
      setDrivers(list.filter(d => d.employment_status === 'active'));
      if (list.length > 0) {
        setAssignedDriverId(list[0].id);
      }
    });
  }, []);

  // Update placard when customer name changes
  useEffect(() => {
    if (customerName) {
      setPlacardText(generatePlacardText(customerName));
    }
  }, [customerName]);

  const handleCopyPlacard = () => {
    navigator.clipboard.writeText(placardText);
    setCopiedPlacard(true);
    setTimeout(() => setCopiedPlacard(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await tripService.create({
        customer_name: customerName,
        customer_phone: customerPhone,
        pickup_date: pickupDate,
        pickup_time: pickupTime,
        pickup_location: pickupLocation,
        destination: destination,
        flight_number: flightNumber,
        num_passengers: Number(numPassengers),
        amount_to_collect: Number(amountToCollect),
        driver_charge: Number(driverCharge),
        other_fixed_charges: Number(otherCharges),
        placard_text: placardText,
        trip_notes: tripNotes,
        assigned_driver_id: assignmentType === 'assign' ? assignedDriverId : undefined,
        is_published_for_enrollment: assignmentType === 'enroll',
      }, user?.id || profile?.id);

      navigate('/admin/trips');
    } catch (err: any) {
      alert(err.message || 'Failed to create trip');
    } finally {
      setLoading(false);
    }
  };

  const calculatedProfit = Number(amountToCollect) - Number(driverCharge) - Number(otherCharges);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/admin/trips')}
          className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Trips</span>
        </button>

        <span className="text-xs text-green-primary font-semibold flex items-center gap-1">
          <Sparkles className="h-3.5 w-3.5" />
          Auto-generating Trip Number & Settlement Record
        </span>
      </div>

      <div className="card p-6 md:p-8">
        <div className="flex items-center gap-3 pb-6 border-b border-border">
          <div className="p-2.5 bg-green-light rounded-xl">
            <Car className="h-6 w-6 text-green-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Add New Trip (Create Pickup)</h1>
            <p className="text-xs text-text-secondary">
              Fill in customer, route, financial and driver assignment details
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="pt-6 space-y-8">
          {/* Section A: Customer Details */}
          <div>
            <h2 className="text-sm font-bold text-navy-primary uppercase tracking-wider mb-4 flex items-center gap-2">
              <User className="h-4 w-4 text-green-primary" />
              Customer Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Customer Name</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="e.g. Anjali"
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">Customer Phone</label>
                <input
                  type="text"
                  required
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">Pickup Date</label>
                <input
                  type="date"
                  required
                  value={pickupDate}
                  onChange={e => setPickupDate(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">Pickup Time</label>
                <input
                  type="time"
                  required
                  value={pickupTime}
                  onChange={e => setPickupTime(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">Pickup Location</label>
                <input
                  type="text"
                  required
                  value={pickupLocation}
                  onChange={e => setPickupLocation(e.target.value)}
                  placeholder="e.g. Varkala, VillaLemon"
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">Destination</label>
                <input
                  type="text"
                  required
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  placeholder="e.g. Trivandrum Airport"
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">Flight / Train Number (Optional)</label>
                <input
                  type="text"
                  value={flightNumber}
                  onChange={e => setFlightNumber(e.target.value)}
                  placeholder="e.g. AI-504"
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">Number of Passengers</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={numPassengers}
                  onChange={e => setNumPassengers(Number(e.target.value))}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Section B: Trip & Financial Details */}
          <div className="pt-4 border-t border-border">
            <h2 className="text-sm font-bold text-navy-primary uppercase tracking-wider mb-4 flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-green-primary" />
              Trip & Financial Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Amount to Collect (₹) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={amountToCollect}
                  onChange={e => setAmountToCollect(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 3500"
                  className="input-field font-semibold text-text-primary"
                />
              </div>

              <div>
                <label className="label">Driver Charge (₹) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={driverCharge}
                  onChange={e => setDriverCharge(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 1000"
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">Additional Charges (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={otherCharges}
                  onChange={e => setOtherCharges(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 0"
                  className="input-field"
                />
              </div>
            </div>

            <div className="mt-3 p-3 bg-green-light rounded-xl flex items-center justify-between text-xs">
              <span className="font-semibold text-text-primary">Estimated Base Profit:</span>
              <span className="text-sm font-black text-green-primary">₹{calculatedProfit.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Section C: Driver Assignment Options */}
          <div className="pt-4 border-t border-border">
            <h2 className="text-sm font-bold text-navy-primary uppercase tracking-wider mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-green-primary" />
              Driver Assignment
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <label
                className={`p-3.5 rounded-xl border cursor-pointer flex items-center gap-3 text-xs font-semibold transition-all ${
                  assignmentType === 'assign'
                    ? 'border-green-primary bg-green-light text-green-primary'
                    : 'border-border text-text-primary hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="assignment"
                  checked={assignmentType === 'assign'}
                  onChange={() => setAssignmentType('assign')}
                  className="text-green-primary"
                />
                <span>Assign Driver Directly</span>
              </label>

              <label
                className={`p-3.5 rounded-xl border cursor-pointer flex items-center gap-3 text-xs font-semibold transition-all ${
                  assignmentType === 'enroll'
                    ? 'border-green-primary bg-green-light text-green-primary'
                    : 'border-border text-text-primary hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="assignment"
                  checked={assignmentType === 'enroll'}
                  onChange={() => setAssignmentType('enroll')}
                  className="text-green-primary"
                />
                <span>Open for Driver Enrollment</span>
              </label>

              <label
                className={`p-3.5 rounded-xl border cursor-pointer flex items-center gap-3 text-xs font-semibold transition-all ${
                  assignmentType === 'unassigned'
                    ? 'border-green-primary bg-green-light text-green-primary'
                    : 'border-border text-text-primary hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="assignment"
                  checked={assignmentType === 'unassigned'}
                  onChange={() => setAssignmentType('unassigned')}
                  className="text-green-primary"
                />
                <span>Keep Unassigned</span>
              </label>
            </div>

            {assignmentType === 'assign' && (
              <div>
                <label className="label">Choose Driver</label>
                <select
                  value={assignedDriverId}
                  onChange={e => setAssignedDriverId(e.target.value)}
                  className="input-field"
                  required={assignmentType === 'assign'}
                >
                  <option value="">-- Select Active Driver --</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.full_name} ({d.username}) • {d.vehicle_number}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Section D: Placard Information */}
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Placard / Name Board Text</label>
              <button
                type="button"
                onClick={handleCopyPlacard}
                className="text-xs text-green-primary hover:underline flex items-center gap-1 font-semibold"
              >
                {copiedPlacard ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedPlacard ? 'Copied!' : 'Copy Placard'}</span>
              </button>
            </div>
            <input
              type="text"
              value={placardText}
              onChange={e => setPlacardText(e.target.value)}
              className="input-field font-mono font-bold tracking-wider text-navy-primary bg-gray-50"
            />

            {/* Placard Preview Box */}
            <div className="mt-3 p-4 bg-navy-sidebar text-white rounded-xl text-center border-2 border-dashed border-green-primary/50">
              <span className="text-[10px] tracking-widest text-green-primary uppercase font-bold block mb-1">
                Name Board Preview
              </span>
              <p className="text-lg font-black tracking-widest font-mono text-white">
                {placardText || 'VARKALA HOLIDAYS'}
              </p>
            </div>
          </div>

          {/* Section E: Trip Instructions */}
          <div className="pt-4 border-t border-border">
            <label className="label">Trip Notes & Special Instructions (Optional)</label>
            <textarea
              rows={3}
              value={tripNotes}
              onChange={e => setTripNotes(e.target.value)}
              placeholder="e.g. Pickup gate, flight arrival instructions, guest contact info..."
              className="input-field"
            />
          </div>

          {/* Bottom Actions */}
          <div className="pt-6 border-t border-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/trips')}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary text-xs py-2.5 px-5 shadow-md shadow-green-primary/20"
            >
              {loading ? 'Creating Trip...' : 'Create Trip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTripPage;

