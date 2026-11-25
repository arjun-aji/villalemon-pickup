import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface TimePicker24hProps {
  value?: string; // "HH:mm" e.g. "14:30" or ""
  onChange: (time24: string) => void;
  className?: string;
  required?: boolean;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
// Standard minutes list 00 to 59
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

export const TimePicker24h: React.FC<TimePicker24hProps> = ({
  value = '',
  onChange,
  className = '',
  required = false,
}) => {
  const parts = (value || '').trim().replace('.', ':').split(':');
  const currentHour = parts[0] && parts[0] !== '--' ? parts[0].padStart(2, '0') : '';
  const currentMinute = parts[1] && parts[1] !== '--' ? parts[1].padStart(2, '0') : '';

  // Local text input state for typing
  const [hourText, setHourText] = useState(currentHour);
  const [minuteText, setMinuteText] = useState(currentMinute);

  const [isHourOpen, setIsHourOpen] = useState(false);
  const [isMinuteOpen, setIsMinuteOpen] = useState(false);

  const hourContainerRef = useRef<HTMLDivElement>(null);
  const minuteContainerRef = useRef<HTMLDivElement>(null);
  const minuteInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHourText(currentHour);
    setMinuteText(currentMinute);
  }, [currentHour, currentMinute]);

  // Click outside listener to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (hourContainerRef.current && !hourContainerRef.current.contains(e.target as Node)) {
        setIsHourOpen(false);
      }
      if (minuteContainerRef.current && !minuteContainerRef.current.contains(e.target as Node)) {
        setIsMinuteOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const triggerChange = (newH: string, newM: string) => {
    if (!newH && !newM) {
      onChange('');
    } else {
      onChange(`${newH || '--'}:${newM || '--'}`);
    }
  };

  // Hour typing
  const handleHourInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9]/g, '');
    if (val.length > 2) val = val.slice(-2);
    setHourText(val);

    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      if (num > 23) {
        val = '23';
        setHourText('23');
      }
      triggerChange(val.padStart(2, '0'), minuteText);
      if (val.length === 2 || num > 2) {
        setIsHourOpen(false);
        minuteInputRef.current?.focus();
        minuteInputRef.current?.select();
      }
    } else {
      triggerChange('', minuteText);
    }
  };

  const handleHourBlur = () => {
    if (hourText) {
      let num = parseInt(hourText, 10);
      if (isNaN(num) || num < 0) num = 0;
      if (num > 23) num = 23;
      const formatted = String(num).padStart(2, '0');
      setHourText(formatted);
      triggerChange(formatted, minuteText);
    }
  };

  const selectHour = (h: string) => {
    setHourText(h);
    setIsHourOpen(false);
    triggerChange(h, minuteText || '00');
    // Focus minute input next
    minuteInputRef.current?.focus();
    minuteInputRef.current?.select();
  };

  // Minute typing
  const handleMinuteInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9]/g, '');
    if (val.length > 2) val = val.slice(-2);
    setMinuteText(val);

    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      if (num > 59) {
        val = '59';
        setMinuteText('59');
      }
      triggerChange(hourText || '10', val.padStart(2, '0'));
      if (val.length === 2) {
        setIsMinuteOpen(false);
      }
    } else {
      triggerChange(hourText, '');
    }
  };

  const handleMinuteBlur = () => {
    if (minuteText) {
      let num = parseInt(minuteText, 10);
      if (isNaN(num) || num < 0) num = 0;
      if (num > 59) num = 59;
      const formatted = String(num).padStart(2, '0');
      setMinuteText(formatted);
      triggerChange(hourText || '10', formatted);
    }
  };

  const selectMinute = (m: string) => {
    setMinuteText(m);
    setIsMinuteOpen(false);
    triggerChange(hourText || '10', m);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* 1. Hour Combobox (Typeable + Dropdown Arrow on Side) */}
      <div className="flex-1 relative" ref={hourContainerRef}>
        <div
          className={`flex items-center h-[42px] bg-white border rounded-xl transition-all shadow-2xs overflow-hidden ${
            isHourOpen
              ? 'border-emerald-500 ring-2 ring-emerald-500/20'
              : currentHour
                ? 'border-slate-300'
                : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <input
            type="text"
            inputMode="numeric"
            placeholder="-- Hour"
            value={hourText}
            required={required}
            onChange={handleHourInput}
            onBlur={handleHourBlur}
            onFocus={() => {
              setIsHourOpen(true);
              setIsMinuteOpen(false);
            }}
            className="w-full h-full pl-3 pr-1 text-xs sm:text-sm font-bold font-mono text-slate-800 placeholder:text-slate-400 placeholder:font-normal bg-transparent outline-none"
            title="Type hour (00-23) or click dropdown arrow"
          />

          <button
            type="button"
            tabIndex={-1}
            onClick={() => {
              setIsHourOpen(prev => !prev);
              setIsMinuteOpen(false);
            }}
            className="h-full px-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center border-l border-slate-100"
            title="Open hours dropdown"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isHourOpen ? 'rotate-180 text-emerald-600' : ''}`} />
          </button>
        </div>

        {/* Scrollable Dropdown Menu for Hour */}
        {isHourOpen && (
          <div className="absolute top-[calc(100%+4px)] left-0 z-50 w-full max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl p-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
            <div className="text-[10px] font-black uppercase text-slate-400 px-2 py-1 select-none">
              Hours (00 - 23)
            </div>
            {HOURS.map(h => {
              const isSelected = currentHour === h;
              return (
                <button
                  key={h}
                  type="button"
                  onClick={() => selectHour(h)}
                  className={`w-full px-2.5 py-1.5 text-xs font-mono font-bold text-left rounded-lg transition-colors flex items-center justify-between ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{h} hrs</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <span className="font-black text-slate-400 text-base select-none shrink-0">:</span>

      {/* 2. Minute Combobox (Typeable + Dropdown Arrow on Side) */}
      <div className="flex-1 relative" ref={minuteContainerRef}>
        <div
          className={`flex items-center h-[42px] bg-white border rounded-xl transition-all shadow-2xs overflow-hidden ${
            isMinuteOpen
              ? 'border-emerald-500 ring-2 ring-emerald-500/20'
              : currentMinute
                ? 'border-slate-300'
                : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <input
            ref={minuteInputRef}
            type="text"
            inputMode="numeric"
            placeholder="-- Min"
            value={minuteText}
            required={required}
            onChange={handleMinuteInput}
            onBlur={handleMinuteBlur}
            onFocus={() => {
              setIsMinuteOpen(true);
              setIsHourOpen(false);
            }}
            className="w-full h-full pl-3 pr-1 text-xs sm:text-sm font-bold font-mono text-slate-800 placeholder:text-slate-400 placeholder:font-normal bg-transparent outline-none"
            title="Type minute (00-59) or click dropdown arrow"
          />

          <button
            type="button"
            tabIndex={-1}
            onClick={() => {
              setIsMinuteOpen(prev => !prev);
              setIsHourOpen(false);
            }}
            className="h-full px-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center border-l border-slate-100"
            title="Open minutes dropdown"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMinuteOpen ? 'rotate-180 text-emerald-600' : ''}`} />
          </button>
        </div>

        {/* Scrollable Dropdown Menu for Minute */}
        {isMinuteOpen && (
          <div className="absolute top-[calc(100%+4px)] left-0 z-50 w-full max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl p-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
            <div className="text-[10px] font-black uppercase text-slate-400 px-2 py-1 select-none">
              Minutes (00 - 59)
            </div>
            {MINUTES.map(m => {
              const isSelected = currentMinute === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => selectMinute(m)}
                  className={`w-full px-2.5 py-1.5 text-xs font-mono font-bold text-left rounded-lg transition-colors flex items-center justify-between ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>:{m} min</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimePicker24h;
