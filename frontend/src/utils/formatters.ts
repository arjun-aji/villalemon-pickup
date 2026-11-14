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
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatTime = (timeStr?: string | null): string => {
  if (!timeStr) return '-';
  if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  const h = parseInt(parts[0], 10);
  const m = parts[1];
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
};

export const formatDateTime = (dateStr?: string | null): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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
  totalPeople?: number;
  flightNumberAndTime?: string;
  airportTerminal?: string;
  placardText?: string;
  requiredCabType?: string;
  vehicleReg?: string;
  driverName?: string;
  specialInstructions?: string;
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
  msg += `🆔 *Trip ID:* ${data.tripNumber || 'New Trip'}\n`;
  msg += `🏷️ *Service:* ${data.tripCategory || 'Transport'}\n`;
  msg += `📅 *Date & Time:* ${formatDate(data.tripDate)}, ${formatTime(data.pickupTime)}\n\n`;

  msg += `👤 *Guest Name:* ${data.guestNames || 'Guest'}\n`;
  if (data.guestContact) {
    msg += `📞 *Guest Contact:* ${data.guestContact}\n`;
  }
  msg += `👥 *Passengers:* ${data.totalPeople || 1} Pax\n\n`;

  msg += `📍 *Pickup Point:* ${data.pickupLocation || 'Pickup'}\n`;
  msg += `🏁 *Drop-off Point:* ${data.dropoffLocation || 'Destination'}\n`;
  if (data.finalDropoff) {
    msg += `🔄 *Final Drop-off:* ${data.finalDropoff}\n`;
  }

  if (isAirport) {
    if (data.flightNumberAndTime) {
      msg += `✈️ *Flight/Train:* ${data.flightNumberAndTime}${data.airportTerminal ? ` (${data.airportTerminal})` : ''}\n`;
    }
    if (data.placardText) {
      msg += `🪧 *Airport Placard / Name Board:*\n👉 *${data.placardText.toUpperCase()}*\n`;
    }
  }

  msg += `\n🚗 *Vehicle:* ${data.vehicleReg ? `${data.vehicleReg} (${data.requiredCabType || 'Cab'})` : (data.requiredCabType || 'Sedan')}\n`;
  msg += `👨‍✈️ *Assigned Driver:* ${data.driverName || 'Driver'}\n`;

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

