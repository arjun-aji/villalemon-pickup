import React, { useState } from 'react';
import {
  Car,
  Plane,
  Train,
  MapPin,
  Calendar,
  Clock,
  User,
  Phone,
  Luggage,
  Users,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  MessageSquare,
  Sparkles,
  ChevronDown,
  Info,
} from 'lucide-react';
import { tripService } from '../../services/tripService';
import { formatDate, formatTime } from '../../utils/formatters';
import TimePicker24h from '../../components/ui/TimePicker24h';

const TRIP_CATEGORIES = [
  { id: 'Airport Pick-up', label: 'Airport Pick-up', icon: Plane, desc: 'Airport to Varkala / Hotel' },
  { id: 'Airport Drop', label: 'Airport Drop', icon: Plane, desc: 'Hotel / Varkala to Airport' },
  { id: 'Railway Pick-up', label: 'Railway Station', icon: Train, desc: 'Varkala Sivagiri / Kochuveli' },
  { id: 'Drop Only at Location', label: 'Local / Outstation', icon: Car, desc: 'Sightseeing, Kovalam, Kochi' },
];

const VEHICLE_TYPES = [
  { id: 'Sedan', name: 'Sedan', capacity: '1 - 4 Guests', desc: 'Swift Dzire / Etios (AC)' },
  { id: 'Ertiga', name: 'Ertiga / SUV', capacity: '4 - 6 Guests', desc: 'Spacious 6-seater with luggage' },
  { id: 'Innova', name: 'Innova Crysta', capacity: '5 - 7 Guests', desc: 'Premium comfort & large luggage' },
  { id: 'Van', name: 'Tempo Traveller', capacity: '8 - 14 Guests', desc: 'Family & group travel' },
];

const POPULAR_LOCATIONS = [
  'Trivandrum Airport (TRV) Terminal 1 (Domestic)',
  'Trivandrum Airport (TRV) Terminal 2 (International)',
  'Varkala Sivagiri Railway Station',
  'Varkala North Cliff (Helipad / Kurakkanni)',
  'Varkala South Cliff / Papanasam Beach',
  'Villa Lemon INN, Varkala',
  'Kochuveli Railway Station',
];

