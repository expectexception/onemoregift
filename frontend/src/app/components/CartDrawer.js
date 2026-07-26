"use client";

import { useEffect, useRef, useCallback } from "react";
import { mediaUrl } from "@/app/utils/apiClient";
import {
    ShoppingCart, ShoppingBag, X, Plus, Minus, Trash2, ArrowRight, AlertTriangle, Lock,
} from "lucide-react";
import { EmptyCartIllustration } from "@/app/components/SVGIcons";

// Slide-over cart. Handles the things the inline version was missing: escape to
// close, a locked background so the page behind cannot scroll, focus moved into
// the panel, per-line totals and removal, stock warnings, and a disabled checkout
// while the sale window is shut.
export default function CartDrawer({
    open,
    onClose,
    items,
    onQuantityChange,
    onRemove,
    onClear,
    onCheckout,
    saleClosed = false,
    saleWindowLabel = "",
    maxQtyPerOrder = 0,
}) {
    const panelRef = useRef(null);
    const closeRef = useRef(null);

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const savings = items.reduce(
        (sum, item) => sum + Math.max(0, (item.originalPrice || item.price) - item.price) * item.quantity,
        0,
    );

    const handleKey = useCallback((e) => {
        if (e.key === "Escape") onClose();
    }, [onClose]);

    useEffect(() => {
        if (!open) return undefined;
        document.addEventListener("keydown", handleKey);
        // Stop the page behind scrolling under the drawer on mobile
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        // Move focus in so keyboard and screen reader users land in the panel
        const timer = setTimeout(() => closeRef.current?.focus(), 60);
        return () => {
            document.removeEventListener("keydown", handleKey);
            document.body.style.overflow = previous;
            clearTimeout(timer);
        };
    }, [open, handleKey]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Shopping cart">
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-[fadeIn_180ms_ease-out]"
                onClick={onClose}
            />

            <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
                <div
                    ref={panelRef}
                    className="w-screen max-w-md bg-[#0a0a0a] border-l border-white/[0.08] shadow-2xl flex flex-col animate-[slideInRight_260ms_cubic-bezier(0.22,1,0.36,1)]"
                >
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between shrink-0">
                        <h2 className="text-base font-bold text-white flex items-center gap-2.5">
                            <ShoppingCart className="w-5 h-5 text-red-500" />
                            Your cart
                            {count > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-red-600/15 border border-red-500/25 text-red-400 text-[11px] font-bold">
                                    {count}
                                </span>
                            )}
                        </h2>
                        <div className="flex items-center gap-1">
                            {items.length > 0 && (
                                <button
                                    onClick={onClear}
                                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-neutral-500 hover:text-red-400 hover:bg-white/[0.04] transition-colors"
                                >
                                    Clear
                                </button>
                            )}
                            <button
                                ref={closeRef}
                                onClick={onClose}
                                aria-label="Close cart"
                                className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {saleClosed && (
                        <div className="px-5 py-3 bg-amber-500/[0.07] border-b border-amber-500/15 flex items-start gap-2.5 shrink-0">
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-amber-100/90 leading-relaxed">
                                The sale is closed right now, so checkout is paused.
                                {saleWindowLabel ? ` Ordering opens ${saleWindowLabel}.` : ""} Your cart is saved.
                            </p>
                        </div>
                    )}

                    {/* Lines */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {items.length === 0 ? (
                            <div className="text-center py-16 space-y-4">
                                <EmptyCartIllustration className="w-24 h-24 mx-auto" />
                                <p className="text-sm font-medium text-neutral-400">Your cart is empty</p>
                                <button
                                    onClick={onClose}
                                    className="text-xs text-red-500 hover:text-red-400 tracking-wider font-bold transition-colors"
                                >
                                    BROWSE PRODUCTS
                                </button>
                            </div>
                        ) : (
                            items.map((item) => {
                                const lineTotal = item.price * item.quantity;
                                const stockCap = item.maxStock ?? Infinity;
                                const perOrderCap = maxQtyPerOrder > 0 ? maxQtyPerOrder : Infinity;
                                const cap = Math.min(stockCap, perOrderCap);
                                const atCap = item.quantity >= cap;
                                const capReason = item.quantity >= stockCap
                                    ? `Only ${item.maxStock} in stock`
                                    : `Limit ${maxQtyPerOrder} per order`;

                                return (
                                    <div
                                        key={item.cartKey}
                                        className="group flex gap-3.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-colors"
                                    >
                                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-neutral-900 border border-white/[0.06] shrink-0">
                                            {item.image ? (
                                                <img src={mediaUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-neutral-700">
                                                    <ShoppingBag className="w-6 h-6" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <h4 className="text-sm font-semibold text-white line-clamp-1">{item.name}</h4>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        {item.variant && (
                                                            <span className="text-[10px] text-red-400 font-semibold bg-red-950/25 px-1.5 py-0.5 rounded border border-red-900/30">
                                                                {item.variant.name}
                                                            </span>
                                                        )}
                                                        <span className="text-[11px] text-neutral-500">
                                                            ₹{item.price.toLocaleString("en-IN")} each
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => onRemove(item.cartKey)}
                                                    aria-label={`Remove ${item.name}`}
                                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-600 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between mt-2.5">
                                                <div className="flex items-center border border-white/[0.08] rounded-lg overflow-hidden bg-black/40">
                                                    <button
                                                        onClick={() => onQuantityChange(item.cartKey, -1)}
                                                        aria-label="Decrease quantity"
                                                        className="w-7 h-7 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                                                    >
                                                        <Minus className="w-3.5 h-3.5" />
                                                    </button>
                                                    <span className="px-2.5 text-xs font-bold text-white tabular-nums select-none">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => onQuantityChange(item.cartKey, 1)}
                                                        disabled={atCap}
                                                        aria-label="Increase quantity"
                                                        title={atCap ? capReason : undefined}
                                                        className="w-7 h-7 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                                <span className="text-sm font-bold text-white tabular-nums">
                                                    ₹{lineTotal.toLocaleString("en-IN")}
                                                </span>
                                            </div>

                                            {atCap && (
                                                <p className="text-[10px] text-amber-500/90 mt-1.5">{capReason}</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Summary */}
                    {items.length > 0 && (
                        <div className="p-5 border-t border-white/[0.06] bg-black/40 space-y-3.5 shrink-0">
                            {savings > 0 && (
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-emerald-400">You save</span>
                                    <span className="text-emerald-400 font-bold tabular-nums">
                                        ₹{savings.toLocaleString("en-IN")}
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-neutral-400">
                                    Subtotal <span className="text-neutral-600">({count} item{count === 1 ? "" : "s"})</span>
                                </span>
                                <span className="text-xl font-extrabold text-white tabular-nums">
                                    ₹{subtotal.toLocaleString("en-IN")}
                                </span>
                            </div>
                            <p className="text-[10px] text-neutral-600 leading-relaxed">
                                Collected from your chosen store. Payment is confirmed by our team before a pickup code is issued.
                            </p>
                            <button
                                onClick={onCheckout}
                                disabled={saleClosed}
                                className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors active:scale-[0.99]"
                            >
                                {saleClosed ? (
                                    <><Lock className="w-4 h-4" /> Checkout opens with the sale</>
                                ) : (
                                    <>Proceed to checkout <ArrowRight className="w-4 h-4" /></>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
