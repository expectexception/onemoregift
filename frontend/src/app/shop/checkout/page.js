"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api, { mediaUrl } from "@/app/utils/apiClient";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import PayOrderModal from "@/app/components/PayOrderModal";
import { fetchSiteConfig, parseDropDays, nextDatesForDays, dropDaysLabel } from "@/app/utils/siteConfig";
import { CART_STORAGE_KEY, notifyCartUpdated } from "@/app/utils/cart";
import { useAuth } from "@/app/context/AuthContext";
import {
    ShoppingBag,
    MapPin,
    Calendar,
    Clock,
    FileText,
    CreditCard,
    ShieldCheck,
    AlertTriangle,
    Lock,
    Banknote,
    QrCode
} from "lucide-react";

// Short codes must match the backend enum exactly (model/Store.js operatingHoursSchema.day)
const WEEKDAY_CODES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function formatTodayHours(operatingHours) {
    const todayCode = WEEKDAY_CODES[new Date().getDay()];
    const today = operatingHours.find((h) => h.day === todayCode);
    if (!today) return "See store for hours";
    if (today.isClosed) return "Closed today";
    return `${today.open}–${today.close} today`;
}

// Weekly drop cycle: the pickup weekdays are admin-configured, so the selectable
// pickup dates are derived from the live config rather than a fixed Mon/Tue pair.
function getNextPickupDates(dropPickupDays) {
    return nextDatesForDays(parseDropDays(dropPickupDays, [1, 2]), 2);
}

const DEFAULT_PAY_CONFIG = {
    shopEnabled: true,
    qrPaymentEnabled: true,
    paymentGatewayEnabled: false,
    codEnabled: true,
    weeklyDropEnabled: false,
    shopPhase: "sale",
};