const ClientBookingPage: React.FC = () => {
  // Form State
  const [tripCategory, setTripCategory] = useState('Airport Pick-up');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [tripDate, setTripDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [pickupTime, setPickupTime] = useState('10:00');
  const [pickupLocation, setPickupLocation] = useState('Trivandrum Airport (TRV) Terminal 2 (International)');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [numPassengers, setNumPassengers] = useState(2);
  const [luggageNotes, setLuggageNotes] = useState('');
  const [vehicleType, setVehicleType] = useState('Sedan');
  const [flightNumber, setFlightNumber] = useState('');
  const [airportTerminal, setAirportTerminal] = useState('Terminal 2');
  const [placardText, setPlacardText] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!guestName.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }
    if (!guestPhone.trim() || guestPhone.replace(/[^0-9]/g, '').length < 8) {
      setErrorMsg('Please provide a valid WhatsApp / contact phone number');
      return;
    }
    if (!pickupLocation.trim()) {
      setErrorMsg('Please specify pickup location');
      return;
    }
    if (!dropoffLocation.trim()) {
      setErrorMsg('Please specify drop-off location or destination hotel');
      return;
    }

    try {
      setIsSubmitting(true);

      const instructionsCombined = [
        `[Direct Client Booking Form]`,
        placardText ? `[Placard: ${placardText.trim()}]` : null,
        luggageNotes ? `[Luggage: ${luggageNotes.trim()}]` : null,
        specialInstructions.trim() ? specialInstructions.trim() : null,
      ].filter(Boolean).join(' | ');

      const newTrip = await tripService.create(
        {
          trip_category: tripCategory as any,
          guest_names: guestName.trim(),
          guest_contact_number: guestPhone.trim(),
          trip_date: tripDate,
          pickup_time: pickupTime,
          pickup_location: pickupLocation.trim(),
          dropoff_location: dropoffLocation.trim(),
          total_people: Number(numPassengers) || 1,
          required_cab_type: vehicleType as any,
          flight_number_and_time: flightNumber.trim() || undefined,
          airport_terminal: tripCategory.includes('Airport') ? (airportTerminal as any) : undefined,
          trip_status: 'Pending Approval' as any,
          special_instructions: instructionsCombined,
          ordered_by: 'Direct Client Booking',
          collection_rule: 'Collect',
        },
        'client-portal'
      );

      setBookingSuccess(newTrip);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to submit booking. Please contact Varkala Holidays directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setBookingSuccess(null);
    setGuestName('');
    setGuestPhone('');
    setDropoffLocation('');
    setFlightNumber('');
    setPlacardText('');
    setSpecialInstructions('');
  };

  const isAirport = tripCategory.includes('Airport');
  const isRailway = tripCategory.includes('Railway');

  return (
    <div className="min-h-screen bg-[#F5F8FC] relative selection:bg-emerald-500 selection:text-white py-8 px-4 sm:px-6">
      {/* Background coastal backdrop */}
      <div
        className="fixed inset-0 bg-cover bg-center opacity-25 pointer-events-none"
        style={{ backgroundImage: `url('/assets/varkala-desktop-bg.jpg')` }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-[#F5F8FC]/70 via-[#F5F8FC]/90 to-[#F5F8FC] pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold tracking-wide shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>VARKALA HOLIDAYS • DIRECT BOOKING</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#10243A] tracking-tight">
            Book Your Cab & Airport Pickup
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
            Hassle-free direct transfers between Trivandrum Airport, Railway Stations, and Varkala Cliffs & Resorts.
          </p>
        </div>

        {bookingSuccess ? (
          /* Confirmation Success View */
          <div className="bg-white rounded-[28px] p-6 sm:p-8 shadow-xl border border-emerald-100 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-black rounded-full border border-emerald-200 uppercase tracking-widest">
                Booking Reference: {bookingSuccess.trip_number || 'PENDING'}
              </span>
              <h2 className="text-2xl font-black text-slate-900">Request Received!</h2>
              <p className="text-sm text-slate-600 max-w-sm mx-auto">
                Thank you, <strong className="text-slate-800">{guestName}</strong>! Our dispatch office has received your pickup details. We are assigning your driver and will confirm via WhatsApp shortly.
              </p>
            </div>

            {/* Summary card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2.5 text-xs text-slate-700">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Service</span>
                <span className="font-bold text-slate-900">{bookingSuccess.trip_category || tripCategory}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Date & Time</span>
                <span className="font-bold text-slate-900">{formatDate(tripDate)} at {formatTime(pickupTime)} hrs</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Pickup Location</span>
                <span className="font-bold text-slate-900 text-right max-w-[220px] truncate">{pickupLocation}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Destination</span>
                <span className="font-bold text-slate-900 text-right max-w-[220px] truncate">{dropoffLocation}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Vehicle / Guests</span>
                <span className="font-bold text-slate-900">{vehicleType} ({numPassengers} Guests)</span>
              </div>
            </div>

            {/* WhatsApp Contact Action */}
            <div className="pt-2 space-y-3">
              <a
                href={`https://wa.me/918086066992?text=${encodeURIComponent(
                  `Hi Varkala Holidays, I just submitted a booking request #${bookingSuccess.trip_number || ''} for ${guestName} on ${tripDate} (${pickupLocation} to ${dropoffLocation}). Please confirm my driver!`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all text-sm"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Message Dispatch Office on WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 underline"
              >
                Submit another booking request
              </button>
            </div>
          </div>
        ) : (
          /* Main Interactive Booking Form */
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-[28px] p-6 sm:p-8 shadow-xl border border-slate-200/80 space-y-6"
          >
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 1. Trip Category Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                1. Select Service Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TRIP_CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  const isSelected = tripCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setTripCategory(cat.id);
                        if (cat.id === 'Airport Pick-up') {
                          setPickupLocation('Trivandrum Airport (TRV) Terminal 2 (International)');
                          setDropoffLocation('');
                        } else if (cat.id === 'Airport Drop') {
                          setPickupLocation('');
                          setDropoffLocation('Trivandrum Airport (TRV) Terminal 2 (International)');
                        } else if (cat.id === 'Railway Pick-up') {
                          setPickupLocation('Varkala Sivagiri Railway Station');
                          setDropoffLocation('');
                        } else if (cat.id === 'Drop Only at Location') {
                          setPickupLocation('');
                          setDropoffLocation('');
                        }
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-1 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <div>
                        <div className="font-bold text-xs">{cat.label}</div>
                        <div className="text-[10px] text-slate-500 line-clamp-1">{cat.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Pickup Date *</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {formatDate(tripDate)} (DD/MM/YYYY)
                  </span>
                </label>
                <input
                  type="date"
                  value={tripDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setTripDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Pickup / Arrival Time * (24 Hrs)</span>
                  </span>
                  <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 font-mono">
                    {formatTime(pickupTime)} hrs
                  </span>
                </label>
                <TimePicker24h
                  value={pickupTime}
                  onChange={setPickupTime}
                  required
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Select hour (00-23) and minute (00-59) in 24-hour railway time
                </span>
              </div>
            </div>

            {/* Flight info if Airport */}
            {isAirport && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Plane className="w-4 h-4 text-emerald-600" />
                  <span>Flight & Terminal Details</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Flight Number (e.g. AI-508 / EK-522)
                    </label>
                    <input
                      type="text"
                      value={flightNumber}
                      onChange={e => setFlightNumber(e.target.value)}
                      placeholder="e.g. 6E-204"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Airport Terminal
                    </label>
                    <select
                      value={airportTerminal}
                      onChange={e => setAirportTerminal(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                    >
                      <option value="Terminal 2">Terminal 2 (International / Chacka)</option>
                      <option value="Terminal 1">Terminal 1 (Domestic / Shanghumugham)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Train info if Railway Station */}
            {isRailway && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Train className="w-4 h-4 text-emerald-600" />
                  <span>Train & Arrival Details</span>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Train Number & Name / Coach (e.g. 16382 Kanyakumari Exp / B2)
                  </label>
                  <input
                    type="text"
                    value={flightNumber}
                    onChange={e => setFlightNumber(e.target.value)}
                    placeholder="e.g. Train 16382 / Vanchinad Express / Coach S4"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  />
                </div>
              </div>
            )}

            {/* 3. Locations */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Pickup Location *</span>
                  </span>
                </label>
                <input
                  type="text"
                  value={pickupLocation}
                  onChange={e => setPickupLocation(e.target.value)}
                  placeholder="e.g. TRV Airport Terminal 2 / Varkala Sivagiri"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span>Drop-off Location / Destination Hotel *</span>
                  </span>
                </label>
                <input
                  type="text"
                  value={dropoffLocation}
                  onChange={e => setDropoffLocation(e.target.value)}
                  placeholder="e.g. Villa Lemon INN, Varkala North Cliff, Hotel name"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              {/* Quick suggestions pills */}
              <div className="pt-1">
                <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                  Quick Select Destinations:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_LOCATIONS.map(loc => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => {
                        if (tripCategory === 'Airport Pick-up') {
                          setDropoffLocation(loc);
                        } else {
                          setPickupLocation(loc);
                        }
                      }}
                      className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 rounded-lg transition-colors border border-slate-200"
                    >
                      + {loc}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. Vehicle & Passengers */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                2. Select Vehicle Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {VEHICLE_TYPES.map(v => {
                  const isSelected = vehicleType === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVehicleType(v.id)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <Car className={`w-4 h-4 mb-1 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <div className="font-bold text-xs">{v.name}</div>
                      <div className="text-[10px] text-slate-500">{v.capacity}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Passenger Count & Luggage notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Number of Guests *</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={numPassengers}
                  onChange={e => setNumPassengers(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Luggage className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Luggage Details (Optional)</span>
                </label>
                <input
                  type="text"
                  value={luggageNotes}
                  onChange={e => setLuggageNotes(e.target.value)}
                  placeholder="e.g. 2 Big Bags, 1 Surfboard"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* 5. Guest Contact Information */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                3. Passenger & Contact Info
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Your Full Name *</span>
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={e => {
                      setGuestName(e.target.value);
                      if (!placardText) setPlacardText(e.target.value);
                    }}
                    placeholder="e.g. John Doe"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp / Mobile Number *</span>
                  </label>
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={e => setGuestPhone(e.target.value)}
                    placeholder="+91 9876543210 / WhatsApp"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {isAirport && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Placard Board Text (Name displayed at airport exit gate)
                  </label>
                  <input
                    type="text"
                    value={placardText}
                    onChange={e => setPlacardText(e.target.value)}
                    placeholder="e.g. MR. JOHN DOE"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Special Notes / Flight Delay Instructions
                </label>
                <textarea
                  rows={2}
                  value={specialInstructions}
                  onChange={e => setSpecialInstructions(e.target.value)}
                  placeholder="Need baby seat, cash payment on arrival, flight delay updates, etc."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 bg-[#00875A] hover:bg-[#00704A] disabled:opacity-50 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-700/25 flex items-center justify-center gap-2 text-base transition-all"
            >
              {isSubmitting ? (
                <span>Submitting Your Booking...</span>
              ) : (
                <>
                  <span>Request Pickup / Book Ride</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 text-center pt-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified Drivers
              </span>
              <span>•</span>
              <span>24/7 Flight Delay Tracking</span>
              <span>•</span>
              <span>AC Vehicles</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ClientBookingPage;
