import React, { useState, useEffect, useRef } from 'react';
import { Clock, ChevronUp, ChevronDown } from 'lucide-react';

interface TimePicker24hProps {
  value?: string; // "HH:mm" e.g. "14:30" or "02:15"
  onChange: (time24: string) => void;
  className?: string;
  required?: boolean;
}

export const TimePicker24h: React.FC<TimePicker24hProps> = ({
  value = '10:00',
  onChange,
  className = '',
  required = false,
}) => {
  // Parse incoming value safely into 2-digit 24h hour and minute
  const parseVal = (v?: string) => {
    if (!v) return { h: '10', m: '00' };
    const clean = v.trim().replace('.', ':');
    const parts = clean.split(':');
    let hNum = parseInt(parts[0] || '10', 10);
    let mNum = parseInt(parts[1] || '00', 10);
    if (isNaN(hNum) || hNum < 0 || hNum > 23) hNum = 10;
    if (isNaN(mNum) || mNum < 0 || mNum > 59) mNum = 0;
    return {
      h: String(hNum).padStart(2, '0'),
      m: String(mNum).padStart(2, '0'),
    };
  };

  const [hour, setHour] = useState(() => parseVal(value).h);
  const [minute, setMinute] = useState(() => parseVal(value).m);

  const hourInputRef = useRef<HTMLInputElement>(null);
  const minuteInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value) {
      const p = parseVal(value);
      setHour(p.h);
      setMinute(p.m);
    }
  }, [value]);

  const updateTime = (newH: string, newM: string) => {
    const hPad = newH.padStart(2, '0');
    const mPad = newM.padStart(2, '0');
    setHour(hPad);
    setMinute(mPad);
    onChange(`${hPad}:${mPad}`);
  };

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/[^0-9]/g, '');
    if (raw.length > 2) raw = raw.slice(-2);
    setHour(raw);

    const num = parseInt(raw, 10);
    if (!isNaN(num)) {
      if (num > 23) {
        updateTime('23', minute);
        minuteInputRef.current?.focus();
        minuteInputRef.current?.select();
      } else if (raw.length === 2 || num > 2) {
        // If 2 digits entered (e.g. 14, 09) or first digit > 2 (e.g. 3-9 which can only be 03-09), auto-format and advance to minutes
        const formattedH = String(num).padStart(2, '0');
        updateTime(formattedH, minute);
        minuteInputRef.current?.focus();
        minuteInputRef.current?.select();
      } else {
        onChange(`${raw.padStart(2, '0')}:${minute}`);
      }
    }
  };

  const handleHourBlur = () => {
    let num = parseInt(hour, 10);
    if (isNaN(num) || num < 0) num = 10;
    if (num > 23) num = 23;
    const formatted = String(num).padStart(2, '0');
    setHour(formatted);
    onChange(`${formatted}:${minute}`);
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/[^0-9]/g, '');
    if (raw.length > 2) raw = raw.slice(-2);
    setMinute(raw);

    const num = parseInt(raw, 10);
    if (!isNaN(num)) {
      if (num > 59) {
        updateTime(hour, '59');
      } else if (raw.length === 2) {
        updateTime(hour, String(num).padStart(2, '0'));
      } else {
        onChange(`${hour}:${raw.padStart(2, '0')}`);
      }
    }
  };

  const handleMinuteBlur = () => {
    let num = parseInt(minute, 10);
    if (isNaN(num) || num < 0) num = 0;
    if (num > 59) num = 59;
    const formatted = String(num).padStart(2, '0');
    setMinute(formatted);
    onChange(`${hour}:${formatted}`);
  };

  const stepHour = (delta: number) => {
    let num = parseInt(hour, 10);
    if (isNaN(num)) num = 10;
    num = (num + delta + 24) % 24;
    const formatted = String(num).padStart(2, '0');
    updateTime(formatted, minute);
  };

  const stepMinute = (delta: number) => {
    let num = parseInt(minute, 10);
    if (isNaN(num)) num = 0;
    num = (num + delta + 60) % 60;
    const formatted = String(num).padStart(2, '0');
    updateTime(hour, formatted);
  };

  const handleHourKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      stepHour(1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      stepHour(-1);
    } else if (e.key === ':' || e.key === 'Enter' || e.key === 'ArrowRight') {
      e.preventDefault();
      minuteInputRef.current?.focus();
      minuteInputRef.current?.select();
    }
  };

  const handleMinuteKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      stepMinute(5);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      stepMinute(-5);
    } else if (e.key === 'Backspace' && minute === '') {
      e.preventDefault();
      hourInputRef.current?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      hourInputRef.current?.focus();
      hourInputRef.current?.select();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    const match = text.match(/(\d{1,2})[:.]?(\d{0,2})/);
    if (match) {
      let h = parseInt(match[1], 10);
      let m = parseInt(match[2] || '0', 10);
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        updateTime(String(h).padStart(2, '0'), String(m).padStart(2, '0'));
      }
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Visual Clock Container */}
      <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-xl px-3 py-1.5 shadow-2xs focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all">
        <Clock className="w-4 h-4 text-emerald-600 shrink-0" />

        {/* 24-Hour Display & Interactive Controls */}
        <div className="flex items-center gap-1.5">
          {/* Hour Box */}
          <div className="flex items-center bg-slate-100 hover:bg-slate-200/70 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500 rounded-lg border border-slate-200 px-1.5 py-0.5 transition-all">
            <input
              ref={hourInputRef}
              type="text"
              inputMode="numeric"
              value={hour}
              required={required}
              onChange={handleHourChange}
              onBlur={handleHourBlur}
              onKeyDown={handleHourKeyDown}
              onPaste={handlePaste}
              onFocus={e => e.target.select()}
              placeholder="10"
              className="w-8 text-center text-sm font-black text-slate-900 font-mono bg-transparent outline-none"
              title="Hour in 24-hour format (00 - 23). Type number or use arrow keys."
            />
            <div className="flex flex-col ml-0.5 -mr-0.5">
              <button
                type="button"
                tabIndex={-1}
                onClick={() => stepHour(1)}
                className="p-0.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors"
                title="Next hour (+1)"
              >
                <ChevronUp className="w-2.5 h-2.5" />
              </button>
              <button
                type="button"
                tabIndex={-1}
                onClick={() => stepHour(-1)}
                className="p-0.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors"
                title="Previous hour (-1)"
              >
                <ChevronDown className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>

          <span className="text-slate-500 font-black text-base select-none">:</span>

          {/* Minute Box */}
          <div className="flex items-center bg-slate-100 hover:bg-slate-200/70 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500 rounded-lg border border-slate-200 px-1.5 py-0.5 transition-all">
            <input
              ref={minuteInputRef}
              type="text"
              inputMode="numeric"
              value={minute}
              required={required}
              onChange={handleMinuteChange}
              onBlur={handleMinuteBlur}
              onKeyDown={handleMinuteKeyDown}
              onPaste={handlePaste}
              onFocus={e => e.target.select()}
              placeholder="00"
              className="w-8 text-center text-sm font-black text-slate-900 font-mono bg-transparent outline-none"
              title="Minute (00 - 59). Type number or use arrow keys."
            />
            <div className="flex flex-col ml-0.5 -mr-0.5">
              <button
                type="button"
                tabIndex={-1}
                onClick={() => stepMinute(5)}
                className="p-0.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors"
                title="Next 5 minutes (+5)"
              >
                <ChevronUp className="w-2.5 h-2.5" />
              </button>
              <button
                type="button"
                tabIndex={-1}
                onClick={() => stepMinute(-5)}
                className="p-0.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors"
                title="Previous 5 minutes (-5)"
              >
                <ChevronDown className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Minute Jump Pills */}
        <div className="flex items-center gap-1 ml-auto shrink-0">
          {['00', '15', '30', '45'].map(m => (
            <button
              key={m}
              type="button"
              tabIndex={-1}
              onClick={() => {
                setMinute(m);
                onChange(`${hour}:${m}`);
              }}
              className={`px-1.5 py-0.5 text-[11px] font-mono font-bold rounded transition-all select-none ${
                minute === m
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
              title={`Set minute to :${m}`}
            >
              :{m}
            </button>
          ))}

          <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0 ml-1 select-none">
            24H
          </span>
        </div>
      </div>
    </div>
  );
};

export default TimePicker24h;
