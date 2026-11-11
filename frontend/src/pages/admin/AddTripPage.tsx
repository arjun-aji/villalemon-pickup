import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  Building2,
  Truck,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import { tripService } from '../../services/tripService';
import { driverService } from '../../services/driverService';
import { organizationService, vehicleService } from '../../services/adminOperationsService';
import { useAuth } from '../../context/AuthContext';
import {
  Driver,
  Organization,
  Vehicle,
  TripCategory,
  VehicleType,
  AirportTerminal,
  CollectionRule,
} from '../../types';
import { generatePlacardText, formatINR } from '../../utils/formatters';
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

const AddTripPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedPlacard, setCopiedPlacard] = useState(false);

  // Form State
  const today = new Date().toISOString().split('T')[0];
  const [organizationId, setOrganizationId] = useState('');
  const [orderedBy, setOrderedBy] = useState('Front Desk');
  const [tripCategory, setTripCategory] = useState<TripCategory>('Airport Pick-up');
  const [tripDate, setTripDate] = useState(today);
  const [pickupTime, setPickupTime] = useState('10:00');

  // Guest Details
  const [guestNames, setGuestNames] = useState('');
  const [guestContact, setGuestContact] = useState('');
  const [totalPeople, setTotalPeople] = useState(2);
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Routing
  const [pickupLocation, setPickupLocation] = useState('Trivandrum Airport (TRV)');
  const [dropoffLocation, setDropoffLocation] = useState('VillaLemon Homestay, Varkala');
  const [finalDropoff, setFinalDropoff] = useState('');
  const [flightNumberAndTime, setFlightNumberAndTime] = useState('');
  const [airportTerminal, setAirportTerminal] = useState<AirportTerminal>('Terminal 2');
  const [requiredCabType, setRequiredCabType] = useState<VehicleType>('Sedan');

  // Crew & Fleet Assignment
  const [assignmentMode, setAssignmentMode] = useState<'assign' | 'enroll' | 'unassigned'>('assign');
  const [assignedDriverId, setAssignedDriverId] = useState('');
  const [assignedVehicleId, setAssignedVehicleId] = useState('');

  // Financials
  const [tripSellingPrice, setTripSellingPrice] = useState<number | ''>(2500);
  const [collectionRule, setCollectionRule] = useState<CollectionRule>('Collect');
  const [amountDriverMustCollect, setAmountDriverMustCollect] = useState<number | ''>(2500);
  const [driverTripPay, setDriverTripPay] = useState<number | ''>(800);

  // Placard text
  const [placardText, setPlacardText] = useState('');

  useEffect(() => {
    Promise.all([
      organizationService.getAll(),
      driverService.getAll(),
      vehicleService.getAll(),
    ]).then(([orgList, drvList, vehList]) => {
      setOrganizations(orgList);
      if (orgList.length > 0) setOrganizationId(orgList[0].id);

      const activeDrivers = drvList.filter(d => d.status === 'Active' || d.employment_status === 'active');
      setDrivers(activeDrivers);
      if (activeDrivers.length > 0) {
        setAssignedDriverId(activeDrivers[0].id);
        if (activeDrivers[0].per_trip_payment) {
          setDriverTripPay(activeDrivers[0].per_trip_payment);
        }
      }

      const activeVehicles = vehList.filter(v => v.status === 'Available');
      setVehicles(activeVehicles);
      if (activeVehicles.length > 0) setAssignedVehicleId(activeVehicles[0].id);
    });
  }, []);

  // Sync placard with guest name
  useEffect(() => {
    if (guestNames) {
      setPlacardText(generatePlacardText(guestNames));
    }
  }, [guestNames]);

  // Sync collection amount with collection rule
  useEffect(() => {
    if (collectionRule === 'Do not collect') {
      setAmountDriverMustCollect(0);
    } else if (collectionRule === 'Collect' && amountDriverMustCollect === 0) {
      setAmountDriverMustCollect(tripSellingPrice);
    }
  }, [collectionRule, tripSellingPrice]);

  const handleCopyPlacard = () => {
    navigator.clipboard.writeText(placardText);
    setCopiedPlacard(true);
    setTimeout(() => setCopiedPlacard(false), 2000);
  };

  const isAirport = tripCategory === 'Airport Pick-up' || tripCategory === 'Airport Drop';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestNames.trim()) {
      alert('Please enter guest name(s)');
      return;
    }

    setLoading(true);

    try {
      await tripService.create({
        organization_id: organizationId,
        ordered_by: orderedBy,
        trip_category: tripCategory,
        trip_date: tripDate,
        pickup_time: pickupTime,
        guest_names: guestNames,
        guest_contact_number: guestContact,
        total_people: Number(totalPeople),
        pickup_location: pickupLocation,
        dropoff_location: dropoffLocation,
        final_dropoff: finalDropoff || undefined,
        flight_number_and_time: flightNumberAndTime || undefined,
        airport_terminal: isAirport ? airportTerminal : undefined,
        required_cab_type: requiredCabType,
        special_instructions: specialInstructions || undefined,
        placard_text: placardText,
        assigned_driver_id: assignmentMode === 'assign' ? assignedDriverId : undefined,
        assigned_vehicle_id: assignmentMode === 'assign' ? assignedVehicleId : undefined,
        trip_selling_price: Number(tripSellingPrice) || 0,
        collection_rule: collectionRule,
        amount_driver_must_collect: Number(amountDriverMustCollect) || 0,
        driver_trip_pay_override: driverTripPay ? Number(driverTripPay) : undefined,
        is_published_for_enrollment: assignmentMode === 'enroll',
        trip_status: assignmentMode === 'assign' ? 'Assigned' : 'Confirmed',
        // Backward compatibility
        customer_name: guestNames,
        customer_phone: guestContact,
        amount_to_collect: Number(amountDriverMustCollect) || 0,
        driver_charge: Number(driverTripPay) || 0,
      }, user?.id || profile?.id);

      navigate('/admin/trips');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to create trip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/trips"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Trips</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 uppercase">
              Operations Dispatch
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Create & Schedule New Duty Trip</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full 38-field transport duty form matching Varkala Holidays system. Configure client rate, collection rule, and driver dispatch.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* Section 1: Client & Service Category */}
          <div className="space-y-3">
            <h2 className="font-bold uppercase tracking-wider text-slate-400 text-[11px]">
              1. Client & Service Category
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Client / Organization *</label>
                <select
                  value={organizationId}
                  onChange={e => {
                    setOrganizationId(e.target.value);
                    const org = organizations.find(o => o.id === e.target.value);
                    if (org) {
                      setOrderedBy(org.contact_person || 'Front Desk');
                      setDropoffLocation(org.name);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold"
                  required
                >
                  {organizations.map(o => (
                    <option key={o.id} value={o.id}>{o.name} ({o.type})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ordered By / Contact</label>
                <input
                  type="text"
                  value={orderedBy}
                  onChange={e => setOrderedBy(e.target.value)}
                  placeholder="Manager / Front Desk agent"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Trip Category *</label>
                <select
                  value={tripCategory}
                  onChange={e => setTripCategory(e.target.value as TripCategory)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                >
                  {TRIP_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Trip Date *</label>
                <input
                  type="date"
                  value={tripDate}
                  onChange={e => setTripDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pickup Time *</label>
                <input
                  type="time"
                  value={pickupTime}
                  onChange={e => setPickupTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Guest Details */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h2 className="font-bold uppercase tracking-wider text-slate-400 text-[11px]">
              2. Guest Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Guest Name(s) *</label>
                <input
                  type="text"
                  value={guestNames}
                  onChange={e => setGuestNames(e.target.value)}
                  required
                  placeholder="e.g. John Doe, Sarah Smith"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Guest WhatsApp / Phone</label>
                <input
                  type="tel"
                  value={guestContact}
                  onChange={e => setGuestContact(e.target.value)}
                  placeholder="+91 or international phone"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Number of Passengers *</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={totalPeople}
                  onChange={e => setTotalPeople(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 3: Routing & Flight */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h2 className="font-bold uppercase tracking-wider text-slate-400 text-[11px]">
              3. Route & Schedule Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pickup Location *</label>
                <input
                  type="text"
                  value={pickupLocation}
                  onChange={e => setPickupLocation(e.target.value)}
                  required
                  placeholder="e.g. Trivandrum Airport (TRV)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Drop-off Location *</label>
                <input
                  type="text"
                  value={dropoffLocation}
                  onChange={e => setDropoffLocation(e.target.value)}
                  required
                  placeholder="e.g. VillaLemon Homestay, North Cliff"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Required Cab Type *</label>
                <select
                  value={requiredCabType}
                  onChange={e => setRequiredCabType(e.target.value as VehicleType)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                >
                  {VEHICLE_TYPES.map(vt => (
                    <option key={vt} value={vt}>{vt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Flight Number & Time</label>
                <input
                  type="text"
                  value={flightNumberAndTime}
                  onChange={e => setFlightNumberAndTime(e.target.value)}
                  placeholder="e.g. AI-506 (09:45 AM)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              {isAirport && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Airport Terminal</label>
                  <select
                    value={airportTerminal}
                    onChange={e => setAirportTerminal(e.target.value as AirportTerminal)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  >
                    <option value="Terminal 1">Terminal 1 (Domestic)</option>
                    <option value="Terminal 2">Terminal 2 (International)</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Fleet & Crew Assignment */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h2 className="font-bold uppercase tracking-wider text-slate-400 text-[11px]">
              4. Crew & Vehicle Assignment
            </h2>
            <div className="flex gap-4 p-3 bg-slate-50 rounded-xl">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="assignmentMode"
                  checked={assignmentMode === 'assign'}
                  onChange={() => setAssignmentMode('assign')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="font-semibold text-slate-800">Assign Driver & Vehicle Now</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="assignmentMode"
                  checked={assignmentMode === 'enroll'}
                  onChange={() => setAssignmentMode('enroll')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="font-semibold text-slate-800">Open for Driver Enrollment</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="assignmentMode"
                  checked={assignmentMode === 'unassigned'}
                  onChange={() => setAssignmentMode('unassigned')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="font-semibold text-slate-800">Assign Later</span>
              </label>
            </div>

            {assignmentMode === 'assign' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Driver *</label>
                  <select
                    value={assignedDriverId}
                    onChange={e => {
                      setAssignedDriverId(e.target.value);
                      const drv = drivers.find(d => d.id === e.target.value);
                      if (drv?.per_trip_payment) setDriverTripPay(drv.per_trip_payment);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    required={assignmentMode === 'assign'}
                  >
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.full_name} ({d.phone}) • {d.employment_type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Vehicle</label>
                  <select
                    value={assignedVehicleId}
                    onChange={e => setAssignedVehicleId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  >
                    <option value="">-- Auto-assign or None --</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.registration_number} • {v.vehicle_type} ({v.ownership})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Financials & Collection Rules */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h2 className="font-bold uppercase tracking-wider text-slate-400 text-[11px]">
              5. Financials & Collections
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Client Selling Price (₹) *</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={tripSellingPrice}
                  onChange={e => setTripSellingPrice(parseFloat(e.target.value) || '')}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Collection Rule *</label>
                <select
                  value={collectionRule}
                  onChange={e => setCollectionRule(e.target.value as CollectionRule)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                >
                  <option value="Collect">Collect from guest</option>
                  <option value="Do not collect">Do not collect (Office bill)</option>
                  <option value="Ask office">Ask office</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Amount Driver Collects (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={amountDriverMustCollect}
                  onChange={e => setAmountDriverMustCollect(parseFloat(e.target.value) || 0)}
                  disabled={collectionRule === 'Do not collect'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Driver Pay (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={driverTripPay}
                  onChange={e => setDriverTripPay(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Section 6: Placard & Name Board Live Card */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold uppercase tracking-wider text-slate-400 text-[11px]">
                6. Placard / Airport Name Board
              </h2>
              <button
                type="button"
                onClick={handleCopyPlacard}
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                {copiedPlacard ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPlacard ? 'Copied' : 'Copy Placard'}</span>
              </button>
            </div>

            <div className="p-4 bg-[#0F1E36] text-white rounded-xl text-center border-2 border-dashed border-amber-400/50 shadow-inner font-mono font-bold tracking-widest text-sm">
              {placardText || 'VARKALA HOLIDAYS - GUEST'}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Special Instructions & Driver Notes</label>
              <textarea
                rows={2}
                value={specialInstructions}
                onChange={e => setSpecialInstructions(e.target.value)}
                placeholder="e.g. Placard at International Exit Gate 3, AC on full, Extra luggage bags"
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-end gap-3">
            <Link
              to="/admin/trips"
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md transition-all disabled:opacity-50"
            >
              {loading && <LoadingSpinner size="sm" />}
              <span>Create & Dispatch Trip</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTripPage;
