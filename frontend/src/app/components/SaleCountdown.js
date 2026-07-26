"use client";

import { useEffect, useState } from "react";
import { Flame, Clock } from "lucide-react";

// Ticks down to the next sale opening (or the current sale's closing time).
// The target instants are computed on the server in IST, so a customer in any
// timezone sees the same countdown.
function useCountdown(targetIso) {
    const [remaining, setRemaining] = useState(null);

    useEffect(() => {
        if (!targetIso) {
            setRemaining(null);
            return undefined;
        }
        const target = new Date(targetIso).getTime();
        if (Number.isNaN(target)) {
            setRemaining(null);
            return undefined;
        }

        const tick = () => setRemaining(Math.max(0, target - Date.now()));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [targetIso]);

    return remaining;
}

const split = (ms) => {
    const total = Math.floor(ms / 1000);
    return {
        days: Math.floor(total / 86400),
        hours: Math.floor((total % 86400) / 3600),
        minutes: Math.floor((total % 3600) / 60),
        seconds: total % 60,
    };
};

function Unit({ value, label }) {
    return (
        <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums leading-none">
                {String(value).padStart(2, "0")}
            </span>
            <span className="text-[9px] uppercase tracking-widest text-neutral-500 mt-1.5">{label}</span>
        </div>
    );
}

/**
 * config comes from the public site config and carries saleOpensAt / saleClosesAt.
 * Renders nothing when the weekly drop is off or there is no scheduled opening,
 * so an always-open shop is unaffected.
 */
export default function SaleCountdown({ config, onElapsed }) {
    const isOpen = config?.shopPhase === "sale";
    const target = isOpen ? config?.saleClosesAt : config?.saleOpensAt;
    const remaining = useCountdown(target);
    const [firedAt, setFiredAt] = useState(null);

    // When the clock runs out the server's answer has changed, so let the page refetch
    useEffect(() => {
        if (remaining === 0 && target && firedAt !== target) {
            setFiredAt(target);
            onElapsed?.();
        }
    }, [remaining, target, firedAt, onElapsed]);

    if (!config?.weeklyDropEnabled || !target || remaining === null) return null;

    const { days, hours, minutes, seconds } = split(remaining);

    return (
        <div
            className={`mb-8 rounded-2xl border p-5 sm:p-6 ${
                isOpen
                    ? "border-red-500/40 bg-gradient-to-br from-red-600/15 to-transparent"
                    : "border-white/[0.08] bg-white/[0.02]"
            }`}
        >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
                <div className="text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5">
                        {isOpen ? (
                            <>
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                                </span>
                                <Flame className="w-4 h-4 text-red-400" />
                                <span className="text-xs font-bold uppercase tracking-widest text-red-400">Sale is live</span>
                            </>
                        ) : (
                            <>
                                <Clock className="w-4 h-4 text-neutral-400" />
                                <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Next drop</span>
                            </>
                        )}
                    </div>
                    <p className="text-sm text-neutral-300">
                        {isOpen ? "Ordering closes in" : "Ordering opens in"}
                    </p>
                    {config.saleWindowLabel && (
                        <p className="text-[11px] text-neutral-500 mt-0.5">{config.saleWindowLabel}</p>
                    )}
                </div>

                <div className="flex items-start gap-4 sm:gap-5">
                    {days > 0 && <Unit value={days} label="Days" />}
                    <Unit value={hours} label="Hours" />
                    <Unit value={minutes} label="Mins" />
                    <Unit value={seconds} label="Secs" />
                </div>
            </div>
        </div>
    );
}
