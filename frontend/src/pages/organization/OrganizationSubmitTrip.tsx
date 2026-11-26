import React, { useState, useEffect } from 'react';
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
  Plus,
  Trash2,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { TripCategory, VehicleType, AirportTerminal } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { formatDate, formatTime } from '../../utils/formatters';
import TimePicker24h from '../../components/ui/TimePicker24h';

export interface CategoryOption {
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

const SIGHTSEEING_SUGGESTIONS = [
  'Jatayu Earth Center',
  'Golden Island',
  'Munroe Island',
  'Varkala Cliff',
  'Kappil Beach',
  'Kanyakumari',
  'Neyyar Dam',
  'Kovalam',
  'Padmanabhaswamy Temple',
];

export interface OrgGuestItem {
  id: string;
  name: string;
  phone: string;
  flightNoAndTime?: string;
  terminal?: AirportTerminal | '';
}

const OrganizationSubmitTrip: React.FC = () => {
  const { profile, organization } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [tripCategory, setTripCategory] = useState<TripCategory>('Airport Pick-up');
  const [orderedBy, setOrderedBy] = useState(organization?.contact_person || profile?.full_name || '');
  const [tripDate, setTripDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [pickupTime, setPickupTime] = useState('');

  // Single vs Multiple Guest State
  const [isMultiGuest, setIsMultiGuest] = useState(false);
  const [guestNames, setGuestNames] = useState('');
  const [guestContact, setGuestContact] = useState('');
  const [totalPeople, setTotalPeople] = useState<number | ''>(1);
  const [flightNumberAndTime, setFlightNumberAndTime] = useState('');
  const [airportTerminal, setAirportTerminal] = useState<AirportTerminal | ''>('');

  const [guestList, setGuestList] = useState<OrgGuestItem[]>([
    { id: 'g-1', name: '', phone: '', flightNoAndTime: '', terminal: '' },
  ]);

  // Route Details - no hardcoded defaults
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [finalDropoff, setFinalDropoff] = useState('');
  const [requiredCabType, setRequiredCabType] = useState<VehicleType>('Sedan');

  // Placard text (for Airport Pick-up)
  const [placardText, setPlacardText] = useState('');
  const [isPlacardCustomized, setIsPlacardCustomized] = useState(false);
  const [copiedPlacard, setCopiedPlacard] = useState(false);

  // Pricing & Instructions
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [agreedTripCost, setAgreedTripCost] = useState<number | ''>('');
  const [advancePaid, setAdvancePaid] = useState<number | ''>('');

  const isAirport = tripCategory === 'Airport Pick-up' || tripCategory === 'Airport Drop';
  const isAirportPickup = tripCategory === 'Airport Pick-up';
  const isRoundTrip = tripCategory === 'Sightseeing';

  // Keep placard text updated when not manually customized
  useEffect(() => {
    if (isAirportPickup && !isPlacardCustomized) {
      const orgName = organization?.name?.toUpperCase() || '';
      const guestName = guestNames.trim().toUpperCase();
      if (guestName && orgName) {
        setPlacardText(`${orgName} - ${guestName}`);
      } else if (guestName) {
        setPlacardText(`WELCOME ${guestName}`);
      } else if (orgName) {
        setPlacardText(`${orgName} - GUEST`);
      } else {
        setPlacardText('');
      }
    }
  }, [guestNames, organization?.name, isAirportPickup, isPlacardCustomized]);

  const handleCategoryChange = (newCat: TripCategory) => {
    setTripCategory(newCat);
  };

  const handleAddGuest = () => {
    setGuestList(prev => [
      ...prev,
      { id: `g-${Date.now()}`, name: '', phone: '', flightNoAndTime: '', terminal: airportTerminal || '' },
    ]);
  };

  const handleRemoveGuest = (id: string) => {
    if (guestList.length <= 1) return;
    const next = guestList.filter(g => g.id !== id);
    setGuestList(next);

    const validNames = next.map(g => g.name.trim()).filter(Boolean);
    const validContacts = next.map(g => `${g.name.trim() ? `${g.name.trim()}: ` : ''}${g.phone.trim()}`).filter(g => g.replace(/:\s*$/, '').trim());
    setGuestNames(validNames.join(', '));
    setGuestContact(validContacts.join(' | '));
    setTotalPeople(Math.max(1, next.length));

    // Update flight summary from remaining guests
    const validFlights = next
      .filter(g => (g.flightNoAndTime || '').trim())
      .map(g => `${g.name.trim() ? `${g.name.trim()}: ` : ''}${g.flightNoAndTime?.trim()}${g.terminal ? ` (${g.terminal})` : ''}`);
    if (validFlights.length > 0) {
      setFlightNumberAndTime(validFlights.join(' / '));
    }
  };

  const handleGuestChange = (id: string, field: 'name' | 'phone' | 'flightNoAndTime' | 'terminal', val: string) => {
    setGuestList(prev => {
      const next = prev.map(g => (g.id === id ? { ...g, [field]: val } : g));
      const validNames = next.map(g => g.name.trim()).filter(Boolean);
      const validContacts = next.map(g => `${g.name.trim() ? `${g.name.trim()}: ` : ''}${g.phone.trim()}`).filter(g => g.replace(/:\s*$/, '').trim());
      setGuestNames(validNames.join(', '));
      setGuestContact(validContacts.join(' | '));
      setTotalPeople(Math.max(1, next.length));

      // Derive flight summary
      const validFlights = next
        .filter(g => (g.flightNoAndTime || '').trim())
        .map(g => `${g.name.trim() ? `${g.name.trim()}: ` : ''}${g.flightNoAndTime?.trim()}${g.terminal ? ` (${g.terminal})` : ''}`);
      if (validFlights.length > 0) {
        setFlightNumberAndTime(validFlights.join(' / '));
      }
      return next;
    });
  };

  const handleCopyPlacard = () => {
    navigator.clipboard.writeText(placardText);
    setCopiedPlacard(true);
    setTimeout(() => setCopiedPlacard(false), 2000);
  };

  // Sightseeing attraction quick add/remove
  const toggleSightseeingLocation = (spot: string) => {
    const current = dropoffLocation.trim();
    if (!current) {
      setDropoffLocation(spot);
      return;
    }
    const parts = current.split(',').map(s => s.trim()).filter(Boolean);
    const existingIndex = parts.findIndex(p => p.toLowerCase() === spot.toLowerCase());
    if (existingIndex >= 0) {
      parts.splice(existingIndex, 1);
      setDropoffLocation(parts.join(', '));
    } else {
      parts.push(spot);
      setDropoffLocation(parts.join(', '));
    }
  };

  const isSightseeingSpotSelected = (spot: string) => {
    const current = dropoffLocation.trim();
    if (!current) return false;
    const parts = current.split(',').map(s => s.trim().toLowerCase());
    return parts.includes(spot.toLowerCase());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const finalGuestNames = isMultiGuest
      ? guestList.map(g => g.name.trim()).filter(Boolean).join(', ')
      : guestNames.trim();

    if (!finalGuestNames) {
      setError('Please provide the guest name(s)');
      return;
    }
    if (!pickupLocation.trim()) {
      setError('Please specify the pickup location');
      return;
    }
    if (!dropoffLocation.trim()) {
      setError(isRoundTrip ? 'Please specify sightseeing locations' : 'Please specify the drop-off location');
      return;
    }

    try {
      setLoading(true);

      const finalContacts = isMultiGuest
        ? guestList
            .map(g => `${g.name.trim() ? `${g.name.trim()}: ` : ''}${g.phone.trim()}`)
            .filter(g => g.replace(/:\s*$/, '').trim())
            .join(' | ')
        : guestContact.trim();

      const finalFlightSummary = isMultiGuest
        ? guestList
            .filter(g => (g.flightNoAndTime || '').trim())
            .map(g => `${g.name.trim() ? `${g.name.trim()}: ` : ''}${g.flightNoAndTime?.trim()}${g.terminal ? ` (${g.terminal})` : ''}`)
            .join(' / ')
        : flightNumberAndTime.trim();

      const primaryTerminal = isMultiGuest
        ? (guestList.find(g => g.terminal)?.terminal || null)
        : (airportTerminal || null);

      if (isSupabaseConfigured && organization?.id) {
        const { data, error: insertError } = await supabase
          .from('trips')
          .insert({
            organization_id: organization.id,
            ordered_by: orderedBy.trim() || 'Front Desk',
            trip_date: tripDate,
            pickup_time: pickupTime.trim() || '10:00',
            trip_category: tripCategory,
            guest_names: finalGuestNames,
            guest_contact_number: finalContacts || null,
            total_people: Number(totalPeople) || Math.max(1, guestList.length),
            pickup_location: pickupLocation.trim(),
            dropoff_location: dropoffLocation.trim(),
            final_dropoff: isRoundTrip && finalDropoff.trim() ? finalDropoff.trim() : null,
            flight_number_and_time: finalFlightSummary || null,
            airport_terminal: isAirport ? primaryTerminal : null,
            placard_text: isAirportPickup && placardText.trim() ? placardText.trim() : null,
            required_cab_type: requiredCabType,
            special_instructions: specialInstructions.trim() || null,
            trip_selling_price: Number(agreedTripCost) || 0,
            amount_to_collect: 0,
            amount_driver_must_collect: 0,
            collection_rule: 'Do not collect',
            trip_status: 'Pending Approval',
            submitted_by_org: true,
            created_by: profile?.id,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // If advance money was paid to office, log it as pending confirmation
        if (Number(advancePaid) > 0) {
          await supabase.from('payments').insert({
            organization_id: organization.id,
            amount: Number(advancePaid),
            amount_received: Number(advancePaid),
            payment_date: tripDate,
            payment_method: 'Cash',
            receipt_number: `ADV-${Date.now().toString().slice(-6)}`,
            reference_notes: `[Pending Admin Confirmation] Advance for trip (${data?.trip_number || 'New'}) - Guest: ${finalGuestNames} (Agreed Cost: ₹${agreedTripCost || 0})`,
          });
        }
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
    <div className="max-w-4xl mx-auto space-y-6">
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
          <h1 className="text-xl font-bold text-slate-900">Request New Guest Transport Duty</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit duty details for review. Varkala Holidays dispatch team will verify, assign driver and vehicle, and confirm duty schedule.
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
              <p className="font-bold text-sm">Transport Duty Request Submitted Successfully!</p>
              <p className="text-emerald-700 mt-0.5">
                Our operations team has received this request. You will receive live updates when a driver and vehicle are dispatched.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* Section 1: Service Category & Timing */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold uppercase tracking-wider text-slate-500 text-[11px] flex items-center gap-1.5">
                <span>1. Service Category & Date</span>
              </h2>
            </div>

            {/* Visual Category Selection Cards (Prominent Airport Pick-up, Drop, Sightseeing, Others) */}
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
                        ? 'border-blue-600 bg-blue-50/60 text-blue-900 ring-2 ring-blue-500/20 shadow-xs'
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ordered By / Front Desk</label>
                <input
                  type="text"
                  value={orderedBy}
                  onChange={e => setOrderedBy(e.target.value)}
                  placeholder="Manager / Front desk agent name"
                  className="w-full h-[42px] px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Trip Date *</span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {formatDate(tripDate)} (DD/MM/YYYY)
                  </span>
                </label>
                <input
                  type="date"
                  value={tripDate}
                  onChange={e => setTripDate(e.target.value)}
                  className="w-full h-[42px] px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Pickup Time * (24 Hrs)</span>
                  <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 font-mono">
                    {pickupTime ? `${formatTime(pickupTime)} hrs` : '--:--'}
                  </span>
                </label>
                <TimePicker24h
                  value={pickupTime}
                  onChange={setPickupTime}
                  required
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">24-hour time (e.g. 14:30 for 2:30 PM, 02:15 for night pickup)</span>
              </div>
            </div>
          </div>

          {/* Section 2: Guest Details & Flight Info */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold uppercase tracking-wider text-slate-500 text-[11px] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>2. Guest & Passenger Information</span>
              </h2>
              <button
                type="button"
                onClick={() => {
                  const next = !isMultiGuest;
                  setIsMultiGuest(next);
                  if (next && guestList.length === 1 && !guestList[0].name) {
                    setGuestList([{
                      id: 'g-1',
                      name: guestNames,
                      phone: guestContact,
                      flightNoAndTime: flightNumberAndTime,
                      terminal: airportTerminal || '',
                    }]);
                  }
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 transition-colors"
              >
                {isMultiGuest ? '← Switch to Single Guest Form' : '+ Add Multiple Passenger Contacts'}
              </button>
            </div>

            {!isMultiGuest ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Guest Name(s) *</label>
                    <input
                      type="text"
                      value={guestNames}
                      onChange={e => setGuestNames(e.target.value)}
                      required
                      placeholder="e.g. Alexander Ivanov, Elena"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Guest WhatsApp / Phone</label>
                    <input
                      type="tel"
                      value={guestContact}
                      onChange={e => setGuestContact(e.target.value)}
                      placeholder="+91 or international phone"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Number of Passengers *</label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={totalPeople}
                      onChange={e => setTotalPeople(parseInt(e.target.value, 10) || '')}
                      placeholder="e.g. 2"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Flight Number & Terminal integrated directly with passenger details */}
                {isAirport ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-sky-50/60 rounded-xl border border-sky-200">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                        <Plane className="w-3.5 h-3.5 text-sky-600" />
                        <span>Flight Number & {isAirportPickup ? 'Arrival' : 'Departure'} Details</span>
                      </label>
                      <input
                        type="text"
                        value={flightNumberAndTime}
                        onChange={e => setFlightNumberAndTime(e.target.value)}
                        placeholder="e.g. AI-506 at 09:45"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Airport Terminal</label>
                      <select
                        value={airportTerminal}
                        onChange={e => setAirportTerminal(e.target.value as AirportTerminal)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="">-- Select Terminal --</option>
                        <option value="Terminal 1">Terminal 1 (Domestic / Shankhumukham)</option>
                        <option value="Terminal 2">Terminal 2 (International / Chakai)</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Train / Reference Info (Optional)</label>
                    <input
                      type="text"
                      value={flightNumberAndTime}
                      onChange={e => setFlightNumberAndTime(e.target.value)}
                      placeholder="e.g. Train 16346 / Coach B2"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 p-3.5 bg-blue-50/50 rounded-2xl border border-blue-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">
                    Passenger Roster & Individual Flight Details
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Each passenger can have their own flight & terminal
                  </span>
                </div>

                <div className="space-y-2.5">
                  {guestList.map((g, idx) => (
                    <div key={g.id} className="p-3 bg-white rounded-xl border border-blue-100 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-black flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span>Passenger #{idx + 1}</span>
                        </span>
                        {guestList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveGuest(g.id)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded-md transition-colors flex items-center gap-1 text-xs"
                            title="Remove Passenger"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Name *</label>
                          <input
                            type="text"
                            value={g.name}
                            onChange={e => handleGuestChange(g.id, 'name', e.target.value)}
                            placeholder={`Passenger ${idx + 1} Name`}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">WhatsApp / Phone</label>
                          <input
                            type="tel"
                            value={g.phone}
                            onChange={e => handleGuestChange(g.id, 'phone', e.target.value)}
                            placeholder="Phone number"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>

                        {isAirport ? (
                          <>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Flight No & Time</label>
                              <input
                                type="text"
                                value={g.flightNoAndTime || ''}
                                onChange={e => handleGuestChange(g.id, 'flightNoAndTime', e.target.value)}
                                placeholder="e.g. EK 522 at 03:00"
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Terminal</label>
                              <select
                                value={g.terminal || ''}
                                onChange={e => handleGuestChange(g.id, 'terminal', e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                              >
                                <option value="">-- Select --</option>
                                <option value="Terminal 1">Terminal 1 (Dom)</option>
                                <option value="Terminal 2">Terminal 2 (Intl)</option>
                              </select>
                            </div>
                          </>
                        ) : (
                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Train / Ref</label>
                            <input
                              type="text"
                              value={g.flightNoAndTime || ''}
                              onChange={e => handleGuestChange(g.id, 'flightNoAndTime', e.target.value)}
                              placeholder="Train / Coach info"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleAddGuest}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-blue-300 text-blue-700 font-bold hover:bg-blue-50 transition-colors shadow-2xs text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Another Passenger</span>
                  </button>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-slate-700">Total Pax Count:</span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-900 font-black rounded-md">
                      {guestList.length}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Airport Arrival Placard / Name Board (for Airport Pick-up) */}
          {isAirportPickup && (
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold uppercase tracking-wider text-slate-500 text-[11px] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>3. Airport Arrival Placard / Name Board</span>
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Driver will hold this name board at the arrival gate. Enter or edit the exact placard name.
                  </p>
                </div>
                {placardText && (
                  <button
                    type="button"
                    onClick={handleCopyPlacard}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-[11px] font-semibold transition-colors shadow-2xs"
                  >
                    {copiedPlacard ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedPlacard ? 'Copied' : 'Copy Placard'}</span>
                  </button>
                )}
              </div>

              <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200/80 space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={placardText}
                      onChange={e => {
                        setPlacardText(e.target.value);
                        setIsPlacardCustomized(true);
                      }}
                      placeholder="e.g. CLIFF STORIES - MR. ALEXANDER"
                      className="w-full px-3 py-2 rounded-xl border border-amber-300 font-mono font-bold text-slate-900 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none uppercase"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const orgName = organization?.name?.toUpperCase() || '';
                      const guestName = guestNames.trim().toUpperCase();
                      if (guestName && orgName) {
                        setPlacardText(`${orgName} - ${guestName}`);
                      } else if (guestName) {
                        setPlacardText(`WELCOME ${guestName}`);
                      } else if (orgName) {
                        setPlacardText(`${orgName} - GUEST`);
                      }
                      setIsPlacardCustomized(false);
                    }}
                    className="px-3 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold text-xs transition-colors shrink-0"
                    title="Auto-fill name board from guest name and organization"
                  >
                    Auto-Fill
                  </button>
                </div>

                {/* Live Name Board Preview */}
                <div className="p-3 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-xl text-center shadow-inner">
                  <span className="text-[10px] uppercase tracking-widest text-amber-400 font-bold block mb-0.5">
                    ✈ Airport Arrival Name Board Preview
                  </span>
                  <p className="font-mono font-black text-sm sm:text-base tracking-wider text-amber-200">
                    {placardText || 'NAME BOARD WILL BE DISPLAYED HERE'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Route & Vehicle Details */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h2 className="font-bold uppercase tracking-wider text-slate-500 text-[11px] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>4. Route & Vehicle Details</span>
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
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isRoundTrip ? 'Sightseeing Locations *' : 'Drop-off Location *'}
                </label>
                <input
                  type="text"
                  value={dropoffLocation}
                  onChange={e => setDropoffLocation(e.target.value)}
                  required
                  placeholder={
                    isRoundTrip
                      ? 'e.g. Varkala Cliff, Golden Island, Jatayu Earth Center'
                      : 'e.g. VillaLemon Homestay or Trivandrum Airport'
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />

                {isRoundTrip && (
                  <div className="mt-2 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Quick Add / Remove Attractions:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {SIGHTSEEING_SUGGESTIONS.map(spot => {
                        const selected = isSightseeingSpotSelected(spot);
                        return (
                          <button
                            key={spot}
                            type="button"
                            onClick={() => toggleSightseeingLocation(spot)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                              selected
                                ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                            }`}
                          >
                            <span>{selected ? '✓' : '+'}</span>
                            <span>{spot}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Final Drop-off / Return placed before Cab Type for Sightseeing */}
              {isRoundTrip && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Final Drop-off / Return</label>
                  <input
                    type="text"
                    value={finalDropoff}
                    onChange={e => setFinalDropoff(e.target.value)}
                    placeholder="e.g. Return to Hotel at evening"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Primary Cab Type *</label>
                <select
                  value={requiredCabType}
                  onChange={e => setRequiredCabType(e.target.value as VehicleType)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {VEHICLE_TYPES.map(vt => (
                    <option key={vt} value={vt}>{vt}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 5: Special Instructions */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h2 className="font-bold uppercase tracking-wider text-slate-500 text-[11px] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>5. Special Instructions (Optional)</span>
            </h2>
            <div>
              <textarea
                rows={2}
                value={specialInstructions}
                onChange={e => setSpecialInstructions(e.target.value)}
                placeholder="e.g. AC on full, extra luggage space needed, guest speaks Russian/French, child seat required"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Section 6: Agreed Trip Cost & Advance Money (Given to Office) */}
          <div className="pt-4 border-t border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              6. Agreed Trip Cost & Advance Payment (To Office)
            </h2>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Trip Cost You Give to Office (₹) (Optional / As Quoted)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={agreedTripCost}
                    onChange={e => setAgreedTripCost(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 2500"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    The agreed transport fare you will pay to Varkala Holidays office for this duty.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Advance Money Already Sent / Paid (₹) (Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={advancePaid}
                    onChange={e => setAdvancePaid(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 500 (or leave empty)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Any advance already transferred to office. Credited upon office admin confirmation.
                  </span>
                </div>
              </div>

              {Number(agreedTripCost) > 0 && (
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-medium">Pending Balance on this trip:</span>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{Math.max(0, Number(agreedTripCost) - (Number(advancePaid) || 0)).toLocaleString('en-IN')}
                  </span>
                </div>
              )}
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
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
            >
              {loading && <LoadingSpinner size="sm" />}
              <span>{loading ? 'Submitting Request...' : 'Submit Transport Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrganizationSubmitTrip;
