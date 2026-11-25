import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface TimePicker24hProps {
  value?: string; // "HH:mm" e.g. "14:30" or "02:15"
  onChange: (time24: string) => void;
  className?: string;
  required?: boolean;
}

const HOURS_24 = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

export const TimePicker24h: React.FC<TimePicker24hProps> = ({
  value = '10:00',
  onChange,
  className = '',
  required = false,
}) => {
  // Parse initial value
  const parseVal = (v?: string) => {
    if (!v) return { h: '10', m: '00' };
    const parts = v.trim().split(':');
    const h = (parts[0] || '10').slice(0, 2).padStart(2, '0');
    const m = (parts[1] || '00').slice(0, 2).padStart(2, '0');
    return {
      h: parseInt(h, 10) >= 0 && parseInt(h, 10) < 24 ? h : '10',
      m: parseInt(m, 10) >= 0 && parseInt(m, 10) < 60 ? m : '00',
    };
  };

  const [hour, setHour] = useState(() => parseVal(value).h);
  const [minute, setMinute] = useState(() => parseVal(value).m);

  useEffect(() => {
    if (value) {
      const p = parseVal(value);
      setHour(p.h);
      setMinute(p.m);
    }
  }, [value]);

  const handleHourChange = (newH: string) => {
    setHour(newH);
    onChange(`${newH}:${minute}`);
  };

  const handleMinuteChange = (newM: string) => {
    setMinute(newM);
    onChange(`${hour}:${newM}`);
  };

  return (
    <div className={`relative flex items-center gap-1.5 ${className}`}>
      {/* Visual Clock Container */}
      <div className="flex-1 flex items-center bg-white border border-slate-300 rounded-xl px-3 py-2 shadow-2xs focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all">
        <Clock className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />

        {/* 24-Hour Select (00 to 23) - NO AM/PM */}
        <div className="flex-1 flex items-center justify-between">
          <div className="flex items-center gap-1 flex-1">
            <select
              value={hour}
              required={required}
              onChange={e => handleHourChange(e.target.value)}
              className="w-full bg-transparent text-sm font-black text-slate-800 font-mono outline-none cursor-pointer text-center"
              title="Hour in 24-hour format (00 - 23)"
            >
              {HOURS_24.map(h => (
                <option key={h} value={h} className="font-mono text-slate-800">
                  {h} hrs
                </option>
              ))}
            </select>

            <span className="text-slate-400 font-black text-sm select-none">:</span>

            {/* Minute Select (00 to 59) */}
            <select
              value={minute}
              required={required}
              onChange={e => handleMinuteChange(e.target.value)}
              className="w-full bg-transparent text-sm font-black text-slate-800 font-mono outline-none cursor-pointer text-center"
              title="Minute (00 - 59)"
            >
              {MINUTES.map(m => (
                <option key={m} value={m} className="font-mono text-slate-800">
                  {m} min
                </option>
              ))}
            </select>
          </div>

          <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 shrink-0 ml-2 select-none">
            24 HRS
          </span>
        </div>
      </div>
    </div>
  );
};

export default TimePicker24h;
