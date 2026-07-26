"use client";

import * as React from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

// A yyyy-MM-dd string is a calendar date, not an instant — parsing it with `new
// Date()` would shift it by the UTC offset and land on the previous day for IST.
const toKey = (date) => {
    if (!date) return "";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
};

const fromKey = (key) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key || ""));
    if (!match) return null;
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return Number.isNaN(date.getTime()) ? null : date;
};

const formatLong = (key) => {
    const date = fromKey(key);
    if (!date) return "";
    return `${date.getDate()} ${MONTHS[date.getMonth()].slice(0, 3)} ${date.getFullYear()}`;
};

// Leading blanks + every day of the month, as a flat 7-column grid
const buildMonthCells = (year, month) => {
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = Array.from({ length: firstWeekday }, () => null);
    for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day));
    return cells;
};

/**
 * Dark-theme calendar picker. Replaces bare `<input type="date">`, whose native
 * indicator is nearly invisible against this UI, with a visible calendar popover.
 * `value`, `min` and `max` are all yyyy-MM-dd strings.
 */
export function DatePicker({ value, onChange, label, min, max, testId, required = false }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const selected = fromKey(value);
    const today = new Date();

    const [viewDate, setViewDate] = React.useState(() => selected || fromKey(min) || today);

    // Re-centre the calendar when the field is filled in from outside (edit forms)
    React.useEffect(() => {
        const next = fromKey(value);
        if (next) setViewDate(new Date(next.getFullYear(), next.getMonth(), 1));
    }, [value]);

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const cells = buildMonthCells(year, month);
    const todayKey = toKey(today);

    const isDisabled = (date) => {
        const key = toKey(date);
        if (min && key < min) return true;
        if (max && key > max) return true;
        return false;
    };

    const selectDate = (date) => {
        if (isDisabled(date)) return;
        onChange(toKey(date));
        setIsOpen(false);
    };

    const shiftMonth = (delta) => setViewDate(new Date(year, month + delta, 1));

    return (
        <div className="space-y-2 group/date">
            <span className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] ml-1 flex items-center gap-2 group-focus-within/date:text-red-500 transition-colors">
                <CalendarIcon className="w-3 h-3" />
                {label}
            </span>

            {/* Native input kept for form validation and E2E selectors */}
            <input
                type="date"
                className="sr-only"
                value={value || ""}
                min={min || undefined}
                max={max || undefined}
                required={required}
                onChange={(e) => onChange(e.target.value)}
                data-testid={testId}
                tabIndex={-1}
                aria-hidden="true"
            />

            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        className={cn(
                            "w-full h-10 px-3 flex items-center justify-between rounded-xl border transition-all text-left",
                            "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/20",
                            isOpen && "border-red-500/60 bg-white/[0.06]"
                        )}
                    >
                        <span className={cn("text-xs font-semibold", value ? "text-white" : "text-neutral-600")}>
                            {value ? formatLong(value) : "Select a date"}
                        </span>
                        <CalendarIcon className={cn("w-4 h-4 shrink-0", isOpen ? "text-red-500" : "text-neutral-500")} />
                    </button>
                </PopoverTrigger>

                <PopoverContent
                    className="w-auto p-3 bg-[#0b0b0b] border-white/10 rounded-2xl shadow-2xl"
                    align="start"
                >
                    {/* Month navigation */}
                    <div className="flex items-center justify-between mb-3 px-1">
                        <button
                            type="button"
                            onClick={() => shiftMonth(-1)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                            aria-label="Previous month"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="text-xs font-bold text-white tracking-wide">
                            {MONTHS[month]} {year}
                        </div>
                        <button
                            type="button"
                            onClick={() => shiftMonth(1)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                            aria-label="Next month"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-1">
                        {WEEKDAYS.map((day, i) => (
                            <div key={`${day}-${i}`} className="w-8 text-center text-[9px] font-bold text-neutral-600 uppercase">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {cells.map((date, index) => {
                            if (!date) return <div key={`blank-${index}`} className="w-8 h-8" />;
                            const key = toKey(date);
                            const disabled = isDisabled(date);
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => selectDate(date)}
                                    className={cn(
                                        "w-8 h-8 rounded-lg text-[11px] font-semibold transition-all",
                                        key === value
                                            ? "bg-red-600 text-white shadow-[0_0_16px_-4px_rgba(239,68,68,0.8)]"
                                            : disabled
                                                ? "text-neutral-800 cursor-not-allowed"
                                                : "text-neutral-300 hover:bg-white/10 hover:text-white",
                                        key === todayKey && key !== value && !disabled && "ring-1 ring-red-500/40 text-red-400"
                                    )}
                                >
                                    {date.getDate()}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06]">
                        <button
                            type="button"
                            onClick={() => selectDate(today)}
                            disabled={isDisabled(today)}
                            className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 hover:text-red-400 transition-colors disabled:opacity-30 disabled:hover:text-neutral-500"
                        >
                            Today
                        </button>
                        {value && (
                            <button
                                type="button"
                                onClick={() => { onChange(""); setIsOpen(false); }}
                                className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 hover:text-white transition-colors"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}

export default DatePicker;
