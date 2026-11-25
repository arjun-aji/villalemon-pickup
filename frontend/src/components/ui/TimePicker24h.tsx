import React, { useState, useEffect, useRef } from 'react';
import { Clock, ChevronDown, Check, X } from 'lucide-react';

interface TimePicker24hProps {
  value?: string; // "HH:mm" e.g. "14:30" or ""
  onChange: (time24: string) => void;
  className?: string;
  required?: boolean;
  placeholder?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
const QUICK_PRESETS = [
  '06:00', '08:00', '10:00', '12:00',
  '14:00', '16:00', '18:00', '20:00', '22:00',
];

export const TimePicker24h: React.FC<TimePicker24hProps> = ({
  value = '',
  onChange,
  className = '',
  required = false,
  placeholder = '--:--',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse hour and minute from value
  const parseTime = (val?: string) => {
    if (!val || !val.trim()) return { h: '', m: '' };
    const parts = val.trim().replace('.', ':').split(':');
    const h = parts[0]?.padStart(2, '0') || '';
    const m = parts[1]?.padStart(2, '0') || '';
    return { h, m };
  };

  const { h: currentHour, m: currentMinute } = parseTime(value);

  // Local state for typed input
  const [typedValue, setTypedValue] = useState(value || '');

  useEffect(() => {
    setTypedValue(value || '');
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectHour = (h: string) => {
    const nextM = currentMinute || '00';
    onChange(`${h}:${nextM}`);
  };

  const handleSelectMinute = (m: string) => {
    const nextH = currentHour || '10';
    onChange(`${nextH}:${m}`);
    setIsOpen(false);
  };

  const handleSelectPreset = (preset: string) => {
    onChange(preset);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setTypedValue('');
    setIsOpen(false);
  };

  // Direct keyboard input handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/[^0-9:]/g, '');
    setTypedValue(input);

    // If matches complete HH:mm
    const match = input.match(/^([01]?\d|2[0-3]):?([0-5]\d)?$/);
    if (match) {
      if (input.includes(':') && input.length >= 4) {
        const parts = input.split(':');
        const h = parts[0].padStart(2, '0');
        const m = (parts[1] || '00').padStart(2, '0');
        onChange(`${h}:${m}`);
      } else if (input.length === 4 && !input.includes(':')) {
        const h = input.slice(0, 2);
        const m = input.slice(2, 4);
        if (parseInt(h, 10) < 24 && parseInt(m, 10) < 60) {
          onChange(`${h}:${m}`);
        }
      }
    }
  };

  const isSelected = Boolean(currentHour && currentMinute);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Clickable Display Bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 bg-white border rounded-xl px-3 h-[42px] cursor-pointer shadow-2xs transition-all ${
          isOpen
            ? 'border-emerald-500 ring-2 ring-emerald-500/20'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <Clock className={`w-4 h-4 shrink-0 transition-colors ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />

        {/* Input & Display */}
        <div className="flex-1 flex items-center">
          <input
            type="text"
            required={required}
            value={isSelected ? `${currentHour}:${currentMinute}` : typedValue}
            placeholder={placeholder}
            onChange={handleInputChange}
            onClick={e => {
              e.stopPropagation();
              setIsOpen(true);
            }}
            className="w-20 bg-transparent font-mono text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400 placeholder:font-normal"
          />
        </div>

        {/* 24-Hour Tag & Dropdown Toggle */}
        <div className="flex items-center gap-1.5 shrink-0 select-none">
          {isSelected && (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                handleClear();
              }}
              className="p-1 text-slate-400 hover:text-red-500 rounded-md transition-colors"
              title="Clear time"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
            24H
          </span>

          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-600' : ''}`} />
        </div>
      </div>

      {/* Scrollable 24-Hour Dropdown Popup */}
      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 z-50 w-72 sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl p-3 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold text-slate-800">Select Time (24 Hrs)</span>
              <span className="text-[10px] text-slate-400 block">Scroll hours & minutes</span>
            </div>
            {isSelected ? (
              <span className="text-xs font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {currentHour}:{currentMinute} hrs
              </span>
            ) : (
              <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                --:--
              </span>
            )}
          </div>

          {/* Two Scrollable Columns: Hours & Minutes */}
          <div className="grid grid-cols-2 gap-2">
            {/* Hour Scrollable Column */}
            <div>
              <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 px-1">
                Hour (00 - 23)
              </div>
              <div className="h-44 overflow-y-auto space-y-1 pr-1 border border-slate-100 rounded-xl p-1 bg-slate-50/50 overscroll-contain">
                {HOURS.map(h => {
                  const isCurrent = currentHour === h;
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => handleSelectHour(h)}
                      className={`w-full py-1 px-2 rounded-lg text-xs font-mono font-bold flex items-center justify-between transition-all ${
                        isCurrent
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-slate-700 hover:bg-slate-200/80'
                      }`}
                    >
                      <span>{h} hrs</span>
                      {isCurrent && <Check className="w-3 h-3 text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Minute Scrollable Column */}
            <div>
              <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 px-1">
                Minute (00 - 55)
              </div>
              <div className="h-44 overflow-y-auto space-y-1 pr-1 border border-slate-100 rounded-xl p-1 bg-slate-50/50 overscroll-contain">
                {MINUTES.map(m => {
                  const isCurrent = currentMinute === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleSelectMinute(m)}
                      className={`w-full py-1 px-2 rounded-lg text-xs font-mono font-bold flex items-center justify-between transition-all ${
                        isCurrent
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-slate-700 hover:bg-slate-200/80'
                      }`}
                    >
                      <span>:{m} min</span>
                      {isCurrent && <Check className="w-3 h-3 text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Preset Times */}
          <div className="mt-2.5 pt-2 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 px-0.5">
              Quick Pick:
            </span>
            <div className="flex flex-wrap gap-1">
              {QUICK_PRESETS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded-md border transition-all ${
                    value === p
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-500 hover:text-red-600 font-semibold transition-colors"
            >
              Reset (--:--)
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors shadow-2xs"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimePicker24h;
