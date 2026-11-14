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
  UserCheck,
  UserPlus,
  Eye,
  EyeOff,
  Share2,
  CheckCircle2,
  PlusCircle,
  FileText,
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
  Trip,
} from '../../types';
import {
  generatePlacardText,
  formatINR,
  formatDate,
  formatTime,
  generateDriverDispatchMessage,
  formatWhatsAppShareUrl,
} from '../../utils/formatters';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';

interface CategoryOption {
  id: TripCategory;
  label: string;
  desc: string;
  badge?: string;
}

const PRIMARY_CATEGORIES: CategoryOption[] = [
  {
    id: 'Airport Pick-up',
    label: 'Airport Pick-up',
    desc: 'Arrival pickup with airport name board',
    badge: 'Placard Enabled',
  },
  {
    id: 'Airport Drop',
    label: 'Airport Drop',
    desc: 'Departure drop to airport terminal',
  },
  {
    id: 'Sightseeing',
    label: 'Sightseeing',
    desc: 'Day tour, cliff, beaches & attractions',
  },
  {
    id: 'Others',
    label: 'Others',
    desc: 'Point-to-point transfer or custom duty',
  },
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

  // Crew & Fleet Assignment Mode: 'registered' | 'outside' | 'enroll' | 'unassigned'
  const [assignmentMode, setAssignmentMode] = useState<'registered' | 'outside' | 'enroll' | 'unassigned'>('registered');
  const [assignedDriverId, setAssignedDriverId] = useState('');
  const [assignedVehicleId, setAssignedVehicleId] = useState('');

  // Outside Driver Manual Inputs
  const [outsideDriverName, setOutsideDriverName] = useState('');
  const [outsideDriverPhone, setOutsideDriverPhone] = useState('');
  const [outsideVehicleReg, setOutsideVehicleReg] = useState('');
  const [outsideVehicleType, setOutsideVehicleType] = useState<VehicleType>('Sedan');

  // Financials: Trip Cost (Confidential Admin) vs Amount Driver Collects (Driver View)
  const [tripSellingPrice, setTripSellingPrice] = useState<number | ''>(2500);
  const [collectionRule, setCollectionRule] = useState<CollectionRule>('Collect');
  const [amountDriverMustCollect, setAmountDriverMustCollect] = useState<number | ''>(2500);
  const [driverTripPay, setDriverTripPay] = useState<number | ''>(800);

  // Placard text (Manually entered for Airport Pickup)
  const [placardText, setPlacardText] = useState('VARKALA HOLIDAYS - GUEST');
  const [isPlacardCustomized, setIsPlacardCustomized] = useState(false);

  // Success Dispatch Modal State
  const [createdTripResult, setCreatedTripResult] = useState<{
    trip: Trip;
    dispatchMessage: string;
    driverPhone?: string;
    driverName?: string;
  } | null>(null);
  const [copiedDispatch, setCopiedDispatch] = useState(false);

  const isAirportPickup = tripCategory === 'Airport Pick-up';
  const isAirport = tripCategory === 'Airport Pick-up' || tripCategory === 'Airport Drop';

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

  // Update default placard when guest name changes ONLY IF admin hasn't customized it manually
  useEffect(() => {
    if (guestNames.trim() && !isPlacardCustomized && isAirportPickup) {
      setPlacardText(`VARKALA HOLIDAYS - ${guestNames.trim().toUpperCase()}`);
    }
  }, [guestNames, isAirportPickup, isPlacardCustomized]);

  // Adjust routing presets based on category selection
  const handleCategoryChange = (cat: TripCategory) => {
    setTripCategory(cat);
    if (cat === 'Airport Pick-up') {
      setPickupLocation('Trivandrum Airport (TRV)');
      setDropoffLocation('VillaLemon Homestay, Varkala');
      if (guestNames.trim()) {
        setPlacardText(`VARKALA HOLIDAYS - ${guestNames.trim().toUpperCase()}`);
      }
    } else if (cat === 'Airport Drop') {
      setPickupLocation('VillaLemon Homestay, Varkala');
      setDropoffLocation('Trivandrum Airport (TRV)');
    } else if (cat === 'Sightseeing') {
      setPickupLocation('VillaLemon Homestay, Varkala');
      setDropoffLocation('Varkala Cliff, Golden Island & Jatayu Earth Center');
    } else {
      setPickupLocation('');
      setDropoffLocation('');
    }
  };

  // Sync collection amount with collection rule
  useEffect(() => {
    if (collectionRule === 'Do not collect') {
      setAmountDriverMustCollect(0);
    } else if (collectionRule === 'Collect' && amountDriverMustCollect === 0) {
      setAmountDriverMustCollect(tripSellingPrice || 0);
    }
  }, [collectionRule, tripSellingPrice]);

  const handleCopyPlacard = () => {
    navigator.clipboard.writeText(placardText);
    setCopiedPlacard(true);
    setTimeout(() => setCopiedPlacard(false), 2000);
  };

  const handleCopyDispatch = () => {
    if (!createdTripResult) return;
    navigator.clipboard.writeText(createdTripResult.dispatchMessage);
    setCopiedDispatch(true);
    setTimeout(() => setCopiedDispatch(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestNames.trim()) {
      alert('Please enter guest name(s)');
      return;
    }

    if (assignmentMode === 'outside') {
      if (!outsideDriverName.trim()) {
        alert('Please enter outside driver name');
        return;
      }
      if (!outsideVehicleReg.trim()) {
        alert('Please enter outside vehicle registration number');
        return;
      }
    }

    setLoading(true);

    const effectiveOrgId = organizationId || (organizations.length > 0 ? organizations[0].id : '');
    const selectedDriver = drivers.find(d => d.id === assignedDriverId);
    const selectedVehicle = vehicles.find(v => v.id === assignedVehicleId);

    const effectiveDriverName = assignmentMode === 'outside'
      ? outsideDriverName.trim()
      : assignmentMode === 'registered'
      ? (selectedDriver?.full_name || 'Driver')
      : undefined;

    const effectiveDriverPhone = assignmentMode === 'outside'
      ? outsideDriverPhone.trim()
      : assignmentMode === 'registered'
      ? selectedDriver?.phone
      : undefined;

    const effectiveVehicleReg = assignmentMode === 'outside'
      ? outsideVehicleReg.trim()
      : assignmentMode === 'registered'
      ? selectedVehicle?.registration_number
      : undefined;

    try {
      const createdTrip = await tripService.create(
        {
          organization_id: effectiveOrgId,
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
          placard_text: isAirportPickup ? placardText : undefined,
          assigned_driver_id: assignmentMode === 'registered' ? assignedDriverId : undefined,
          assigned_vehicle_id: assignmentMode === 'registered' ? assignedVehicleId : undefined,
          // Outside Driver Manual Properties
          outside_driver_name: assignmentMode === 'outside' ? outsideDriverName.trim() : undefined,
          outside_driver_phone: assignmentMode === 'outside' ? outsideDriverPhone.trim() : undefined,
          outside_vehicle_reg: assignmentMode === 'outside' ? outsideVehicleReg.trim() : undefined,
          outside_vehicle_type: assignmentMode === 'outside' ? outsideVehicleType : undefined,
          // Financials
          trip_selling_price: Number(tripSellingPrice) || 0,
          collection_rule: collectionRule,
          amount_driver_must_collect: Number(amountDriverMustCollect) || 0,
          driver_trip_pay_override: driverTripPay ? Number(driverTripPay) : undefined,
          is_published_for_enrollment: assignmentMode === 'enroll',
          trip_status: (assignmentMode === 'registered' || assignmentMode === 'outside') ? 'Assigned' : 'Confirmed',
          // Backward compatibility
          customer_name: guestNames,
          customer_phone: guestContact,
          amount_to_collect: Number(amountDriverMustCollect) || 0,
          driver_charge: Number(driverTripPay) || 0,
        },
        user?.id || profile?.id
      );

      // Generate driver dispatch message (Strictly NO price/cost mentioned)
      const dispatchMsg = generateDriverDispatchMessage({
        tripNumber: createdTrip.trip_number,
        tripCategory: tripCategory,
        tripDate: tripDate,
        pickupTime: pickupTime,
        pickupLocation: pickupLocation,
        dropoffLocation: dropoffLocation,
        finalDropoff: finalDropoff,
        guestNames: guestNames,
        guestContact: guestContact,
        totalPeople: Number(totalPeople),
        flightNumberAndTime: flightNumberAndTime,
        airportTerminal: isAirport ? airportTerminal : undefined,
        placardText: isAirportPickup ? placardText : undefined,
        requiredCabType: assignmentMode === 'outside' ? outsideVehicleType : requiredCabType,
        vehicleReg: effectiveVehicleReg,
        driverName: effectiveDriverName,
        specialInstructions: specialInstructions,
      });

      // Show the Success Dispatch Modal with Copy/WhatsApp buttons
      setCreatedTripResult({
        trip: createdTrip,
        dispatchMessage: dispatchMsg,
        driverPhone: effectiveDriverPhone,
        driverName: effectiveDriverName,
      });
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to create trip');
    } finally {
      setLoading(false);
    }
  };

  const selectedDriverProfile = drivers.find(d => d.id === assignedDriverId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Breadcrumb */}
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
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-navy-primary text-white uppercase tracking-wider">
              Duty Dispatch Engine
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Varkala Holidays Standard
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Create & Dispatch New Transport Duty</h1>
          <p className="text-xs text-slate-500 mt-1">
            Choose trip category, configure confidential client price & driver collection, assign registered or outside driver, and share duty message.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* Section 1: Trip Category Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold uppercase tracking-wider text-slate-500 text-[11px] flex items-center gap-1.5">
                <span>1. Service Category & Client</span>
              </h2>
            </div>

            {/* Visual Category Selection Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {PRIMARY_CATEGORIES.map(cat => {
                const isSelected = tripCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'border-navy-primary bg-navy-primary/5 text-navy-primary ring-2 ring-navy-primary/20 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs">{cat.label}</span>
                        {cat.badge && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-extrabold">
                            {cat.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-snug">{cat.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Client / Hotel / Org *</label>
                <select
                  value={organizationId}
                  onChange={e => {
                    setOrganizationId(e.target.value);
                    const org = organizations.find(o => o.id === e.target.value);
                    if (org) {
                      setOrderedBy(org.contact_person || 'Front Desk');
                      if (tripCategory === 'Airport Pick-up') {
                        setDropoffLocation(org.name);
                      }
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:ring-2 focus:ring-navy-primary/20"
                  required
                >
                  {organizations.map(o => (
                    <option key={o.id} value={o.id}>{o.name} ({o.type})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ordered By / Front Desk</label>
                <input
                  type="text"
                  value={orderedBy}
                  onChange={e => setOrderedBy(e.target.value)}
                  placeholder="Manager / Front Desk agent"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-navy-primary/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Duty Date *</label>
                  <input
                    type="date"
                    value={tripDate}
                    onChange={e => setTripDate(e.target.value)}
                    required
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-navy-primary/20 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pickup Time *</label>
                  <input
                    type="time"
                    value={pickupTime}
                    onChange={e => setPickupTime(e.target.value)}
                    required
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-navy-primary/20 font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Guest Details */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h2 className="font-bold uppercase tracking-wider text-slate-500 text-[11px]">
              2. Guest & Passenger Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Guest Name(s) *</label>
                <input
                  type="text"
                  value={guestNames}
                  onChange={e => setGuestNames(e.target.value)}
                  required
                  placeholder="e.g. Alexander Ivanov, Elena"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:ring-2 focus:ring-navy-primary/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Guest WhatsApp / Phone</label>
                <input
                  type="tel"
                  value={guestContact}
                  onChange={e => setGuestContact(e.target.value)}
                  placeholder="+91 / International number"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-navy-primary/20"
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
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-navy-primary/20"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 3: Routing & Flight */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h2 className="font-bold uppercase tracking-wider text-slate-500 text-[11px]">
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
                  placeholder="e.g. Trivandrum Airport (TRV) or VillaLemon Homestay"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-navy-primary/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Drop-off Location *</label>
                <input
                  type="text"
                  value={dropoffLocation}
                  onChange={e => setDropoffLocation(e.target.value)}
                  required
                  placeholder="e.g. VillaLemon Homestay or Trivandrum Airport"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-navy-primary/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Required Cab Type *</label>
                <select
                  value={requiredCabType}
                  onChange={e => setRequiredCabType(e.target.value as VehicleType)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-navy-primary/20"
                >
                  {VEHICLE_TYPES.map(vt => (
                    <option key={vt} value={vt}>{vt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isAirport ? 'Flight Number & Time' : 'Train / Reference Info'}
                </label>
                <input
                  type="text"
                  value={flightNumberAndTime}
                  onChange={e => setFlightNumberAndTime(e.target.value)}
                  placeholder={isAirport ? 'e.g. AI-506 (09:45 AM)' : 'e.g. Train 16346 / Local note'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-navy-primary/20"
                />
              </div>

              {isAirport ? (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Airport Terminal</label>
                  <select
                    value={airportTerminal}
                    onChange={e => setAirportTerminal(e.target.value as AirportTerminal)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-navy-primary/20"
                  >
                    <option value="Terminal 1">Terminal 1 (Domestic / Shankhumukham)</option>
                    <option value="Terminal 2">Terminal 2 (International / Chakai)</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Final Drop-off / Return</label>
                  <input
                    type="text"
                    value={finalDropoff}
                    onChange={e => setFinalDropoff(e.target.value)}
                    placeholder="e.g. Return to VillaLemon at evening"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-navy-primary/20"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Placard / Name Board (ONLY for Airport Pickup) */}
          {isAirportPickup && (
            <div className="pt-4 border-t border-slate-100 space-y-3 p-4 bg-amber-50/50 rounded-2xl border border-amber-200/80">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold uppercase tracking-wider text-amber-900 text-[11px] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>4. Airport Arrival Placard / Name Board</span>
                  </h2>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Only required for Airport Arrivals. Enter or edit the placard name manually as required.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyPlacard}
                  className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-900 font-semibold text-[11px] flex items-center gap-1 hover:bg-amber-100/50 transition-colors"
                >
                  {copiedPlacard ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedPlacard ? 'Copied' : 'Copy Placard'}</span>
                </button>
              </div>

              {/* Placard Manual Input */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Placard Text (Manually Editable) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={placardText}
                    onChange={e => {
                      setPlacardText(e.target.value);
                      setIsPlacardCustomized(true);
                    }}
                    placeholder="e.g. VARKALA HOLIDAYS - MR. ALEXANDER IVANOV"
                    className="flex-1 px-3 py-2 rounded-xl border border-amber-300 bg-white font-mono font-bold text-slate-900 uppercase tracking-wide focus:ring-2 focus:ring-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (guestNames.trim()) {
                        setPlacardText(`VARKALA HOLIDAYS - ${guestNames.trim().toUpperCase()}`);
                        setIsPlacardCustomized(false);
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-amber-200/70 hover:bg-amber-200 text-amber-900 font-semibold text-xs transition-colors shrink-0"
                    title="Reset to Guest Name"
                  >
                    Auto-Fill
                  </button>
                </div>
              </div>

              {/* Live Dark Board Preview */}
              <div className="p-4 bg-[#0F1E36] text-white rounded-xl text-center border-2 border-dashed border-amber-400/60 shadow-inner font-mono font-bold tracking-widest text-sm">
                <span className="text-amber-400 mr-2 font-black">🚖</span>
                <span>{placardText || 'VARKALA HOLIDAYS - GUEST'}</span>
              </div>
            </div>
          )}

          {/* Section 5: Driver & Crew Assignment (Dropdown with Profiles OR Outside Driver) */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold uppercase tracking-wider text-slate-500 text-[11px]">
                5. Driver & Vehicle Assignment
              </h2>
            </div>

            {/* Assignment Mode Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setAssignmentMode('registered')}
                className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  assignmentMode === 'registered'
                    ? 'bg-navy-primary text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Registered Fleet Driver</span>
              </button>

              <button
                type="button"
                onClick={() => setAssignmentMode('outside')}
                className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  assignmentMode === 'outside'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Outside / External Driver</span>
              </button>

              <button
                type="button"
                onClick={() => setAssignmentMode('enroll')}
                className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  assignmentMode === 'enroll'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Open for Enrollment</span>
              </button>
            </div>

            {/* Mode 1: Registered Driver Dropdown with Profiles */}
            {assignmentMode === 'registered' && (
              <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Choose Registered Driver (With Profile) *
                    </label>
                    <select
                      value={assignedDriverId}
                      onChange={e => {
                        setAssignedDriverId(e.target.value);
                        const drv = drivers.find(d => d.id === e.target.value);
                        if (drv?.per_trip_payment) {
                          setDriverTripPay(drv.per_trip_payment);
                        }
                      }}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-navy-primary/20"
                      required={assignmentMode === 'registered'}
                    >
                      {drivers.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.full_name} • {d.phone} • {d.employment_type} {d.vehicle_number ? `(${d.vehicle_number})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Assign Fleet Vehicle</label>
                    <select
                      value={assignedVehicleId}
                      onChange={e => setAssignedVehicleId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-navy-primary/20"
                    >
                      <option value="">-- Auto-assign or Driver's Default Cab --</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.registration_number} • {v.vehicle_type} ({v.ownership})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Driver Profile Summary Pill */}
                {selectedDriverProfile && (
                  <div className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold uppercase">
                        {selectedDriverProfile.full_name.slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{selectedDriverProfile.full_name}</p>
                        <p className="text-[11px] text-slate-500">
                          📞 {selectedDriverProfile.phone} • DL: {selectedDriverProfile.driving_licence_no || 'Pending'}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px] uppercase">
                      Fleet Driver Active
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Mode 2: Outside Driver (Manual Entry for Name and Vehicle Number) */}
            {assignmentMode === 'outside' && (
              <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <h3 className="font-bold text-amber-900 text-xs">Outside / External Taxi Driver Details</h3>
                  </div>
                  <span className="text-[10px] text-amber-700 font-semibold">
                    Manually enter driver name & vehicle number
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Outside Driver Name *
                    </label>
                    <input
                      type="text"
                      value={outsideDriverName}
                      onChange={e => setOutsideDriverName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar (Outside Taxi)"
                      required={assignmentMode === 'outside'}
                      className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Driver Phone / WhatsApp (For Dispatch)
                    </label>
                    <input
                      type="tel"
                      value={outsideDriverPhone}
                      onChange={e => setOutsideDriverPhone(e.target.value)}
                      placeholder="e.g. 9847123456"
                      className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Outside Vehicle Registration Number *
                    </label>
                    <input
                      type="text"
                      value={outsideVehicleReg}
                      onChange={e => setOutsideVehicleReg(e.target.value.toUpperCase())}
                      placeholder="e.g. KL 16 Q 7965"
                      required={assignmentMode === 'outside'}
                      className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white font-mono font-bold text-slate-900 uppercase focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Outside Vehicle Model / Type
                    </label>
                    <select
                      value={outsideVehicleType}
                      onChange={e => setOutsideVehicleType(e.target.value as VehicleType)}
                      className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-amber-400"
                    >
                      {VEHICLE_TYPES.map(vt => (
                        <option key={vt} value={vt}>{vt}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 6: Financials — Trip Cost (Hidden from Driver) vs Amount to Collect (Shown to Driver) */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h2 className="font-bold uppercase tracking-wider text-slate-500 text-[11px]">
              6. Financials, Client Rates & Driver Collection
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Field 1: Trip Cost / Client Selling Price (Admin Only) */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-900 text-xs">
                    Trip Cost / Client Price (₹) *
                  </label>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                    <EyeOff className="w-2.5 h-2.5" />
                    <span>Admin Only</span>
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={tripSellingPrice}
                  onChange={e => setTripSellingPrice(parseFloat(e.target.value) || '')}
                  required
                  placeholder="2500"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-base text-slate-900 focus:ring-2 focus:ring-navy-primary/20"
                />
                <p className="text-[10px] text-slate-500">
                  Total charged to client. <strong>Strictly hidden</strong> from driver view & dispatch message.
                </p>
              </div>

              {/* Field 2: Collection Rule & Amount Driver Must Collect (Shown to Driver) */}
              <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-emerald-950 text-xs">
                    Amount Driver Must Collect (₹) *
                  </label>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <Eye className="w-2.5 h-2.5" />
                    <span>Shown to Driver</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={collectionRule}
                    onChange={e => setCollectionRule(e.target.value as CollectionRule)}
                    className="w-full px-2 py-2 rounded-xl border border-emerald-300 bg-white font-semibold text-[11px] text-emerald-900"
                  >
                    <option value="Collect">Collect from guest</option>
                    <option value="Do not collect">Do not collect (Office bill)</option>
                    <option value="Ask office">Ask office</option>
                  </select>

                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={amountDriverMustCollect}
                    onChange={e => setAmountDriverMustCollect(parseFloat(e.target.value) || 0)}
                    disabled={collectionRule === 'Do not collect'}
                    placeholder="2500"
                    className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-white font-mono font-bold text-base text-emerald-900 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
                <p className="text-[10px] text-emerald-700">
                  Exact cash/UPI the driver must collect from guest upon arrival.
                </p>
              </div>

              {/* Field 3: Driver Pay / Allowance */}
              <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-blue-950 text-xs">
                    Driver Pay / Allowance (₹)
                  </label>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-blue-100 text-blue-800 border border-blue-300">
                    Driver Pay
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={driverTripPay}
                  onChange={e => setDriverTripPay(parseFloat(e.target.value) || 0)}
                  placeholder="800"
                  className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-white font-mono font-bold text-base text-blue-900 focus:ring-2 focus:ring-blue-400"
                />
                <p className="text-[10px] text-blue-700">
                  Agreed driver wage for this duty trip.
                </p>
              </div>
            </div>
          </div>

          {/* Section 7: Special Instructions & Driver Notes */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <label className="block font-semibold text-slate-700">
              Special Instructions & Driver Notes
            </label>
            <textarea
              rows={2}
              value={specialInstructions}
              onChange={e => setSpecialInstructions(e.target.value)}
              placeholder="e.g. Extra luggage, AC on high, meet guest at Gate 3 exit..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-navy-primary/20 text-xs"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-end gap-3">
            <Link
              to="/admin/trips"
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-navy-primary hover:bg-navy-light text-white font-bold shadow-md transition-all disabled:opacity-50"
            >
              {loading && <LoadingSpinner size="sm" />}
              <span>Create & Dispatch Trip</span>
            </button>
          </div>
        </form>
      </div>

      {/* Post-Creation Success Modal with Copy Message for Driver (NO PRICE) */}
      {createdTripResult && (
        <Modal
          isOpen={Boolean(createdTripResult)}
          onClose={() => navigate('/admin/trips')}
          title={`Trip Scheduled: ${createdTripResult.trip.trip_number}`}
          size="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-sm">Trip Created & Dispatched!</p>
                <p className="text-[11px] text-emerald-700">
                  Assigned to: <strong>{createdTripResult.driverName || 'Driver'}</strong>
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-slate-800">
                  Copy Message for Driver (No Price Mentioned):
                </span>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">
                  WhatsApp Ready
                </span>
              </div>
              <pre className="p-4 bg-slate-900 text-emerald-400 font-mono rounded-xl whitespace-pre-wrap leading-relaxed text-[11px] select-all max-h-72 overflow-y-auto border border-slate-800 shadow-inner">
                {createdTripResult.dispatchMessage}
              </pre>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCopyDispatch}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-800 font-bold hover:bg-slate-50 flex items-center justify-center gap-1.5 shadow-sm transition-colors"
              >
                {copiedDispatch ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedDispatch ? 'Copied to Clipboard!' : 'Copy Message for Driver'}</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <a
                  href={formatWhatsAppShareUrl(
                    createdTripResult.driverPhone,
                    createdTripResult.dispatchMessage
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1.5 shadow-md transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Send on WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={() => navigate('/admin/trips')}
                  className="px-4 py-2.5 rounded-xl bg-navy-primary hover:bg-navy-light text-white font-bold transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AddTripPage;
