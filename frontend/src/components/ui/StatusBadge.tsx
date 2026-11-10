import React from 'react';
import {
  getTripStatusColor,
  getTripStatusLabel,
  getSettlementStatusColor,
  getSettlementStatusLabel,
} from '../../utils/formatters';

interface StatusBadgeProps {
  status: string;
  type?: 'trip' | 'settlement' | 'enrollment' | 'driver';
  withDot?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'trip', withDot = true }) => {
  let colorClass = '';
  let label = status;

  if (type === 'trip') {
    colorClass = getTripStatusColor(status);
    label = getTripStatusLabel(status);
  } else if (type === 'settlement') {
    colorClass = getSettlementStatusColor(status);
    label = getSettlementStatusLabel(status);
  } else if (type === 'enrollment') {
    switch (status) {
      case 'pending':
        colorClass = 'badge-yellow';
        label = 'Pending Approval';
        break;
      case 'approved':
        colorClass = 'badge-green';
        label = 'Approved';
        break;
      case 'rejected':
        colorClass = 'badge-red';
        label = 'Rejected';
        break;
      case 'cancelled':
        colorClass = 'badge-gray';
        label = 'Cancelled';
        break;
      default:
        colorClass = 'badge-gray';
        label = status;
    }
  } else if (type === 'driver') {
    switch (status) {
      case 'active':
        colorClass = 'badge-green';
        label = 'Active';
        break;
      case 'inactive':
        colorClass = 'badge-gray';
        label = 'Inactive';
        break;
      case 'suspended':
        colorClass = 'badge-red';
        label = 'Suspended';
        break;
      default:
        colorClass = 'badge-gray';
        label = status;
    }
  }

  const isLive = ['in_progress', 'pending', 'available_for_enrollment', 'active'].includes(status);

  return (
    <span className={colorClass}>
      {withDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full bg-current ${
            isLive ? 'animate-pulse' : 'opacity-70'
          }`}
        />
      )}
      <span>{label}</span>
    </span>
  );
};

export default StatusBadge;
