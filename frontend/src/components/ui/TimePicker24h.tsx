import React from 'react';

interface TimePicker24hProps {
  value?: string; // "HH:mm" e.g. "14:30" or ""
  onChange: (time24: string) => void;
  className?: string;
  required?: boolean;
}

const HOURS_24 = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES_60 = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

export const TimePicker24h: React.FC<TimePicker24hProps> = ({
  value = '',
  onChange,
  className = '',
  required = false,
}) => {
  const parts = (value || '').trim().replace('.', ':').split(':');
  const currentHour = parts[0] && parts[0] !== '--' ? parts[0].padStart(2, '0') : '';
  const currentMinute = parts[1] && parts[1] !== '--' ? parts[1].padStart(2, '0') : '';

  const handleHourChange = (newHour: string) => {
    if (!newHour) {
      if (currentMinute) {
        onChange(`--:${currentMinute}`);
      } else {
        onChange('');
      }
      return;
    }
    const nextMinute = currentMinute || '00';
    onChange(`${newHour}:${nextMinute}`);
  };

  const handleMinuteChange = (newMinute: string) => {
    if (!newMinute) {
      if (currentHour) {
        onChange(`${currentHour}:--`);
      } else {
        onChange('');
      }
      return;
    }
    const nextHour = currentHour || '10';
    onChange(`${nextHour}:${newMinute}`);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* 1. Hour Dropdown (00 - 23) */}
      <div className="flex-1 relative">
        <select
          value={currentHour}
          required={required}
          onChange={e => handleHourChange(e.target.value)}
          className={`w-full h-[42px] pl-3 pr-8 bg-white border rounded-xl font-bold font-mono text-xs sm:text-sm outline-none cursor-pointer appearance-none transition-all shadow-2xs ${
            currentHour
              ? 'border-emerald-500 text-slate-900 bg-emerald-50/20'
              : 'border-slate-200 text-slate-500'
          } focus:ring-2 focus:ring-navy-primary/20 focus:border-navy-primary`}
          title="Select Hour in 24-Hour Format (00 to 23)"
        >
          <option value="">-- Hour --</option>
          {HOURS_24.map(h => (
            <option key={h} value={h} className="font-mono text-slate-900">
              {h} hrs
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>

      <span className="font-black text-slate-400 text-base select-none shrink-0">:</span>

      {/* 2. Minute Dropdown (00 - 59) */}
      <div className="flex-1 relative">
        <select
          value={currentMinute}
          required={required}
          onChange={e => handleMinuteChange(e.target.value)}
          className={`w-full h-[42px] pl-3 pr-8 bg-white border rounded-xl font-bold font-mono text-xs sm:text-sm outline-none cursor-pointer appearance-none transition-all shadow-2xs ${
            currentMinute
              ? 'border-emerald-500 text-slate-900 bg-emerald-50/20'
              : 'border-slate-200 text-slate-500'
          } focus:ring-2 focus:ring-navy-primary/20 focus:border-navy-primary`}
          title="Select Minute (00 to 59)"
        >
          <option value="">-- Minute --</option>
          {MINUTES_60.map(m => (
            <option key={m} value={m} className="font-mono text-slate-900">
              :{m} min
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default TimePicker24h;
