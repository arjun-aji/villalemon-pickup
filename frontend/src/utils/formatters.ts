// Currency and date formatting utilities for VillaLemon Pickup

export const formatINR = (amount?: number | null): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

export const formatINRCompact = (amount?: number | null): string => {
  if (!amount) return '₹0';
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount}`;
};

export const formatDate = (dateStr?: string | null): string => {
  if (!dateStr) return '-';
  const trimmed = dateStr.trim();
  if (!trimmed) return '-';

  // Already in DD-MM-YYYY format
  if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
    return trimmed;
  }

  // Pure ISO date format: YYYY-MM-DD
  const ymdMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    return `${d}-${m}-${y}`;
  }

  // Full timestamp or ISO string (e.g. 2026-11-22T08:30:00Z)
  const date = new Date(trimmed);
  if (isNaN(date.getTime())) return dateStr;
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
};

export const formatTime = (timeStr?: string | null): string => {
  if (!timeStr) return '-';
  const trimmed = timeStr.trim();
  if (!trimmed) return '-';

  // Convert 12-hour AM/PM string (e.g. "02:30 PM", "9:15 AM") into 24-hour "HH:mm"
  const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{1,2})(?::\d{1,2})?\s*(AM|PM)$/i);
  if (ampmMatch) {
    let h = parseInt(ampmMatch[1], 10);
    const m = ampmMatch[2].padStart(2, '0');
    const period = ampmMatch[3].toUpperCase();
    if (period === 'PM' && h < 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${m}`;
  }

  // Already 24-hour string (e.g. "14:30", "14:30:00", "9:15")
  const parts = trimmed.split(':');
  if (parts.length >= 2) {
    const h = parseInt(parts[0], 10);
    const m = parts[1].slice(0, 2).padStart(2, '0');
    if (!isNaN(h)) {
      return `${String(h).padStart(2, '0')}:${m}`;
    }
  }

  return timeStr;
};

