"use client";

import { useState } from "react";
import { Bell, CheckCircle2 } from "lucide-react";
import api from "@/app/utils/apiClient";

/**
 * Captures interest while the shop is shut. Deliberately works for signed-out
 * visitors, because the reveal window is when people are most interested and
 * least willing to make an account.
 *
 * Pass a productId to register for a specific item coming back in stock.
 */
export default function NotifyMeForm({ productId = null, compact = false, label }) {
    const [email, setEmail] = useState("");
    const [state, setState] = useState("idle"); // idle | sending | done | error
    const [message, setMessage] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        const value = email.trim();
        if (!/^\S+@\S+\.\S+$/.test(value)) {
            setState("error");
            setMessage("Please enter a valid email address.");
            return;
        }

        setState("sending");
        try {
            const { data } = await api.post("shop/notify-me", { email: value, productId });
            if (!data.error) {
                setState("done");
                setMessage(data.msg || "You are on the list.");
            } else {
                setState("error");
                setMessage(data.msg || "Could not add you to the list.");
            }
        } catch (err) {
            setState("error");
            setMessage(err?.response?.data?.msg || "Could not add you to the list. Please try again.");
        }
    };

    if (state === "done") {
        return (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-600/10 border border-emerald-500/25 text-emerald-300 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{message}</span>
            </div>
        );
    }

    return (
        <form onSubmit={submit} className={compact ? "space-y-2" : "space-y-3"}>
            {!compact && (
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-400">
                    <Bell className="w-3.5 h-3.5" />
                    {label || "Get notified"}
                </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (state === "error") setState("idle"); }}
                    placeholder="you@email.com"
                    aria-label="Email address for drop notifications"
                    className="flex-1 h-11 px-4 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-red-500/50"
                />
                <button
                    type="submit"
                    disabled={state === "sending"}
                    className="h-11 px-5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap"
                >
                    {state === "sending" ? "Adding..." : "Notify me"}
                </button>
            </div>
            {state === "error" && <p className="text-[11px] text-red-400">{message}</p>}
            {state !== "error" && !compact && (
                <p className="text-[11px] text-neutral-600">
                    One email when the drop opens. No spam.
                </p>
            )}
        </form>
    );
}
