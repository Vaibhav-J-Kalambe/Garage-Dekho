"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function parseDate(str) {
  if (!str) return null;
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toYMD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Custom inline date picker.
 * Props:
 *   value   — "YYYY-MM-DD" or ""
 *   min     — "YYYY-MM-DD" (disable before this date)
 *   onChange — (valueStr: string) => void
 */
export default function DatePicker({ value, min, onChange }) {
  const today   = new Date();
  today.setHours(0, 0, 0, 0);
  const minDate = min ? parseDate(min) : today;

  const selected = parseDate(value);

  const [viewYear,  setViewYear]  = useState(() => (selected ?? today).getFullYear());
  const [viewMonth, setViewMonth] = useState(() => (selected ?? today).getMonth());

  const firstDOW   = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  // Disable going to a previous month that's entirely before minDate
  const canGoPrev = new Date(viewYear, viewMonth, 0) >= minDate;

  function selectDay(day) {
    const d = new Date(viewYear, viewMonth, day);
    if (d < minDate) return;
    onChange(toYMD(d));
  }

  function isDisabled(day) {
    return new Date(viewYear, viewMonth, day) < minDate;
  }
  function isSelected(day) {
    if (!selected) return false;
    return selected.getFullYear() === viewYear &&
           selected.getMonth()    === viewMonth &&
           selected.getDate()     === day;
  }
  function isToday(day) {
    return today.getFullYear() === viewYear &&
           today.getMonth()    === viewMonth &&
           today.getDate()     === day;
  }

  return (
    <div className="select-none rounded-2xl border border-slate-200 bg-white p-4">

      {/* Month navigation */}
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={prevMonth}
          disabled={!canGoPrev}
          aria-label="Previous month"
          className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 active:scale-95 disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="text-sm font-black text-slate-800">
          {MONTHS[viewMonth]} {viewYear}
        </span>

        <button
          type="button"
          onClick={nextMonth}
          aria-label="Next month"
          className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 active:scale-95"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="mb-1 grid grid-cols-7">
        {DAYS.map((d) => (
          <div key={d} className="py-1 text-center text-[10px] font-bold text-slate-400">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {/* Empty leading cells */}
        {Array.from({ length: firstDOW }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const disabled = isDisabled(day);
          const selected = isSelected(day);
          const todayDay = isToday(day);

          return (
            <button
              key={day}
              type="button"
              onClick={() => selectDay(day)}
              disabled={disabled}
              className={[
                "mx-auto flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold transition active:scale-95",
                selected  ? "bg-primary text-white shadow-sm"           : "",
                !selected && todayDay ? "border border-primary text-primary"  : "",
                !selected && !todayDay && !disabled ? "text-slate-700 hover:bg-slate-100" : "",
                disabled  ? "cursor-not-allowed text-slate-200"         : "",
              ].filter(Boolean).join(" ")}
            >
              {day}
            </button>
          );
        })}
      </div>

    </div>
  );
}