export const formatDateTime = (dateStr?: string | null): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${d}-${m}-${y} ${hh}:${mm}`;
};

export const getMonthName = (month: number): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || '';
};

export const calculateFinancials = (
  customerCollection: number,
  petrolExpense: number,
  driverCharge: number,
  otherExpenses: number,
  actualReturned: number = 0
) => {
  const totalExpenses = (Number(petrolExpense) || 0) + (Number(driverCharge) || 0) + (Number(otherExpenses) || 0);
  const netProfit = (Number(customerCollection) || 0) - totalExpenses;
  const expectedReturn = netProfit; // Expected cash driver should return
  const settlementDifference = expectedReturn - (Number(actualReturned) || 0);

  return {
    totalExpenses,
    netProfit,
    expectedReturn,
    settlementDifference,
  };
};

export const getTripStatusColor = (status: string): string => {
  const s = (status || '').toLowerCase().replace(/[\s-]+/g, '_');
  switch (s) {
    case 'upcoming':
    case 'confirmed':
      return 'badge-blue';
    case 'available_for_enrollment':
    case 'open_for_enrollment':
      return 'badge-yellow';
    case 'assigned':
      return 'badge-blue';
    case 'in_progress':
      return 'badge-yellow';
    case 'completed':
      return 'badge-green';
    case 'cancelled':
      return 'badge-red';
    case 'pending_approval':
      return 'badge-yellow';
    default:
      return 'badge-gray';
  }
};

export const getTripStatusLabel = (status: string): string => {
  const s = (status || '').toLowerCase().replace(/[\s-]+/g, '_');
  switch (s) {
    case 'upcoming': return 'Upcoming';
    case 'confirmed': return 'Confirmed';
    case 'available_for_enrollment': return 'Open for Enrollment';
    case 'assigned': return 'Assigned';
    case 'in_progress': return 'In Progress';
    case 'completed': return 'Completed';
    case 'cancelled': return 'Cancelled';
    case 'pending_approval': return 'Pending Approval';
    default: return status || 'Confirmed';
  }
};

export const getSettlementStatusColor = (status: string): string => {
  switch (status) {
    case 'settled': return 'badge-green';
    case 'difference': return 'badge-red';
    case 'excess': return 'badge-yellow';
    case 'pending_verification': return 'badge-blue';
    case 'driver_submitted': return 'badge-yellow';
    case 'expense_pending': return 'badge-gray';
    default: return 'badge-gray';
  }
};

export const getSettlementStatusLabel = (status: string): string => {
  switch (status) {
    case 'expense_pending': return 'Expense Pending';
    case 'driver_submitted': return 'Driver Submitted';
    case 'pending_verification': return 'Pending Verification';
    case 'settled': return 'Settled';
    case 'difference': return 'Difference';
    case 'excess': return 'Excess';
    default: return status;
  }
};

export const generatePlacardText = (customerName: string): string => {
  return `VILLALEMON PICKUP - ${customerName.trim().toUpperCase()}`;
};

export interface DriverDispatchMessageData {
  tripNumber?: string;
  tripCategory?: string;
  tripDate?: string;
  pickupTime?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  finalDropoff?: string;
  guestNames?: string;
  guestContact?: string;
  guestList?: Array<{ name: string; phone?: string }>;
  totalPeople?: number;
  flightNumberAndTime?: string;
  flightList?: Array<{ flightNoAndTime: string; terminal?: string }>;
  airportTerminal?: string;
  placardText?: string;
  requiredCabType?: string;
  vehicleReg?: string;
  driverName?: string;
  specialInstructions?: string;
  amountToCollect?: number;
  convoyBadge?: string;
}

/**
 * Generates a clean, professional dispatch message for drivers via WhatsApp / SMS.
 * Strictly DOES NOT mention price or client cost, per business rules.
 * Placard is only included if it is an Airport pickup / airport service.
 */
export const generateDriverDispatchMessage = (data: DriverDispatchMessageData): string => {
  const isAirport = (data.tripCategory || '').toLowerCase().includes('airport');
  const cleanNotes = (data.specialInstructions || '')
    .replace(/\[Outside Driver:[^\]]+\]/gi, '')
    .trim();

  let msg = `🚖 *VARKALA HOLIDAYS — TRIP DISPATCH*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `🆔 *Trip ID:* ${data.tripNumber || 'New Trip'}${data.convoyBadge ? ` (${data.convoyBadge})` : ''}\n`;
  msg += `🏷️ *Service:* ${data.tripCategory || 'Transport'}\n`;
  msg += `📅 *Date & Time:* ${formatDate(data.tripDate)}, ${formatTime(data.pickupTime)}\n\n`;

  if (data.guestList && data.guestList.length > 1) {
    msg += `👥 *Guests & Contacts (${data.totalPeople || data.guestList.length} Pax):*\n`;
    data.guestList.forEach((g, idx) => {
      msg += `  ${idx + 1}. *${g.name || 'Guest'}*${g.phone ? ` — 📞 ${g.phone}` : ''}\n`;
    });
    msg += `\n`;
  } else {
    msg += `👤 *Guest Name:* ${data.guestNames || 'Guest'}\n`;
    if (data.guestContact) {
      msg += `📞 *Guest Contact:* ${data.guestContact}\n`;
    }
    msg += `👥 *Passengers:* ${data.totalPeople || 1} Pax\n\n`;
  }

  msg += `📍 *Pickup Point:* ${data.pickupLocation || 'Pickup'}\n`;
  msg += `🏁 *Drop-off Point:* ${data.dropoffLocation || 'Destination'}\n`;
  if (data.finalDropoff) {
    msg += `🔄 *Final Drop-off:* ${data.finalDropoff}\n`;
  }

  if (isAirport) {
    if (data.flightList && data.flightList.length > 1) {
      msg += `\n✈️ *Flight / Arrival Details:*\n`;
      data.flightList.forEach((f, idx) => {
        msg += `  ${idx + 1}. ${f.flightNoAndTime}${f.terminal ? ` (${f.terminal})` : ''}\n`;
      });
    } else if (data.flightNumberAndTime) {
      msg += `✈️ *Flight/Train:* ${data.flightNumberAndTime}${data.airportTerminal ? ` (${data.airportTerminal})` : ''}\n`;
    }
    if (data.placardText) {
      msg += `\n🪧 *Airport Placard / Name Board:*\n👉 *${data.placardText.toUpperCase()}*\n`;
    }
    msg += `\n⚠️ *DRIVER NOTE: Verify the terminal with customer!*\n`;
  }

  const cabLabel = data.vehicleReg ? `${data.vehicleReg} (${data.requiredCabType || 'Cab'})` : (data.requiredCabType || 'Sedan');
  msg += `\n🚗 *Vehicle:* ${cabLabel}${data.convoyBadge ? ` [${data.convoyBadge}]` : ''}\n`;
  msg += `👨‍✈️ *Assigned Driver:* ${data.driverName || 'Driver'}\n`;

  // Explicit collection instruction for the driver
  if (data.amountToCollect !== undefined) {
    if (data.amountToCollect > 0) {
      msg += `💵 *CASH TO COLLECT FROM GUEST:* Rs. ${data.amountToCollect.toLocaleString('en-IN')}\n`;
    } else {
      msg += `💵 *COLLECTION:* Do NOT collect money from guest (Office Billed / Prepaid)\n`;
    }
  }

  if (cleanNotes) {
    msg += `\n📝 *Driver Notes:*\n${cleanNotes}\n`;
  }

  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `_Please confirm receipt and report duty start._`;

  return msg;
};

export const formatWhatsAppShareUrl = (phone?: string, text?: string): string => {
  const cleanDigits = (phone || '').replace(/[^0-9]/g, '');
  const targetPhone = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;
  return targetPhone
    ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(text || '')}`
    : `https://wa.me/?text=${encodeURIComponent(text || '')}`;
};

