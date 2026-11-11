import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Car,
  Calendar,
  Clock,
  User,
  Phone,
  Users,
  MapPin,
  Plane,
  FileText,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { TripCategory, VehicleType, AirportTerminal } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const TRIP_CATEGORIES: TripCategory[] = [
  'Airport Pick-up',
  'Airport Drop',
  'Sightseeing',
  'Drop Only at Location',
  'Pick-up from Location',
];

const VEHICLE_TYPES: VehicleType[] = [
  'Sedan',
  'SUV',
  'Innova',
  'Ertiga',
  'Tempo Traveller 17-seater',
  'Tempo Traveller 26-seater',
  'Other',
];

const OrganizationSubmitTrip: React.FC = () => {
  const { profile, organization } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state matching 38-field schema
  const [orderedBy, setOrderedBy] = useState(organization?.contact_person || profile?.full_name || '');
  const [tripDate, setTripDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [pickupTime, setPickupTime] = useState('10:00');
  const [tripCategory, setTripCategory] = useState<TripCategory>('Airport Pick-up');
  const [guestNames, setGuestNames] = useState('');
  const [guestContact, setGuestContact] = useState('');
  const [totalPeople, setTotalPeople] = useState(1);
  const [pickupLocation, setPickupLocation] = useState('Trivandrum Airport (TRV)');
  const [dropoffLocation, setDropoffLocation] = useState(organization?.name || 'Varkala Beach');
  const [flightNumberAndTime, setFlightNumberAndTime] = useState('');
  const [airportTerminal, setAirportTerminal] = useState<AirportTerminal>('Terminal 2');
  const [requiredCabType, setRequiredCabType] = useState<VehicleType>('Sedan');
  const [specialInstructions, setSpecialInstructions] = useState('');

  const isAirportTrip = tripCategory === 'Airport Pick-up' || tripCategory === 'Airport Drop';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!guestNames.trim()) {
      setError('Please provide the guest name(s)');
      return;
    }
    if (!pickupLocation.trim() || !dropoffLocation.trim()) {
      setError('Please specify both pickup and drop-off locations');
      return;
    }

    try {
      setLoading(true);

      if (isSupabaseConfigured && organization?.id) {
        const { data, error: insertError } = await supabase
          .from('trips')
          .insert({
            organization_id: organization.id,
            ordered_by: orderedBy.trim(),
            trip_date: tripDate,
            pickup_time: pickupTime,
            trip_category: tripCategory,
            guest_names: guestNames.trim(),
            guest_contact_number: guestContact.trim() || null,
            total_people: Number(totalPeople) || 1,
            pickup_location: pickupLocation.trim(),
            dropoff_location: dropoffLocation.trim(),
            flight_number_and_time: flightNumberAndTime.trim() || null,
            airport_terminal: isAirportTrip ? airportTerminal : null,
            required_cab_type: requiredCabType,
            special_instructions: specialInstructions.trim() || null,
            trip_status: 'Pending Approval',
            submitted_by_org: true,
            created_by: profile?.id,
          })
          .select()
          .single();

        if (insertError) throw insertError;
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/org/trips');
      }, 1500);
    } catch (err: any) {
      console.error('Trip request error:', err);
      setError(err.message || 'Failed to submit pickup request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/org/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="border-b border-slate-100 pb-4 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 uppercase">
              Partner Request Form
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Request New Guest Pickup</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit duty details for review. VillaLemon / Varkala Holidays dispatch team will verify, assign driver and vehicle, and confirm duty schedule.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-bold">Submission Error</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-800 text-xs">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Pickup Request Submitted Successfully!</p>
              <p className="text-emerald-700 mt-0.5">
                Our operations team has received this request. You will receive live notifications when a driver is assigned.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Trip Category & Timing */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              1. Service Category & Date
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Trip Category *
                </label>
                <select
                  value={tripCategory}
                  onChange={e => setTripCategory(e.target.value as TripCategory)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                >
                  {TRIP_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Trip Date *
                </label>
                <input
                  type="date"
                  value={tripDate}
                  onChange={e => setTripDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pickup Time *
                </label>
                <input
                  type="time"
                  value={pickupTime}
                  onChange={e => setPickupTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Guest Details */}
          <div className="pt-4 border-t border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              2. Guest Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Guest Name(s) *
                </label>
                <input
                  type="text"
                  value={guestNames}
                  onChange={e => setGuestNames(e.target.value)}
                  placeholder="e.g. John Doe, Sarah Smith"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Guest WhatsApp / Phone
                </label>
                <input
                  type="tel"
                  value={guestContact}
                  onChange={e => setGuestContact(e.target.value)}
                  placeholder="+91 or international phone"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Number of Passengers *
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={totalPeople}
                  onChange={e => setTotalPeople(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 3: Route Details */}
          <div className="pt-4 border-t border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              3. Pickup & Drop Locations
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pickup Location *
                </label>
                <input
                  type="text"
                  value={pickupLocation}
                  onChange={e => setPickupLocation(e.target.value)}
                  placeholder="e.g. Trivandrum Airport (TRV) / Kochi Airport"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Drop-off Location *
                </label>
                <input
                  type="text"
                  value={dropoffLocation}
                  onChange={e => setDropoffLocation(e.target.value)}
                  placeholder="e.g. VillaLemon Homestay, North Cliff"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 4: Flight & Vehicle Requirements */}
          <div className="pt-4 border-t border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              4. Flight & Fleet Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Required Cab Type *
                </label>
                <select
                  value={requiredCabType}
                  onChange={e => setRequiredCabType(e.target.value as VehicleType)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                >
                  {VEHICLE_TYPES.map(vt => (
                    <option key={vt} value={vt}>{vt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Flight # & Arrival Time
                </label>
                <input
                  type="text"
                  value={flightNumberAndTime}
                  onChange={e => setFlightNumberAndTime(e.target.value)}
                  placeholder="e.g. AI-506 (09:45 AM)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {isAirportTrip && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Airport Terminal
                  </label>
                  <select
                    value={airportTerminal}
                    onChange={e => setAirportTerminal(e.target.value as AirportTerminal)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Terminal 1">Terminal 1 (Domestic)</option>
                    <option value="Terminal 2">Terminal 2 (International)</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Section 5: Contact Person & Special Instructions */}
          <div className="pt-4 border-t border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              5. Instructions & Contact Person
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ordered by / Contact Person *
                </label>
                <input
                  type="text"
                  value={orderedBy}
                  onChange={e => setOrderedBy(e.target.value)}
                  placeholder="Manager / Front desk agent name"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Special Instructions / Placard Text
                </label>
                <input
                  type="text"
                  value={specialInstructions}
                  onChange={e => setSpecialInstructions(e.target.value)}
                  placeholder="e.g. Placard: MR. JOHN DOE, AC on full, Extra luggage"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-end gap-3">
            <Link
              to="/org/dashboard"
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || success}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50 active:scale-95"
            >
              {loading && <LoadingSpinner size="sm" />}
              <span>{loading ? 'Submitting Request...' : 'Submit Pickup Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrganizationSubmitTrip;

