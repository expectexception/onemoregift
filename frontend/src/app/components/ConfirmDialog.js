"use client";

import { useState, useCallback } from "react";
import { AlertTriangle } from "lucide-react";

// Promise-based replacement for window.confirm() that matches the app's dark/glass aesthetic.
// Usage: const { confirm, ConfirmDialog } = useConfirm(); ... render {ConfirmDialog} once;
// const ok = await confirm({ title, description, danger: true });
export function useConfirm() {
    const [state, setState] = useState(null);

    const confirm = useCallback((opts) => {
        return new Promise((resolve) => {
            setState({ ...opts, resolve });
        });
    }, []);

    const settle = (result) => {
        state?.resolve(result);
        setState(null);
    };

    const ConfirmDialog = state ? (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in"
            onClick={() => settle(false)}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="glass-dark border border-white/10 rounded-2xl p-6 max-w-sm w-full space-y-5 animate-scale-in"
            >
                <div className="flex items-start gap-3">
                    <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                            state.danger ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-400"
                        }`}
                    >
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="pt-0.5">
                        <h3 className="text-white font-bold text-sm">{state.title || "Are you sure?"}</h3>
                        {state.description && (
                            <p className="text-neutral-400 text-xs mt-1.5 leading-relaxed">{state.description}</p>
                        )}
                    </div>
                </div>
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={() => settle(false)}
                        className="px-4 py-2 rounded-lg text-xs font-bold text-neutral-300 hover:bg-white/5 transition-all"
                    >
                        {state.cancelText || "Cancel"}
                    </button>
                    <button
                        onClick={() => settle(true)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                            state.danger
                                ? "bg-red-600 hover:bg-red-700 text-white"
                                : "bg-white text-black hover:bg-neutral-200"
                        }`}
                    >
                        {state.confirmText || "Confirm"}
                    </button>
                </div>
            </div>
        </div>
    ) : null;

    return { confirm, ConfirmDialog };
}
