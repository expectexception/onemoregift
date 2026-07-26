"use client";

import { PackageCheck, Eye, Flame, Wrench } from "lucide-react";

const PHASES = [
    { key: "reveal", label: "Reveal", fallbackDays: "Wed, Thu", desc: "Products & prices revealed", icon: Eye },
    { key: "sale", label: "Sale Live", fallbackDays: "Fri, Sat", desc: "Limited quantity, order now", icon: Flame },
    { key: "prep", label: "Preparing", fallbackDays: "Sun", desc: "We pack your orders", icon: Wrench },
    { key: "pickup", label: "Pickup", fallbackDays: "Mon, Tue", desc: "Collect from your store", icon: PackageCheck },
];

// Weekly drop cycle strip: highlights the current phase. The days per phase are
// admin-configurable, so they come from the config's `shopPhases` map.
export default function WeeklyDropStrip({ phase, shopPhases }) {
    const phases = PHASES.map((p) => ({
        ...p,
        days: shopPhases?.[p.key]?.days || p.fallbackDays,
    }));

    return (
        <div className="mb-10">
            <div className="flex items-center justify-center gap-2 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                    Weekly Drop Cycle
                </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {phases.map(({ key, label, days, desc, icon: Icon }) => {
                    const active = key === phase;
                    return (
                        <div
                            key={key}
                            className={`relative p-4 rounded-2xl border text-center transition-all ${active
                                ? "border-red-500/60 bg-red-500/10 shadow-[0_0_30px_-8px_rgba(239,68,68,0.5)]"
                                : "border-neutral-900 bg-neutral-950/60"}`}
                        >
                            {active && (
                                <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-bold uppercase tracking-wider">
                                    Now
                                </span>
                            )}
                            <Icon className={`w-5 h-5 mx-auto mb-2 ${active ? "text-red-400" : "text-neutral-600"}`} />
                            <p className={`text-xs font-bold ${active ? "text-white" : "text-neutral-400"}`}>{label}</p>
                            <p className={`text-[10px] font-semibold mt-0.5 ${active ? "text-red-400" : "text-neutral-600"}`}>{days}</p>
                            <p className="text-[9px] text-neutral-500 mt-1 leading-snug">{desc}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
