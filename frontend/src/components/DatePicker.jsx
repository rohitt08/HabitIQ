import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays } from "date-fns";
import { getISTDate } from "../utils/dateHelpers.js";

export default function DatePicker({ selectedDate, onSelect }) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(selectedDate || getISTDate()));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const dateFormat = "d";
  const rows = [];
  let days = [];
  let day = startDate;

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const formattedDate = format(day, dateFormat);
      const cloneDay = day;
      days.push(
        <button
          key={day.toISOString()}
          onClick={() => onSelect(cloneDay)}
          className={`p-1 w-8 h-8 flex items-center justify-center rounded-full text-sm transition-colors ${
            !isSameMonth(day, monthStart)
              ? "text-faint opacity-50 hover:bg-[var(--surface-hover)]"
              : isSameDay(day, selectedDate)
              ? "bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-500/30"
              : isSameDay(day, getISTDate())
              ? "text-brand-600 dark:text-brand-400 font-bold hover:bg-[var(--surface-hover)]"
              : "hover:bg-[var(--surface-hover)] text-soft"
          }`}
        >
          {formattedDate}
        </button>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div className="flex justify-between" key={day.toISOString()}>
        {days}
      </div>
    );
    days = [];
  }

  return (
    <div className="p-4 w-[280px]">
      <div className="flex justify-between items-center mb-4">
        <button 
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} 
          className="p-1.5 text-soft hover:bg-[var(--surface-hover)] rounded-md transition"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="font-semibold text-sm tracking-wide">{format(currentMonth, "MMMM yyyy")}</div>
        <button 
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} 
          className="p-1.5 text-soft hover:bg-[var(--surface-hover)] rounded-md transition"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="flex justify-between mb-2 px-1">
        {["Mo","Tu","We","Th","Fr","Sa","Su"].map((d, i) => (
          <div key={i} className="w-8 text-center text-[11px] uppercase tracking-wider font-semibold text-faint">
            {d}
          </div>
        ))}
      </div>
      <div className="space-y-1 px-1">
        {rows}
      </div>
    </div>
  );
}