export default function CheckoutPage() {
    const router = useRouter();
    const { user, userAuthenticated, loadingUser } = useAuth();

    // Cart State
    const [cart, setCart] = useState([]);

    // Store State
    const [stores, setStores] = useState([]);
    const [loadingStores, setLoadingStores] = useState(true);
    const [config, setConfig] = useState(DEFAULT_PAY_CONFIG);

    // Form fields
    const [selectedStoreId, setSelectedStoreId] = useState("");
    const [pickupDate, setPickupDate] = useState("");
    const [pickupTime, setPickupTime] = useState("");
    const [customerNote, setCustomerNote] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("qr"); // 'qr' | 'online' | 'cod'

    // Checkout Flow States
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [createdOrder, setCreatedOrder] = useState(null);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);

    // Load Cart and Stores
    useEffect(() => {
        const storedCart = localStorage.getItem("omg_cart");
        if (storedCart) {
            try {
                setCart(JSON.parse(storedCart));
            } catch (e) {
                setCart([]);
            }
        }

        const fetchStores = async () => {
            try {
                const { data } = await api.get("shop/stores");
                if (!data.error) {
                    // Filter only active stores
                    const activeStores = (data.data || []).filter(s => s.isActive);
                    setStores(activeStores);
                }
            } catch (err) {
                console.error("Failed to load stores:", err);
            } finally {
                setLoadingStores(false);
            }
        };

        fetchStores();

        fetchSiteConfig()
            .then((cfg) => {
                const merged = { ...DEFAULT_PAY_CONFIG, ...cfg };
                setConfig(merged);
                // Preselect the first enabled payment method
                const first = [
                    merged.qrPaymentEnabled && "qr",
                    merged.paymentGatewayEnabled
                        && (merged.onlinePaymentReady || merged.sandboxPaymentsAllowed) && "online",
                    merged.codEnabled && "cod",
                ].filter(Boolean)[0];
                if (first) setPaymentMethod(first);
            })
            .catch(() => {});
    }, []);

    // Redirect or guard
    if (loadingUser) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col justify-between">
                <Navbar />
                <div className="flex-grow flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                </div>
                <Footer />
            </div>
        );
    }

    if (!userAuthenticated) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col justify-between">
                <Navbar />
                <div className="flex-grow flex items-center justify-center p-6">
                    <div className="max-w-md w-full bg-neutral-950 border border-neutral-900 rounded-3xl p-8 text-center space-y-6">
                        <div className="w-16 h-16 bg-red-950/30 border border-red-500/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
                            <Lock className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold">Secure Checkout</h2>
                        <p className="text-neutral-500 text-sm">
                            Please sign in or register to complete your order, track scheduled pickups, and get verification codes.
                        </p>
                        <button
                            onClick={() => router.push("/login?redirect=/shop/checkout")}
                            className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                        >
                            Sign In to Account
                        </button>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

    // Cart editing: keeps localStorage + navbar badge in sync
    const persistCart = (next) => {
        setCart(next);
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(next));
        notifyCartUpdated();
    };

    const changeQuantity = (cartKey, delta) => {
        const next = cart
            .map((item) => {
                if (item.cartKey !== cartKey) return item;
                const qty = item.quantity + delta;
                if (qty <= 0) return null;
                if (item.maxStock && qty > item.maxStock) return item;
                return { ...item, quantity: qty };
            })
            .filter(Boolean);
        persistCart(next);
    };

    const removeItem = (cartKey) => {
        persistCart(cart.filter((item) => item.cartKey !== cartKey));
    };

    const shopEnabled = config.shopEnabled !== false;
    const saleClosed = config.weeklyDropEnabled && config.shopPhase !== "sale";
    const saleDays = config.shopPhases?.sale?.days || "Fri, Sat";
    const pickupDates = getNextPickupDates(config.dropPickupDays);
    // "Pay Online" is only a real option when a gateway can actually settle the
    // payment. A sandbox provider on the live site cannot, so it stays hidden
    // instead of handing out orders that were never paid for.
    const onlinePayUsable = config.paymentGatewayEnabled
        && (config.onlinePaymentReady || config.sandboxPaymentsAllowed);
    const paymentOptions = [
        config.qrPaymentEnabled && { key: "qr", label: "Pay via UPI QR", sub: "Scan, pay & upload proof", icon: QrCode },
        onlinePayUsable && { key: "online", label: "Pay Online", sub: "Card / UPI gateway", icon: CreditCard },
        config.codEnabled && { key: "cod", label: "Cash on Pickup", sub: "Pay when you collect", icon: Banknote },
    ].filter(Boolean);

    const handleSubmitOrder = async (e) => {
        e.preventDefault();
        setErrorMsg("");

        if (!shopEnabled) {
            setErrorMsg("Shop checkout is temporarily unavailable. Please check back later.");
            return;
        }

        if (saleClosed) {
            setErrorMsg(`Orders open only during the sale window (${saleDays}).`);
            return;
        }

        if (cart.length === 0) {
            setErrorMsg("Your cart is empty.");
            return;
        }

        if (!selectedStoreId) {
            setErrorMsg("Please select a physical store location for pickup.");
            return;
        }

        if (!pickupDate || !pickupTime) {
            setErrorMsg("Please schedule a pickup date and time.");
            return;
        }

        // Validate date must be today or future
        const chosenDateTime = new Date(`${pickupDate}T${pickupTime}`);
        if (chosenDateTime < new Date()) {
            setErrorMsg("Pickup date and time cannot be in the past.");
            return;
        }

        setSubmitting(true);

        try {
            const payload = {
                items: cart.map(item => ({
                    productId: item.productId,
                    variantId: item.variant ? item.variant._id : undefined,
                    quantity: item.quantity
                })),
                pickupStoreId: selectedStoreId,
                scheduledPickupTime: chosenDateTime.toISOString(),
                customerNote,
                paymentMethod
            };

            const { data } = await api.post("shop/orders", payload, {
                meta: { auth: "user" }
            });

            if (!data.error && data.data) {
                setCreatedOrder(data.data);
                // Stock is reserved and the order exists. Clear the cart for every method
                localStorage.removeItem("omg_cart");
                setCart([]);
                if (paymentMethod === "cod") {
                    // COD order is confirmed immediately. No online payment step.
                    router.push("/shop/orders");
                } else {
                    setPaymentModalOpen(true);
                }
            } else {
                setErrorMsg(data.msg || "Failed to submit order. Please check item stock.");
            }
        } catch (err) {
            console.error(err);
            setErrorMsg(err.response?.data?.msg || "Failed to create order. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-red-900/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-red-900/5 rounded-full blur-[150px] pointer-events-none" />

            <Navbar />

            <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-28 relative z-10">
                <div className="mb-10">
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">Secure Checkout</h1>
                    <p className="text-neutral-400 text-sm">Review your selections, select your pickup hub, and pay securely.</p>
                </div>

                {!shopEnabled && (
                    <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/20 text-amber-400 text-xs flex gap-3 items-center mb-8">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                        <span>Shop checkout is temporarily unavailable. You can browse products, but orders cannot be placed right now.</span>
                    </div>
                )}

                {shopEnabled && saleClosed && (
                    <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/20 text-blue-300 text-xs flex gap-3 items-center mb-8">
                        <Clock className="w-5 h-5 flex-shrink-0" />
                        <span>
                            <strong>Sale window closed.</strong> Orders can only be placed on <strong>{saleDays}</strong>.
                            Products & prices reveal {dropDaysLabel(config, "reveal")}, and order pickups happen {dropDaysLabel(config, "pickup")}.
                        </span>
                    </div>
                )}

                {errorMsg && (
                    <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/20 text-red-400 text-xs flex gap-3 items-center mb-8">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                        <span>{errorMsg}</span>
                    </div>
                )}

                {cart.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-neutral-800 rounded-3xl bg-neutral-950/20">
                        <ShoppingBag className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-neutral-300">Your cart is empty</h3>
                        <p className="text-neutral-500 text-sm mt-1 mb-6">Choose from our exquisite collection first.</p>
                        <button
                            onClick={() => router.push("/shop")}
                            className="px-6 py-3 bg-neutral-900 border border-neutral-800 hover:bg-neutral-850 rounded-xl text-xs uppercase tracking-widest font-bold text-white transition-colors cursor-pointer"
                        >
                            Explore Shop
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Form Column */}
                        <div className="lg:col-span-7 space-y-6">
                            {/* 1. Pickup Store Selector */}
                            <div className="p-6 sm:p-8 rounded-2xl bg-neutral-950 border border-neutral-900 space-y-6">
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-red-500" />
                                    1. Choose Store Location
                                </h3>

                                {loadingStores ? (
                                    <div className="py-6 flex items-center justify-center">
                                        <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : stores.length === 0 ? (
                                    <p className="text-neutral-500 text-xs">No active store locations available. Please contact admin support.</p>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4">
                                        {stores.map((store) => (
                                            <label 
                                                key={store._id}
                                                className={`p-4 rounded-xl border flex items-start justify-between cursor-pointer transition-all ${
                                                    selectedStoreId === store._id 
                                                        ? "bg-red-950/10 border-red-600" 
                                                        : "bg-neutral-900/20 border-neutral-850 hover:border-neutral-700"
                                                }`}
                                            >
                                                <div className="flex gap-3 items-start">
                                                    <input
                                                        type="radio"
                                                        name="pickupStore"
                                                        value={store._id}
                                                        checked={selectedStoreId === store._id}
                                                        onChange={() => setSelectedStoreId(store._id)}
                                                        className="mt-1 accent-red-600 cursor-pointer"
                                                    />
                                                    <div>
                                                        <h4 className="text-sm font-bold text-white">{store.name}</h4>
                                                        <p className="text-xs text-neutral-400 mt-1">{store.address}, {store.city}</p>
                                                        {Array.isArray(store.operatingHours) && store.operatingHours.length > 0 && (
                                                            <p className="text-[10px] text-neutral-500 mt-0.5">
                                                                Hours: {formatTodayHours(store.operatingHours)}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 2. Schedule Pickup Time */}
                            <div className="p-6 sm:p-8 rounded-2xl bg-neutral-950 border border-neutral-900 space-y-6">
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-red-500" />
                                    2. Schedule Collection Time
                                </h3>

                                {config.weeklyDropEnabled && (
                                    <p className="text-[11px] text-neutral-500 -mt-2">
                                        Pickups happen on <span className="text-neutral-300 font-semibold">Monday & Tuesday</span> after the weekend sale.
                                    </p>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-400 mb-2 uppercase tracking-wider">Pickup Date</label>
                                        {config.weeklyDropEnabled ? (
                                            <select
                                                value={pickupDate}
                                                onChange={(e) => setPickupDate(e.target.value)}
                                                required
                                                className="w-full bg-neutral-900/60 border border-neutral-800 rounded-xl p-3 text-sm focus:outline-none focus:border-red-600 transition-colors"
                                            >
                                                <option value="" className="bg-black">Select pickup day...</option>
                                                {pickupDates.map((d) => (
                                                    <option key={d.toISOString()} value={d.toLocaleDateString("en-CA")} className="bg-black">
                                                        {d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type="date"
                                                value={pickupDate}
                                                min={new Date().toISOString().split("T")[0]}
                                                onChange={(e) => setPickupDate(e.target.value)}
                                                required
                                                className="w-full bg-neutral-900/60 border border-neutral-800 rounded-xl p-3 text-sm focus:outline-none focus:border-red-600 transition-colors"
                                            />
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-400 mb-2 uppercase tracking-wider">Estimated Time</label>
                                        <input
                                            type="time"
                                            value={pickupTime}
                                            onChange={(e) => setPickupTime(e.target.value)}
                                            required
                                            className="w-full bg-neutral-900/60 border border-neutral-800 rounded-xl p-3 text-sm focus:outline-none focus:border-red-600 transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 3. Customer Note */}
                            <div className="p-6 sm:p-8 rounded-2xl bg-neutral-950 border border-neutral-900 space-y-6">
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-red-500" />
                                    3. Special Instructions (Optional)
                                </h3>

                                <textarea
                                    placeholder="Add any specific instructions for store manager..."
                                    value={customerNote}
                                    onChange={(e) => setCustomerNote(e.target.value)}
                                    rows={3}
                                    className="w-full bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 text-sm focus:outline-none focus:border-red-600 transition-colors resize-none"
                                />
                            </div>
                        </div>

                        {/* Summary Column */}
                        <div className="lg:col-span-5 space-y-6">
                            <div className="p-6 sm:p-8 rounded-2xl bg-neutral-950 border border-neutral-900 space-y-6">
                                <h3 className="text-base font-bold text-white pb-4 border-b border-neutral-900">Order Summary</h3>

                                <div className="relative">
                                <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1">
                                    {cart.map((item) => (
                                        <div key={item.cartKey} className="flex justify-between items-start gap-4">
                                            <div className="flex gap-3 items-start">
                                                <div className="w-12 h-12 bg-neutral-900 rounded-lg overflow-hidden border border-neutral-850 flex-shrink-0">
                                                    {item.image ? (
                                                        <img 
                                                            src={mediaUrl(item.image)} 
                                                            alt={item.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-neutral-700 bg-neutral-900">
                                                            <ShoppingBag className="w-4 h-4" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-bold text-white line-clamp-1">{item.name}</h4>
                                                    {item.variant && (
                                                        <p className="text-[10px] text-neutral-500 mt-0.5">Option: {item.variant.name}</p>
                                                    )}
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <div className="flex items-center border border-neutral-800 rounded-lg overflow-hidden bg-neutral-900">
                                                            <button type="button" onClick={() => changeQuantity(item.cartKey, -1)}
                                                                className="px-2 py-0.5 text-neutral-400 hover:text-white hover:bg-neutral-800 text-xs cursor-pointer">−</button>
                                                            <span className="px-2 text-[11px] font-bold text-white select-none">{item.quantity}</span>
                                                            <button type="button" onClick={() => changeQuantity(item.cartKey, 1)}
                                                                className="px-2 py-0.5 text-neutral-400 hover:text-white hover:bg-neutral-800 text-xs cursor-pointer">+</button>
                                                        </div>
                                                        <button type="button" onClick={() => removeItem(item.cartKey)}
                                                            className="text-[10px] text-neutral-600 hover:text-red-400 uppercase font-bold tracking-wider transition-colors cursor-pointer">
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold text-neutral-300">₹{(item.price * item.quantity).toLocaleString("en-IN")}</span>
                                        </div>
                                    ))}
                                </div>
                                {cart.length > 3 && (
                                    <div className="pointer-events-none absolute bottom-0 left-0 right-1 h-8 bg-gradient-to-t from-neutral-950 to-transparent" />
                                )}
                                </div>

                                <div className="space-y-3 pt-4 border-t border-neutral-905">
                                    <div className="flex justify-between text-xs text-neutral-400">
                                        <span>Items count</span>
                                        <span>{cartCount} units</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-neutral-400">
                                        <span>Tax & Coordination</span>
                                        <span className="text-emerald-500">FREE</span>
                                    </div>
                                    <div className="flex justify-between items-baseline pt-2 border-t border-neutral-900">
                                        <span className="text-sm font-bold text-white">Total Amount</span>
                                        <span className="text-xl font-extrabold text-red-500">₹{subtotal.toLocaleString("en-IN")}</span>
                                    </div>
                                </div>

                                {/* Payment method selection */}
                                <div className="pt-4 border-t border-neutral-900">
                                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Payment Method</p>
                                    {paymentOptions.length === 0 ? (
                                        <p className="text-xs text-amber-400">No payment methods are enabled right now. Please try again later.</p>
                                    ) : (
                                        <div className={`grid gap-3 ${paymentOptions.length >= 3 ? "grid-cols-3" : paymentOptions.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
                                            {paymentOptions.map(({ key, label, sub, icon: Icon }) => (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => setPaymentMethod(key)}
                                                    className={`flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border text-center transition-all cursor-pointer ${paymentMethod === key
                                                        ? "border-red-500 bg-red-500/10"
                                                        : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}
                                                >
                                                    <Icon className={`w-6 h-6 ${paymentMethod === key ? "text-red-400" : "text-neutral-400"}`} />
                                                    <span className="text-xs font-semibold text-white">{label}</span>
                                                    <span className="text-[10px] text-neutral-500">{sub}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting || !shopEnabled || saleClosed || paymentOptions.length === 0}
                                    className="w-full py-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    {submitting ? "Placing Order..."
                                        : !shopEnabled ? "Checkout Unavailable"
                                        : saleClosed ? "Sale Opens Friday"
                                        : paymentMethod === "cod" ? "Place Order (Pay on Pickup)"
                                        : paymentMethod === "qr" ? "Place Order & Pay via QR"
                                        : "Place Order & Pay"}
                                </button>

                                <div className="flex justify-center items-center gap-1.5 text-[10px] text-neutral-500">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                    Secure checkout, payments verified by our team
                                </div>
                            </div>
                        </div>
                    </form>
                )}
            </main>

            <Footer />

            {/* Payment Modal: QR proof upload + optional sandbox gateway */}
            {paymentModalOpen && createdOrder && (
                <PayOrderModal
                    order={createdOrder}
                    config={config}
                    onClose={() => {
                        setPaymentModalOpen(false);
                        router.push("/shop/orders");
                    }}
                    onDone={() => {
                        setPaymentModalOpen(false);
                        router.push("/shop/orders");
                    }}
                />
            )}
        </div>
    );
}
