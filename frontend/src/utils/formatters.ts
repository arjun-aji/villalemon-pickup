// Currency and date formatting utilities for VillaLemon Pickup

export const formatINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

export const formatINRCompact = (amount: number): string => {
  if (!amount) return '₹0';
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount}`;
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatTime = (timeStr: string): string => {
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

export const formatDateTime = (dateStr: string): string => {
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
  switch (status) {
    case 'upcoming': return 'badge-blue';
    case 'available_for_enrollment': return 'badge-yellow';
    case 'assigned': return 'badge-blue';
    case 'in_progress': return 'badge-yellow';
    case 'completed': return 'badge-green';
    case 'cancelled': return 'badge-red';
    default: return 'badge-gray';
  }
};

export const getTripStatusLabel = (status: string): string => {
  switch (status) {
    case 'upcoming': return 'Upcoming';
    case 'available_for_enrollment': return 'Open for Enrollment';
    case 'assigned': return 'Assigned';
    case 'in_progress': return 'In Progress';
    case 'completed': return 'Completed';
    case 'cancelled': return 'Cancelled';
    default: return status;
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

