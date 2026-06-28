"use client";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/app/utils/apiClient";
import withAdminAuth from "@/app/components/withAdminAuth";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/app/components/ConfirmDialog";
import { EmptyTimelineIllustration } from "@/app/components/SVGIcons";
import { Package, Search, Eye, CheckCircle, QrCode } from "lucide-react";

const STATUS_COLORS = {
    pending: "bg-neutral-800 text-neutral-400",
    paid: "bg-blue-500/10 text-blue-400",
    ready_for_pickup: "bg-yellow-500/10 text-yellow-400",
    collected: "bg-green-500/10 text-green-400",
    cancelled: "bg-red-500/10 text-red-400",
    refunded: "bg-orange-500/10 text-orange-400",
};

const STATUS_OPTIONS = ["", "pending", "paid", "ready_for_pickup", "collected", "cancelled", "refunded"];

function OrdersAdminPage() {
    const { toast } = useToast();
    const { confirm, ConfirmDialog } = useConfirm();
    const searchParams = useSearchParams();
    const [orders, setOrders] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState("");
    const [search, setSearch] = useState(searchParams.get("search") || "");
    const [stats, setStats] = useState({});
    const [selected, setSelected] = useState(null);
    const [newStatus, setNewStatus] = useState("");
    const [adminNote, setAdminNote] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [pickupCode, setPickupCode] = useState("");
    const [refundReason, setRefundReason] = useState("");
    const limit = 15;

    const fetchStats = useCallback(async () => {
        try {
            const { data } = await api.get("admin/orders/stats", { meta: { auth: "admin" } });
            if (!data.error) setStats(data.data || {});
        } catch (_) {}
    }, []);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit };
            if (status) params.status = status;
            if (search) params.search = search;
            const { data } = await api.get("admin/orders", { params, meta: { auth: "admin" } });
            if (!data.error) { setOrders(data.data || []); setTotal(data.total || 0); }
        } catch (_) {}
        setLoading(false);
    }, [page, status, search]);

    useEffect(() => { fetchStats(); }, [fetchStats]);
    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const handleStatusUpdate = async () => {
        if (!selected || !newStatus) return;
        setActionLoading(true);
        try {
            await api.patch(`admin/orders/${selected._id}/status`, { status: newStatus, adminNote }, { meta: { auth: "admin" } });
            toast({ title: "Order updated", description: `Status set to "${newStatus.replace(/_/g, " ")}".` });
            setSelected(null);
            fetchOrders(); fetchStats();
        } catch (err) {
            toast({ title: "Update failed", description: err?.response?.data?.msg, variant: "destructive" });
        }
        setActionLoading(false);
    };

    const handleVerifyPickup = async () => {
        if (!selected) return;
        setActionLoading(true);
        try {
            await api.post(`admin/orders/${selected._id}/verify-pickup`, { pickupCode }, { meta: { auth: "admin" } });
            toast({ title: "Pickup verified", description: "Order marked as collected." });
            setSelected(null);
            fetchOrders(); fetchStats();
        } catch (err) {
            toast({ title: "Invalid pickup code", description: err?.response?.data?.msg, variant: "destructive" });
        }
        setActionLoading(false);
    };

    const handleRefund = async () => {
        if (!selected) return;
        const ok = await confirm({ title: "Process refund?", description: "This will mark the order as refunded.", confirmText: "Refund", danger: true });
        if (!ok) return;
        setActionLoading(true);
        try {
            await api.post(`admin/orders/${selected._id}/refund`, { reason: refundReason }, { meta: { auth: "admin" } });
            toast({ title: "Refund processed" });
            setSelected(null);
            fetchOrders(); fetchStats();
        } catch (err) {
            toast({ title: "Refund failed", description: err?.response?.data?.msg, variant: "destructive" });
        }
        setActionLoading(false);
    };

    return (
        <div className="p-6 min-h-screen bg-black text-white">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                        <Package className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Orders</h1>
                        <p className="text-sm text-neutral-500">Manage shop orders and pickups</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: "Total Orders", value: stats.total || 0, color: "text-white" },
                        { label: "Pending Pickup", value: stats.ready_for_pickup || 0, color: "text-yellow-400" },
                        { label: "Collected", value: stats.collected || 0, color: "text-green-400" },
                        { label: "Revenue", value: `₹${(stats.revenue || 0).toLocaleString("en-IN")}`, color: "text-blue-400" },
                    ].map(s => (
                        <div key={s.label} className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
                            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                            <div className="text-xs text-neutral-500 mt-1">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3 mb-6">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                        <input className="w-full bg-white/[0.04] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none"
                            placeholder="Search order number..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                    </div>
                    <select className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                        value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
                        {STATUS_OPTIONS.map(s => <option key={s} value={s} className="bg-black">{s || "All Statuses"}</option>)}
                    </select>
                </div>

                {/* Table */}
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    {["Order #", "Customer", "Items", "Total", "Payment", "Status", "Date", "Actions"].map(h => (
                                        <th key={h} className="text-left px-4 py-3 text-xs text-neutral-500 font-medium uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={8} className="text-center py-12 text-neutral-500">Loading...</td></tr>
                                ) : orders.length === 0 ? (
                                    <tr><td colSpan={8} className="text-center py-12">
                                        <EmptyTimelineIllustration className="w-20 h-20 mx-auto mb-2" />
                                        <p className="text-neutral-500 text-sm">No orders found</p>
                                    </td></tr>
                                ) : orders.map(o => (
                                    <tr key={o._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                        <td className="px-4 py-3 text-sm text-white font-mono">{o.orderNumber}</td>
                                        <td className="px-4 py-3 text-sm text-neutral-400">{o.userId?.name || "—"}</td>
                                        <td className="px-4 py-3 text-sm text-neutral-400">{o.items?.length || 0}</td>
                                        <td className="px-4 py-3 text-sm text-white">₹{o.total?.toLocaleString("en-IN")}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-1 rounded-full ${o.paymentStatus === "paid" ? "bg-green-500/10 text-green-400" : "bg-neutral-800 text-neutral-400"}`}>
                                                {o.paymentStatus}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-1 rounded-full capitalize ${STATUS_COLORS[o.status] || "bg-neutral-800 text-neutral-400"}`}>
                                                {o.status?.replace(/_/g, " ")}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-neutral-500">{new Date(o.createdAt).toLocaleDateString("en-IN")}</td>
                                        <td className="px-4 py-3">
                                            <button onClick={() => { setSelected(o); setNewStatus(o.status); setAdminNote(o.adminNote || ""); setPickupCode(""); setRefundReason(""); }}
                                                className="text-xs px-3 py-1.5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-lg text-white transition-colors flex items-center gap-1">
                                                <Eye className="w-3 h-3" /> Manage
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
                        <span className="text-xs text-neutral-500">{total} total orders</span>
                        <div className="flex gap-2">
                            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="text-xs px-3 py-1 bg-white/[0.04] border border-white/10 rounded-lg text-white disabled:opacity-40">Prev</button>
                            <button disabled={page * limit >= total} onClick={() => setPage(p => p + 1)} className="text-xs px-3 py-1 bg-white/[0.04] border border-white/10 rounded-lg text-white disabled:opacity-40">Next</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Order Manage Modal */}
            {selected && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Manage Order</h2>
                                    <p className="text-sm text-neutral-500 font-mono">{selected.orderNumber}</p>
                                </div>
                                <button onClick={() => setSelected(null)} className="text-neutral-500 hover:text-white">✕</button>
                            </div>

                            <div className="space-y-2 mb-6">
                                {[
                                    { label: "Customer", value: selected.userId?.name },
                                    { label: "Total", value: `₹${selected.total?.toLocaleString("en-IN")}` },
                                    { label: "Payment", value: selected.paymentStatus },
                                    { label: "Pickup Store", value: selected.pickupStoreId?.name || "—" },
                                    { label: "Pickup Code", value: selected.pickupCode || "—" },
                                ].map(r => (
                                    <div key={r.label} className="flex justify-between text-sm">
                                        <span className="text-neutral-500">{r.label}</span>
                                        <span className="text-white">{r.value || "—"}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Status Update */}
                            <div className="space-y-3 mb-4">
                                <h3 className="text-sm font-semibold text-white">Update Status</h3>
                                <select className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                                    value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                                    {STATUS_OPTIONS.filter(Boolean).map(s => <option key={s} value={s} className="bg-black capitalize">{s.replace(/_/g, " ")}</option>)}
                                </select>
                                <textarea className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none resize-none" rows={2}
                                    placeholder="Admin note..." value={adminNote} onChange={e => setAdminNote(e.target.value)} />
                                <button onClick={handleStatusUpdate} disabled={actionLoading}
                                    className="w-full py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl disabled:opacity-60">
                                    {actionLoading ? "Updating..." : "Update Status"}
                                </button>
                            </div>

                            {/* Pickup Verification */}
                            {selected.status === "ready_for_pickup" && (
                                <div className="border-t border-white/10 pt-4 space-y-3">
                                    <h3 className="text-sm font-semibold text-white flex items-center gap-2"><QrCode className="w-4 h-4" /> Verify Pickup</h3>
                                    <input className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none"
                                        placeholder="Enter pickup code..." value={pickupCode} onChange={e => setPickupCode(e.target.value)} />
                                    <button onClick={handleVerifyPickup} disabled={actionLoading}
                                        className="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl disabled:opacity-60">
                                        Confirm Collection
                                    </button>
                                </div>
                            )}

                            {/* Refund */}
                            {["paid", "ready_for_pickup"].includes(selected.status) && (
                                <div className="border-t border-white/10 pt-4 space-y-3">
                                    <h3 className="text-sm font-semibold text-red-400">Process Refund</h3>
                                    <input className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none"
                                        placeholder="Refund reason..." value={refundReason} onChange={e => setRefundReason(e.target.value)} />
                                    <button onClick={handleRefund} disabled={actionLoading}
                                        className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-xl disabled:opacity-60">
                                        Issue Refund
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {ConfirmDialog}
        </div>
    );
}

export default withAdminAuth(OrdersAdminPage);
