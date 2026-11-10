import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center px-4">
    <div className="p-4 bg-gray-100 rounded-full mb-4">
      <Icon className="h-8 w-8 text-text-secondary" />
    </div>
    <h3 className="text-base font-semibold text-text-primary mb-1">{title}</h3>
    <p className="text-sm text-text-secondary mb-5 max-w-sm">{description}</p>
    {action && (
      <button onClick={action.onClick} className="btn-primary">
        {action.label}
      </button>
    )}
  </div>
);

export default EmptyState;

