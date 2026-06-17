"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/app/utils/apiClient";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { useAuth } from "@/app/context/AuthContext";
import { 
    ShoppingBag, 
    Calendar, 
    MapPin, 
    QrCode, 
    AlertTriangle, 
    XCircle, 
    CheckCircle2, 
    Clock, 
    HelpCircle,
    CreditCard
} from "lucide-react";

export default function MyOrdersPage() {
    const router = useRouter();
    const { user, userAuthenticated, loadingUser } = useAuth();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");

    // Payment Retry Modal States
    const [retryOrder, setRetryOrder] = useState(null);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [paymentProcessing, setPaymentProcessing] = useState(false);

    // Fetch user's orders
    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get("shop/orders", {
                meta: { auth: "user" }
            });
            if (!data.error) {
                setOrders(data.data || []);
            }
        } catch (err) {
            console.error("Failed to load orders:", err);
            setErrorMsg("Failed to retrieve order history.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!loadingUser && userAuthenticated) {
            fetchOrders();
        }
    }, [loadingUser, userAuthenticated, fetchOrders]);

    // Cancel order handler
    const handleCancelOrder = async (orderId) => {
        if (!confirm("Are you sure you want to cancel this order? Stock will be restored.")) return;
        
        try {
            const { data } = await api.patch(`shop/orders/${orderId}/cancel`, {}, {
                meta: { auth: "user" }
            });
            if (!data.error) {
                alert("Order cancelled successfully.");
                fetchOrders();
            } else {
                alert(data.msg || "Failed to cancel order.");
            }
        } catch (err) {
            console.error(err);
            alert("Error cancelling order.");
        }
    };

    // Retry payment handler
    const handleRetryPayment = async (success) => {
        if (!retryOrder) return;
        setPaymentProcessing(true);

        try {
            const { data } = await api.post("shop/orders/simulate-payment", {
                orderId: retryOrder._id,
                success
            }, {
                meta: { auth: "user" }
            });

            if (!data.error) {
                if (success) {
                    alert("Payment simulation successful! Order paid.");
                } else {
                    alert("Payment simulation marked failed.");
                }
                setPaymentModalOpen(false);
                setRetryOrder(null);
                fetchOrders();
            } else {
                alert("Simulation API failed.");
            }
        } catch (err) {
            console.error(err);
            alert("Payment simulation error.");
        } finally {
            setPaymentProcessing(false);
        }
    };

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
                <div className="flex-grow flex flex-col items-center justify-center p-6">
                    <div className="max-w-md w-full bg-neutral-950 border border-neutral-900 rounded-3xl p-8 text-center space-y-6">
                        <ShoppingBag className="w-16 h-16 text-neutral-700 mx-auto" />
                        <h2 className="text-xl font-bold">Access Your Orders</h2>
                        <p className="text-neutral-500 text-sm">Please log in to view order receipts, pick up QR codes, and tracking information.</p>
                        <button
                            onClick={() => router.push("/login?redirect=/shop/orders")}
                            className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                        >
                            Sign In
                        </button>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    const getStatusStyles = (status) => {
        switch (status) {
            case "pending":
                return "bg-amber-950/20 text-amber-500 border-amber-900/30";
            case "paid":
                return "bg-blue-950/20 text-blue-500 border-blue-900/30";
            case "ready":
                return "bg-indigo-950/20 text-indigo-500 border-indigo-900/30";
            case "collected":
                return "bg-emerald-950/20 text-emerald-500 border-emerald-900/30";
            case "cancelled":
                return "bg-neutral-900/50 text-neutral-500 border-neutral-800";
            case "refunded":
                return "bg-purple-950/20 text-purple-500 border-purple-900/30";
            default:
                return "bg-neutral-900 text-neutral-400 border-neutral-800";
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-red-900/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-red-900/5 rounded-full blur-[150px] pointer-events-none" />

            <Navbar />

            <main className="flex-grow max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-28 relative z-10">
                <div className="mb-12">
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">My Orders & Pickups</h1>
                    <p className="text-neutral-400 text-sm">Track active statuses, view scheduled time slots, and verify collection codes.</p>
                </div>

                {errorMsg && (
                    <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/20 text-red-400 text-xs flex gap-3 items-center mb-8">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                        <span>{errorMsg}</span>
                    </div>
                )}

                {loading ? (
                    <div className="space-y-6">
                        {[1, 2].map((n) => (
                            <div key={n} className="rounded-2xl border border-neutral-900 bg-neutral-950/40 p-6 sm:p-8 animate-pulse space-y-4 h-64" />
                        ))}
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-neutral-800 rounded-3xl bg-neutral-950/20">
                        <ShoppingBag className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-neutral-300">No orders found</h3>
                        <p className="text-neutral-500 text-sm mt-1 mb-6">You haven&apos;t made any purchases or claims yet.</p>
                        <button
                            onClick={() => router.push("/shop")}
                            className="px-6 py-3 bg-neutral-900 border border-neutral-800 hover:bg-neutral-850 rounded-xl text-xs uppercase tracking-widest font-bold text-white transition-colors cursor-pointer"
                        >
                            Visit Shop
                        </button>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {orders.map((order) => {
                            const isCancelable = ["pending", "paid"].includes(order.status);
                            const hasQR = ["paid", "ready"].includes(order.status) && order.pickupCode;

                            return (
                                <div key={order._id} className="premium-card rounded-3xl border border-neutral-900 bg-neutral-950 overflow-hidden flex flex-col">
                                    {/* Order Head info */}
                                    <div className="px-6 py-5 sm:px-8 border-b border-neutral-900 bg-neutral-950/80 flex flex-wrap gap-4 items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Order Reference</p>
                                            <h3 className="text-sm sm:text-base font-bold text-white font-mono uppercase">
                                                #{order.orderSerialNumber || order._id.slice(-8)}
                                            </h3>
                                        </div>

                                        <div className="flex flex-wrap gap-4 items-center">
                                            <div className="text-left sm:text-right">
                                                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Placed On</p>
                                                <p className="text-xs font-semibold text-neutral-300">
                                                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                                                        year: 'numeric', month: 'long', day: 'numeric'
                                                    })}
                                                </p>
                                            </div>

                                            <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase border tracking-wider ${getStatusStyles(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Order items grid list */}
                                    <div className="p-6 sm:p-8 flex flex-col md:flex-row gap-8 justify-between items-start">
                                        {/* Left part: details & items */}
                                        <div className="w-full md:flex-grow space-y-6">
                                            <div className="space-y-4">
                                                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Ordered Items</h4>
                                                <div className="space-y-3">
                                                    {order.items.map((item, index) => (
                                                        <div key={index} className="flex justify-between items-center bg-neutral-900/20 border border-neutral-900 rounded-xl p-3.5">
                                                            <div>
                                                                <h5 className="text-sm font-bold text-white">{item.productName}</h5>
                                                                <p className="text-xs text-neutral-500 mt-0.5">
                                                                    Qty: {item.quantity} {item.variantName && `| Option: ${item.variantName}`}
                                                                </p>
                                                            </div>
                                                            <span className="text-sm font-extrabold text-neutral-300">₹{(item.unitPrice * item.quantity).toLocaleString("en-IN")}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Store Info & Pickup Time */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-neutral-900/30 border border-neutral-900/60 rounded-2xl p-5">
                                                <div className="space-y-2">
                                                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
                                                        <MapPin className="w-3.5 h-3.5 text-red-500" />
                                                        Pickup Location
                                                    </span>
                                                    <div className="text-xs space-y-0.5">
                                                        <h5 className="font-bold text-neutral-200">{order.pickupStoreId?.name || "Physical Store"}</h5>
                                                        <p className="text-neutral-400">{order.pickupStoreId?.address || "Address details loading..."}</p>
                                                        <p className="text-neutral-500">{order.pickupStoreId?.city}</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
                                                        <Calendar className="w-3.5 h-3.5 text-red-500" />
                                                        Scheduled Time
                                                    </span>
                                                    <div className="text-xs space-y-0.5">
                                                        <p className="font-bold text-neutral-200">
                                                            {order.scheduledPickupTime 
                                                                ? new Date(order.scheduledPickupTime).toLocaleDateString("en-IN", {
                                                                    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                                                                })
                                                                : "Not scheduled"
                                                            }
                                                        </p>
                                                        <p className="text-neutral-400">
                                                            {order.scheduledPickupTime 
                                                                ? new Date(order.scheduledPickupTime).toLocaleTimeString("en-IN", {
                                                                    hour: '2-digit', minute: '2-digit'
                                                                })
                                                                : ""
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right part: Action / QR code box */}
                                        <div className="w-full md:w-64 bg-neutral-900/40 border border-neutral-900 rounded-2xl p-5 flex flex-col items-center justify-between self-stretch text-center">
                                            {hasQR ? (
                                                <div className="space-y-4 w-full flex flex-col items-center">
                                                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                                                        <QrCode className="w-3.5 h-3.5" />
                                                        Verification Code
                                                    </span>
                                                    
                                                    {/* QR Code Graphic using qrserver */}
                                                    <div className="bg-white p-2 rounded-xl border border-neutral-800 flex items-center justify-center">
                                                        <img 
                                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${order.pickupCode}`} 
                                                            alt="Pickup Verification QR Code" 
                                                            className="w-28 h-28"
                                                        />
                                                    </div>

                                                    <div>
                                                        <p className="text-xs font-mono font-bold tracking-widest text-white">{order.pickupCode}</p>
                                                        <p className="text-[9px] text-neutral-500 mt-2 leading-relaxed">
                                                            Show this secure QR code at storefront collection point to claim items.
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-4 w-full flex flex-col items-center justify-center py-6">
                                                    {order.status === "pending" ? (
                                                        <>
                                                            <div className="w-10 h-10 bg-amber-950/20 text-amber-500 rounded-full flex items-center justify-center">
                                                                <Clock className="w-5 h-5 animate-pulse" />
                                                            </div>
                                                            <div>
                                                                <h5 className="text-xs font-bold text-neutral-300">Awaiting Payment</h5>
                                                                <p className="text-[10px] text-neutral-500 mt-1 leading-normal">
                                                                    Complete your sandbox payment simulation to generate collection codes.
                                                                </p>
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    setRetryOrder(order);
                                                                    setPaymentModalOpen(true);
                                                                }}
                                                                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-black text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer"
                                                            >
                                                                Pay Now
                                                            </button>
                                                        </>
                                                    ) : order.status === "cancelled" ? (
                                                        <>
                                                            <div className="w-10 h-10 bg-neutral-800 text-neutral-500 rounded-full flex items-center justify-center">
                                                                <XCircle className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <h5 className="text-xs font-bold text-neutral-400">Order Cancelled</h5>
                                                                <p className="text-[10px] text-neutral-500 mt-1">
                                                                    Cancelled at {order.cancelledAt ? new Date(order.cancelledAt).toLocaleDateString() : ""}
                                                                </p>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="w-10 h-10 bg-neutral-800 text-neutral-500 rounded-full flex items-center justify-center">
                                                                <HelpCircle className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <h5 className="text-xs font-bold text-neutral-300">Order Logged</h5>
                                                                <p className="text-[10px] text-neutral-500 mt-1">Status details or updates are pending.</p>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )}

                                            {/* Action buttons (e.g. Cancel order) */}
                                            {isCancelable && (
                                                <button
                                                    onClick={() => handleCancelOrder(order._id)}
                                                    className="text-[10px] font-bold text-neutral-500 hover:text-red-500 uppercase tracking-widest mt-4 border-t border-neutral-850 pt-3 w-full transition-colors cursor-pointer"
                                                >
                                                    Cancel Order
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Order subtotal footer */}
                                    <div className="px-6 py-4 bg-neutral-950/40 border-t border-neutral-900 flex justify-between items-center text-xs">
                                        <span className="text-neutral-500 font-medium">Grand Total</span>
                                        <span className="text-sm font-extrabold text-red-500">₹{order.total.toLocaleString("en-IN")}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            <Footer />

            {/* Sandbox Payment Simulator Modal */}
            {paymentModalOpen && retryOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setPaymentModalOpen(false)} />
                    <div className="bg-neutral-950 border border-neutral-800 rounded-3xl max-w-md w-full p-8 relative z-10 text-center space-y-6 shadow-2xl animate-scale-in">
                        <div className="w-12 h-12 bg-red-950/30 border border-red-500/20 text-red-500 rounded-xl flex items-center justify-center mx-auto">
                            <CreditCard className="w-6 h-6" />
                        </div>

                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-red-500 bg-red-950/20 px-2 py-0.5 rounded border border-red-900/30">
                                Sandbox Retry Gateway
                            </span>
                            <h3 className="text-xl font-bold mt-3 text-white">Retry Payment</h3>
                            <p className="text-xs text-neutral-400 mt-1 font-mono">
                                Order #{retryOrder.orderSerialNumber || retryOrder._id}
                            </p>
                        </div>

                        <div className="py-4 border-y border-neutral-900 my-2">
                            <p className="text-xs text-neutral-500">Amount Payable</p>
                            <p className="text-3xl font-extrabold text-white">₹{retryOrder.total.toLocaleString("en-IN")}</p>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => handleRetryPayment(true)}
                                disabled={paymentProcessing}
                                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                            >
                                {paymentProcessing ? "Authorizing..." : "Simulate Success (Pay)"}
                            </button>
                            <button
                                onClick={() => handleRetryPayment(false)}
                                disabled={paymentProcessing}
                                className="w-full py-3 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                            >
                                Simulate Failure
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
