"use client";

import { useState } from "react";
import api, { mediaUrl } from "@/app/utils/apiClient";
import UpiQr from "./UpiQr";
import { useToast } from "@/hooks/use-toast";
import {
    QrCode,
    Upload,
    Copy,
    CreditCard,
    CheckCircle2,
    AlertTriangle,
    X,
    MessageCircle,
    ShieldCheck,
} from "lucide-react";

// Payment modal for an already-created order.
// - QR/UPI mode: show QR + UPI ID + WhatsApp number, user uploads payment
//   screenshot(s) as proof → admin verifies → order confirmed.
// - Gateway mode (only when paymentGatewayEnabled): sandbox simulator.
export default function PayOrderModal({ order, config, onClose, onDone }) {
    const { toast } = useToast();

    const [proofs, setProofs] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [reference, setReference] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const [gatewayProcessing, setGatewayProcessing] = useState(false);
    const [gatewayResult, setGatewayResult] = useState(null); // 'success' | 'failed'

    const orderRef = order.orderNumber || order._id;
    const qrEnabled = config?.qrPaymentEnabled !== false;
    const gatewayEnabled = config?.paymentGatewayEnabled === true;

    const upiId = (config?.paymentUpiId || "").trim();
    const payeeName = (config?.paymentPayeeName || "OneMoreGift").trim();
    const whatsapp = (config?.paymentWhatsapp || "").replace(/\D/g, "");

    const upiLink = upiId
        ? `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${order.total}&cu=INR&tn=${encodeURIComponent(`Order ${orderRef}`)}`
        : "";

    const uploadedQr = config?.paymentQrImage ? mediaUrl(config.paymentQrImage) : "";
    const hasQr = Boolean(uploadedQr || upiLink);

    const waLink = whatsapp
        ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hi! I placed order ${orderRef} (₹${order.total}). Sharing my payment screenshot.`)}`
        : "";

    const copyUpi = async () => {
        try {
            await navigator.clipboard.writeText(upiId);
            toast({ title: "UPI ID copied" });
        } catch (_) {}
    };

    const handleProofUpload = async (e) => {
        if (!e.target.files?.length) return;
        setUploading(true);
        const formData = new FormData();
        Array.from(e.target.files).forEach(file => formData.append("images", file));
        try {
            const { data } = await api.post("upload/user-multiple", formData, {
                headers: { "Content-Type": "multipart/form-data" },
                meta: { auth: "user" },
            });
            if (!data.error) {
                setProofs(prev => [...prev, ...data.urls].slice(0, 5));
            } else {
                toast({ title: "Upload failed", description: data.msg, variant: "destructive" });
            }
        } catch (err) {
            toast({ title: "Upload failed", description: err?.response?.data?.msg || "Could not upload screenshot", variant: "destructive" });
        }
        setUploading(false);
        e.target.value = "";
    };

    const handleSubmitProof = async () => {
        if (!proofs.length) {
            toast({ title: "Screenshot required", description: "Please upload your payment screenshot first.", variant: "destructive" });
            return;
        }
        setSubmitting(true);
        try {
            const { data } = await api.post(`shop/orders/${order._id}/payment-proof`, {
                proofs,
                reference,
            }, { meta: { auth: "user" } });
            if (!data.error) {
                setSubmitted(true);
                toast({ title: "Proof submitted", description: "We will verify your payment and confirm the order shortly." });
                setTimeout(() => { onDone?.(); }, 1800);
            } else {
                toast({ title: "Failed", description: data.msg, variant: "destructive" });
            }
        } catch (err) {
            toast({ title: "Error", description: err?.response?.data?.msg || "Failed to submit proof", variant: "destructive" });
        }
        setSubmitting(false);
    };

    const handleSimulatePayment = async (success) => {
        setGatewayProcessing(true);
        try {
            const { data } = await api.post("shop/orders/simulate-payment", {
                orderId: order._id,
                success,
            }, { meta: { auth: "user" } });
            if (!data.error) {
                setGatewayResult(success ? "success" : "failed");
                setTimeout(() => { onDone?.(); }, success ? 1800 : 1500);
            } else {
                toast({ title: "Gateway error", description: data.msg, variant: "destructive" });
            }
        } catch (err) {
            toast({ title: "Gateway error", description: err?.response?.data?.msg || "Payment failed", variant: "destructive" });
        }
        setGatewayProcessing(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

            <div className="bg-neutral-950 border border-neutral-800 rounded-3xl max-w-md w-full p-6 sm:p-8 relative z-10 space-y-6 shadow-2xl animate-scale-in max-h-[92vh] overflow-y-auto">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <QrCode className="w-5 h-5 text-red-500" /> Complete Payment
                        </h3>
                        <p className="text-xs text-neutral-400 mt-1">
                            Order <span className="font-mono text-neutral-200">{orderRef}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="text-neutral-500 hover:text-white p-1 cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="py-3 border-y border-neutral-900 text-center">
                    <p className="text-xs text-neutral-500">Amount Payable</p>
                    <p className="text-3xl font-extrabold text-white">₹{order.total.toLocaleString("en-IN")}</p>
                </div>

                {submitted ? (
                    <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 text-xs flex gap-3 items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                        <span className="font-bold">Proof submitted! We&apos;ll verify and confirm your order.</span>
                    </div>
                ) : gatewayResult === "success" ? (
                    <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 text-xs flex gap-3 items-center justify-center animate-pulse">
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                        <span className="font-bold">Payment Approved! Redirecting...</span>
                    </div>
                ) : gatewayResult === "failed" ? (
                    <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/20 text-red-400 text-xs flex gap-3 items-center justify-center">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                        <span className="font-bold">Payment failed. You can retry from My Orders.</span>
                    </div>
                ) : (
                    <>
                        {qrEnabled && (
                            <div className="space-y-4">
                                {/* QR code */}
                                {hasQr ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="bg-white p-2.5 rounded-2xl">
                                            {uploadedQr ? (
                                                <img src={uploadedQr} alt="Payment QR code" className="w-48 h-48 object-contain" />
                                            ) : (
                                                <UpiQr value={upiLink} size={192} className="w-48 h-48" />
                                            )}
                                        </div>
                                        <p className="text-[10px] text-neutral-500">Scan with any UPI app (GPay / PhonePe / Paytm)</p>
                                    </div>
                                ) : (
                                    <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 text-amber-400 text-[11px] text-center">
                                        Payment QR is not configured yet. Please pay via the WhatsApp number below and upload your proof.
                                    </div>
                                )}

                                {upiId && (
                                    <button onClick={copyUpi} type="button"
                                        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/25 transition-all cursor-pointer">
                                        <span className="text-xs text-neutral-300 font-mono">{upiId}</span>
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 uppercase"><Copy className="w-3.5 h-3.5" /> Copy</span>
                                    </button>
                                )}

                                <p className="text-[11px] text-neutral-400 leading-relaxed text-center">
                                    {config?.paymentInstructions || "Pay on the QR, then upload your payment screenshot below. We verify and confirm your order."}
                                </p>

                                {waLink && (
                                    <a href={waLink} target="_blank" rel="noopener noreferrer"
                                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:bg-emerald-600/25 transition-all">
                                        <MessageCircle className="w-4 h-4" />
                                        Send screenshot on WhatsApp
                                    </a>
                                )}

                                {/* Proof upload */}
                                <div className="space-y-2">
                                    <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-white/10 border-dashed rounded-xl cursor-pointer bg-white/[0.01] hover:bg-white/[0.03] transition-all">
                                        <div className="flex items-center gap-2">
                                            <Upload className={`w-4 h-4 ${uploading ? "animate-bounce text-red-400" : "text-neutral-500"}`} />
                                            <span className="text-xs text-neutral-400">{uploading ? "Uploading..." : "Upload payment screenshot *"}</span>
                                        </div>
                                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleProofUpload} disabled={uploading} />
                                    </label>

                                    {proofs.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {proofs.map((url, idx) => (
                                                <div key={idx} className="relative w-14 h-14 rounded-lg border border-white/10 overflow-hidden bg-neutral-900">
                                                    <img src={mediaUrl(url)} alt="" className="w-full h-full object-cover" />
                                                    <button type="button" onClick={() => setProofs(prev => prev.filter((_, i) => i !== idx))}
                                                        className="absolute top-0 right-0 bg-black/80 text-[9px] px-1 text-white hover:text-red-400 cursor-pointer">✕</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <input
                                        type="text"
                                        value={reference}
                                        onChange={(e) => setReference(e.target.value)}
                                        placeholder="UPI Transaction ID (optional)"
                                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-red-500/50 text-white placeholder:text-neutral-600"
                                    />

                                    <button
                                        onClick={handleSubmitProof}
                                        disabled={submitting || uploading || !proofs.length}
                                        className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        {submitting ? "Submitting..." : "I Have Paid, Submit Proof"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {gatewayEnabled && (
                            <div className="space-y-3 pt-4 border-t border-neutral-900">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 text-center flex items-center justify-center gap-1.5">
                                    <CreditCard className="w-3.5 h-3.5" /> {qrEnabled ? "Or pay via gateway" : "Pay via gateway"} (sandbox)
                                </p>
                                <button
                                    onClick={() => handleSimulatePayment(true)}
                                    disabled={gatewayProcessing}
                                    className="w-full py-3 bg-neutral-100 hover:bg-white text-black rounded-xl text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-40 cursor-pointer"
                                >
                                    {gatewayProcessing ? "Authorizing..." : "Simulate Success (Pay)"}
                                </button>
                                <button
                                    onClick={() => handleSimulatePayment(false)}
                                    disabled={gatewayProcessing}
                                    className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-40 cursor-pointer"
                                >
                                    Simulate Failure
                                </button>
                            </div>
                        )}

                        {!qrEnabled && !gatewayEnabled && (
                            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/20 text-amber-400 text-xs text-center">
                                Online payments are currently disabled. Your order will stay pending. Please contact support.
                            </div>
                        )}
                    </>
                )}

                <div className="flex justify-center items-center gap-1.5 text-[10px] text-neutral-500">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    Payments are manually verified by our team before pickup codes are issued.
                </div>
            </div>
        </div>
    );
}
