"use client";
import { useState, useEffect, useCallback } from "react";
import api from "@/app/utils/apiClient";
import withAdminAuth from "@/app/components/withAdminAuth";
import { BarChart3, Users, Gift, ShoppingBag, Package, TrendingUp } from "lucide-react";

function ReportsAdminPage() {
    const [overview, setOverview] = useState(null);
    const [surpriseStats, setSurpriseStats] = useState(null);
    const [orderStats, setOrderStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [o, s, ord] = await Promise.allSettled([
                api.get("admin/stats", { meta: { auth: "admin" } }),
                api.get("admin/surprise/stats", { meta: { auth: "admin" } }),
                api.get("admin/orders/stats", { meta: { auth: "admin" } }),
            ]);
            if (o.status === "fulfilled" && !o.value.data.error) setOverview(o.value.data);
            if (s.status === "fulfilled" && !s.value.data.error) setSurpriseStats(s.value.data.data);
            if (ord.status === "fulfilled" && !ord.value.data.error) setOrderStats(ord.value.data.data);
        } catch (_) {}
        setLoading(false);
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    if (loading) return <div className="p-6 text-center text-neutral-500">Loading reports...</div>;

    return (
        <div className="p-6 min-h-screen bg-black text-white">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Reports & Analytics</h1>
                        <p className="text-sm text-neutral-500">Platform-wide metrics overview</p>
                    </div>
                </div>

                {/* Platform Overview */}
                <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">Platform Overview</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: "Registered Users", value: overview?.registeredUsers || 0, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
                        { label: "Total Giveaways", value: overview?.totalGiveaways || 0, icon: Gift, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
                        { label: "Active Giveaways", value: overview?.activeGiveaways || 0, icon: TrendingUp, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
                        { label: "Total Winners", value: overview?.totalWinners || 0, icon: BarChart3, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
                    ].map(s => (
                        <div key={s.label} className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                            <div className={`w-9 h-9 rounded-lg border flex items-center justify-center mb-3 ${s.bg}`}>
                                <s.icon className={`w-4 h-4 ${s.color}`} />
                            </div>
                            <div className={`text-2xl font-bold ${s.color}`}>{s.value.toLocaleString("en-IN")}</div>
                            <div className="text-xs text-neutral-500 mt-1">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Surprise + Orders side by side */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {/* Surprise Stats */}
                    <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
                        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                            <Gift className="w-4 h-4 text-purple-400" /> Surprise Requests
                        </h2>
                        {surpriseStats ? (
                            <div className="space-y-3">
                                {[
                                    { label: "Total Requests", value: surpriseStats.total || 0 },
                                    { label: "Submitted", value: surpriseStats.submitted || 0 },
                                    { label: "Under Review", value: surpriseStats.under_review || 0 },
                                    { label: "Approved", value: surpriseStats.approved || 0 },
                                    { label: "Gift Assigned", value: surpriseStats.gift_assigned || 0 },
                                    { label: "Rejected", value: surpriseStats.rejected || 0 },
                                ].map(r => (
                                    <div key={r.label} className="flex justify-between items-center">
                                        <span className="text-sm text-neutral-400">{r.label}</span>
                                        <span className="text-sm text-white font-semibold">{r.value}</span>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-sm text-neutral-500">No data</p>}
                    </div>

                    {/* Order Stats */}
                    <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
                        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                            <Package className="w-4 h-4 text-green-400" /> Orders & Revenue
                        </h2>
                        {orderStats ? (
                            <div className="space-y-3">
                                {[
                                    { label: "Total Orders", value: orderStats.total || 0 },
                                    { label: "Revenue", value: `₹${(orderStats.revenue || 0).toLocaleString("en-IN")}` },
                                    { label: "Pending", value: orderStats.pending || 0 },
                                    { label: "Paid", value: orderStats.paid || 0 },
                                    { label: "Pending Pickup", value: orderStats.ready_for_pickup || 0 },
                                    { label: "Collected", value: orderStats.collected || 0 },
                                    { label: "Cancelled/Refunded", value: (orderStats.cancelled || 0) + (orderStats.refunded || 0) },
                                ].map(r => (
                                    <div key={r.label} className="flex justify-between items-center">
                                        <span className="text-sm text-neutral-400">{r.label}</span>
                                        <span className="text-sm text-white font-semibold">{r.value}</span>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-sm text-neutral-500">No data</p>}
                    </div>
                </div>

                {/* Export notice */}
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
                    <h2 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-indigo-400" /> Export Reports
                    </h2>
                    <p className="text-sm text-neutral-500 mb-4">CSV/Excel export coming in Phase 3. All data is available via API endpoints.</p>
                    <div className="flex gap-3">
                        {["Users CSV", "Orders CSV", "Surprise Requests CSV"].map(label => (
                            <button key={label} disabled className="text-xs px-3 py-2 bg-white/[0.04] border border-white/10 rounded-lg text-neutral-600 cursor-not-allowed">
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default withAdminAuth(ReportsAdminPage);
