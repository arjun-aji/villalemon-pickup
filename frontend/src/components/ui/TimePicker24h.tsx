import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface TimePicker24hProps {
  value?: string; // "HH:mm" e.g. "14:30" or ""
  onChange: (time24: string) => void;
  className?: string;
  required?: boolean;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

export const TimePicker24h: React.FC<TimePicker24hProps> = ({
  value = '',
  onChange,
  className = '',
  required = false,
}) => {
  const parseVal = (val?: string) => {
    if (!val) return { h: '', m: '' };
    const parts = val.trim().replace('.', ':').split(':');
    const h = parts[0] && parts[0] !== '--' ? parts[0] : '';
    const m = parts[1] && parts[1] !== '--' ? parts[1] : '';
    return { h, m };
  };

  const { h: initialHour, m: initialMinute } = parseVal(value);

  const [hourText, setHourText] = useState(initialHour);
  const [minuteText, setMinuteText] = useState(initialMinute);

  const [isHourOpen, setIsHourOpen] = useState(false);
  const [isMinuteOpen, setIsMinuteOpen] = useState(false);

  const hourContainerRef = useRef<HTMLDivElement>(null);
  const minuteContainerRef = useRef<HTMLDivElement>(null);
  const hourInputRef = useRef<HTMLInputElement>(null);
  const minuteInputRef = useRef<HTMLInputElement>(null);

  // Sync from props only when the input is NOT actively focused
  useEffect(() => {
    const { h, m } = parseVal(value);
    if (document.activeElement !== hourInputRef.current) {
      setHourText(h);
    }
    if (document.activeElement !== minuteInputRef.current) {
      setMinuteText(m);
    }
  }, [value]);

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

  // Hour typing: allows typing 1 then 2 without premature 01 padding
  const handleHourInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/[^0-9]/g, '');
    if (raw.length > 2) raw = raw.slice(-2);
    setHourText(raw);

    if (raw === '') {
      triggerChange('', minuteText);
      return;
    }

    const num = parseInt(raw, 10);
    if (!isNaN(num)) {
      if (num > 23) {
        const formatted = '23';
        setHourText(formatted);
        triggerChange(formatted, minuteText || '00');
        setIsHourOpen(false);
        minuteInputRef.current?.focus();
        minuteInputRef.current?.select();
      } else if (raw.length === 2) {
        // User entered full 2 digits (e.g. 12, 14, 08, 20)
        const formatted = String(num).padStart(2, '0');
        setHourText(formatted);
        triggerChange(formatted, minuteText || '00');
        setIsHourOpen(false);
        minuteInputRef.current?.focus();
        minuteInputRef.current?.select();
      } else if (num >= 3) {
        // Digit 3-9 cannot be followed by another digit in 24h (max is 23)
        const formatted = String(num).padStart(2, '0');
        setHourText(formatted);
        triggerChange(formatted, minuteText || '00');
        setIsHourOpen(false);
        minuteInputRef.current?.focus();
        minuteInputRef.current?.select();
      }
      // If single digit 0, 1, or 2: do NOT pad yet! Wait for next keystroke (e.g. 1 -> 12)
    }
  };

  const handleHourBlur = () => {
    if (hourText) {
      let num = parseInt(hourText, 10);
      if (isNaN(num) || num < 0) num = 0;
      if (num > 23) num = 23;
      const formatted = String(num).padStart(2, '0');
      setHourText(formatted);
      triggerChange(formatted, minuteText || '00');
    }
  };

  const selectHour = (h: string) => {
    setHourText(h);
    setIsHourOpen(false);
    triggerChange(h, minuteText || '00');
    minuteInputRef.current?.focus();
    minuteInputRef.current?.select();
  };

  // Minute typing: allows typing 3 then 0 without premature padding
  const handleMinuteInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/[^0-9]/g, '');
    if (raw.length > 2) raw = raw.slice(-2);
    setMinuteText(raw);

    if (raw === '') {
      triggerChange(hourText, '');
      return;
    }

    const num = parseInt(raw, 10);
    if (!isNaN(num)) {
      if (num > 59) {
        const formatted = '59';
        setMinuteText(formatted);
        triggerChange(hourText || '10', formatted);
        setIsMinuteOpen(false);
      } else if (raw.length === 2) {
        // User entered full 2 digits (e.g. 30, 45, 05)
        const formatted = String(num).padStart(2, '0');
        setMinuteText(formatted);
        triggerChange(hourText || '10', formatted);
        setIsMinuteOpen(false);
      } else if (num >= 6) {
        // Digit 6-9 cannot be followed by another digit for minutes (max is 59)
        const formatted = String(num).padStart(2, '0');
        setMinuteText(formatted);
        triggerChange(hourText || '10', formatted);
        setIsMinuteOpen(false);
      }
      // If single digit 0-5: do NOT pad yet! Wait for next keystroke (e.g. 3 -> 30)
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
              : hourText
                ? 'border-slate-300'
                : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <input
            ref={hourInputRef}
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
              const isSelected = hourText === h;
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
              : minuteText
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
              const isSelected = minuteText === m;
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
