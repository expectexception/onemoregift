"use client";

import { Check, X, RotateCcw } from "lucide-react";
import { ClockPendingIcon, BadgeCheckIcon, PickupBagIcon } from "@/app/components/SVGIcons";

const STEPS = [
    { key: "pending", label: "Placed", Icon: ClockPendingIcon },
    { key: "paid", label: "Paid", Icon: BadgeCheckIcon },
    { key: "ready_for_pickup", label: "Ready", Icon: PickupBagIcon },
    { key: "collected", label: "Collected", Icon: Check },
];

const STEP_INDEX = { pending: 0, paid: 1, ready_for_pickup: 2, collected: 3 };

// Visual status stepper for shop orders. Renders a normal forward timeline for
// pending -> paid -> ready_for_pickup -> collected, or a terminal "stopped"
// state for cancelled/refunded orders since those exit the happy path.
// While a QR payment proof awaits admin review the first step shows "Verifying".
export default function OrderStatusTimeline({ status, paymentStatus }) {
    if (status === "cancelled" || status === "refunded") {
        const isCancelled = status === "cancelled";
        const Icon = isCancelled ? X : RotateCcw;
        return (
            <div className="flex items-center gap-3 py-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isCancelled ? "bg-neutral-800 text-neutral-400" : "bg-purple-950/40 text-purple-400 border border-purple-900/40"}`}>
                    <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    {isCancelled ? "Order Cancelled" : "Order Refunded"}
                </span>
            </div>
        );
    }

    const currentIndex = STEP_INDEX[status] ?? 0;
    const verifying = status === "pending" && paymentStatus === "verification_pending";
    const steps = verifying
        ? [{ ...STEPS[0], label: "Verifying" }, ...STEPS.slice(1)]
        : STEPS;

    return (
        <div className="flex items-center w-full py-2">
            {steps.map((step, idx) => {
                const isDone = idx < currentIndex;
                const isCurrent = idx === currentIndex;
                const isUpcoming = idx > currentIndex;
                const isVerifyingStep = verifying && isCurrent;
                return (
                    <div key={step.key} className={`flex items-center ${idx < steps.length - 1 ? "flex-1" : ""}`}>
                        <div className="flex flex-col items-center gap-1.5 shrink-0">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                                    isDone
                                        ? "bg-emerald-600 border-emerald-600 text-white"
                                        : isVerifyingStep
                                            ? "bg-amber-600 border-amber-500 text-white animate-pulse"
                                            : isCurrent
                                                ? "bg-red-600 border-red-500 text-white shadow-glow animate-pulse-glow"
                                                : "bg-neutral-900 border-neutral-800 text-neutral-600"
                                }`}
                            >
                                {isDone ? <Check className="w-4 h-4" /> : <step.Icon className={isUpcoming ? "w-4 h-4 opacity-50" : "w-4 h-4"} />}
                            </div>
                            <span className={`text-[9px] font-bold uppercase tracking-wider whitespace-nowrap ${isVerifyingStep ? "text-amber-400" : isCurrent ? "text-red-400" : isDone ? "text-emerald-500" : "text-neutral-600"}`}>
                                {step.label}
                            </span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className={`h-0.5 flex-1 mx-1 -mt-4 rounded ${isDone ? "bg-emerald-600" : "bg-neutral-800"}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
