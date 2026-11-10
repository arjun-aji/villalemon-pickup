import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: { value: number; label?: string };
  valueColor?: string;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-green-primary',
  iconBg = 'bg-green-light',
  trend,
  valueColor = 'text-text-primary',
}) => (
  <div className="card relative overflow-hidden group hover:border-green-primary/40 hover:shadow-lg transition-all duration-300">
    {/* Subtle top accent gradient */}
    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

    <div className="flex items-start justify-between mb-2">
      <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">{title}</p>
      <div className={`p-2.5 rounded-xl ${iconBg} shadow-sm group-hover:scale-105 transition-transform`}>
        <Icon className={`h-4.5 w-4.5 ${iconColor}`} />
      </div>
    </div>

    <div>
      <p className={`text-2xl sm:text-3xl font-black tracking-tight ${valueColor}`}>
        {value}
      </p>
      {subtitle && <p className="text-xs text-text-secondary mt-1">{subtitle}</p>}
    </div>

    {trend && (
      <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-[#EDF2F7]">
        <div
          className={`flex items-center gap-0.5 text-xs font-bold ${
            trend.value >= 0 ? 'text-green-primary' : 'text-expense'
          }`}
        >
          {trend.value >= 0 ? (
            <TrendingUp className="h-3.5 w-3.5" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" />
          )}
          <span>{trend.value >= 0 ? `+${trend.value}%` : `${trend.value}%`}</span>
        </div>
        {trend.label && <span className="text-[11px] text-text-secondary font-medium">{trend.label}</span>}
      </div>
    )}
  </div>
);

export default KPICard;
