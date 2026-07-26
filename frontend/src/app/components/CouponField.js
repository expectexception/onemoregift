"use client";

import { useState } from "react";
import { Tag, X, CheckCircle2, RefreshCw } from "lucide-react";
import api from "@/app/utils/apiClient";

/**
 * Coupon entry for checkout. The preview it shows comes from the server, and the
 * discount is recomputed again when the order is placed, so what is displayed here
 * is never what the customer is charged on trust alone.
 *
 * `onApplied` receives { code, discount, total } or null when the code is removed.
 */
export default function CouponField({ items, applied, onApplied, disabled = false }) {
    const [code, setCode] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const apply = async (e) => {
        e?.preventDefault();
        const value = code.trim().toUpperCase();
        if (!value) {
            setError("Enter a coupon code.");
            return;
        }
        setBusy(true);
        setError("");
        try {
            const { data } = await api.post(
                "shop/coupons/validate",
                { code: value, items },
                { meta: { auth: "user" } },
            );
            if (!data.error) {
                onApplied(data.data);
                setCode("");
            } else {
                setError(data.msg || "That code could not be applied.");
            }
        } catch (err) {
            setError(err?.response?.data?.msg || "That code could not be applied.");
        } finally {
            setBusy(false);
        }
    };

    if (applied) {
        return (
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-emerald-600/10 border border-emerald-500/25">
                <div className="flex items-center gap-2.5 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                        <div className="text-xs font-bold text-emerald-300 font-mono">{applied.code}</div>
                        <div className="text-[11px] text-emerald-400/80">
                            You save ₹{Number(applied.discount).toLocaleString("en-IN")}
                        </div>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => onApplied(null)}
                    className="text-[11px] font-bold text-neutral-400 hover:text-red-400 transition-colors flex items-center gap-1 shrink-0"
                >
                    <X className="w-3.5 h-3.5" />
                    Remove
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 pointer-events-none" />
                    <input
                        value={code}
                        onChange={(e) => { setCode(e.target.value.toUpperCase()); if (error) setError(""); }}
                        onKeyDown={(e) => { if (e.key === "Enter") apply(e); }}
                        disabled={disabled || busy}
                        placeholder="Coupon code"
                        aria-label="Coupon code"
                        className="w-full h-11 pl-9 pr-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm font-mono uppercase placeholder:font-sans placeholder:normal-case placeholder:text-neutral-600 focus:outline-none focus:border-red-500/50 disabled:opacity-50"
                    />
                </div>
                <button
                    type="button"
                    onClick={apply}
                    disabled={disabled || busy || !code.trim()}
                    className="h-11 px-5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white text-xs font-bold hover:bg-white/[0.12] disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                >
                    {busy ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Apply"}
                </button>
            </div>
            {error && <p className="text-[11px] text-red-400 pl-1">{error}</p>}
        </div>
    );
}
