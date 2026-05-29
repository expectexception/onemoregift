"use client";

import * as React from "react";
import { Clock as ClockIcon } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function TimePicker({ value, onChange, label }) {
    const [isOpen, setIsOpen] = React.useState(false);

    // Initial value parsing (HH:mm)
    const initialHours = value ? value.split(":")[0] : "12";
    const initialMinutes = value ? value.split(":")[1] : "00";

    const [hours, setHours] = React.useState(initialHours);
    const [minutes, setMinutes] = React.useState(initialMinutes);

    React.useEffect(() => {
        if (value) {
            const [h, m] = value.split(":");
            setHours(h || "12");
            setMinutes(m || "00");
        }
    }, [value]);

    const handleTimeChange = (newHours, newMinutes) => {
        const formattedTime = `${newHours.padStart(2, "0")}:${newMinutes.padStart(2, "0")}`;
        onChange(formattedTime);
    };

    const hourOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
    const minuteOptions = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

    return (
        <div className="space-y-2 group/time">
            <span className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] ml-1 flex items-center gap-2 group-focus-within/time:text-red-500 transition-colors">
                <ClockIcon className="w-3 h-3" />
                {label}
            </span>

            {/* Hidden input for E2E testing accessibility */}
            <input
                type="time"
                className="sr-only"
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                data-testid={label === "Start time" ? "time-picker-input-start-chronology" : "time-picker-input-termination-date"}
                aria-hidden="true"
            />

            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        data-testid={`time-picker-trigger-${label.toLowerCase().replace(/\s+/g, '-')}`}
                        className={cn(
                            "flex h-12 w-full items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 font-mono text-xs uppercase text-white transition-all hover:bg-white/[0.05] focus:outline-none focus:ring-1 focus:ring-red-500/50 group-hover/time:border-white/[0.12]",
                            !value && "text-neutral-600"
                        )}
                    >
                        <span>{value ? value : "Select Time"}</span>
                        <ClockIcon className="h-4 w-4 text-neutral-700" />
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 border-white/[0.08] bg-zinc-950 p-0 shadow-2xl backdrop-blur-3xl rounded-2xl overflow-hidden" align="start">
                    <div className="flex h-64">
                        {/* Hours selector */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar border-r border-white/[0.04] p-2 space-y-1">
                            <div className="text-[8px] font-black text-neutral-600 uppercase tracking-widest text-center py-2 sticky top-0 bg-zinc-950 z-10">Hours</div>
                            {hourOptions.map((h) => (
                                <button
                                    key={h}
                                    type="button"
                                    onClick={() => {
                                        setHours(h);
                                        handleTimeChange(h, minutes);
                                    }}
                                    className={cn(
                                        "w-full rounded-lg py-2 text-xs font-bold transition-all",
                                        hours === h
                                            ? "bg-red-600 text-white shadow-lg shadow-red-900/20"
                                            : "text-neutral-500 hover:bg-white/[0.05] hover:text-white"
                                    )}
                                    data-testid={`time-hour-${h}`}
                                >
                                    {h}
                                </button>
                            ))}
                        </div>

                        {/* Minutes selector */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                            <div className="text-[8px] font-black text-neutral-600 uppercase tracking-widest text-center py-2 sticky top-0 bg-zinc-950 z-10">Minutes</div>
                            {minuteOptions.filter(m => parseInt(m) % 5 === 0 || m === minutes).map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => {
                                        setMinutes(m);
                                        handleTimeChange(hours, m);
                                    }}
                                    className={cn(
                                        "w-full rounded-lg py-2 text-xs font-bold transition-all",
                                        minutes === m
                                            ? "bg-red-600 text-white shadow-lg shadow-red-900/20"
                                            : "text-neutral-500 hover:bg-white/[0.05] hover:text-white"
                                    )}
                                    data-testid={`time-minute-${m}`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Visual Footer */}
                    <div className="p-3 border-t border-white/[0.04] bg-white/[0.01] flex justify-between items-center px-4">
                        <span className="text-[9px] font-black text-neutral-700 uppercase tracking-widest leading-none">Matrix Chronos</span>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            data-testid="time-confirm"
                            className="text-[9px] font-black text-white bg-red-600 px-3 py-1 rounded-full uppercase tracking-widest hover:bg-red-500 transition-colors"
                        >
                            Confirm
                        </button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
