"use client";
import { useState, useEffect, useCallback } from "react";
import api from "@/app/utils/apiClient";
import withAdminAuth from "@/app/components/withAdminAuth";
import { EmptyTimelineIllustration } from "@/app/components/SVGIcons";
import { Gift, Clock, CheckCircle, XCircle, AlertTriangle, Eye, Filter, Search, FileText } from "lucide-react";

const STATUS_COLORS = {
    draft: "bg-neutral-800 text-neutral-400",
    submitted: "bg-blue-500/10 text-blue-400",
    under_review: "bg-yellow-500/10 text-yellow-400",
    verification_pending: "bg-orange-500/10 text-orange-400",
    approved: "bg-green-500/10 text-green-400",
    rejected: "bg-red-500/10 text-red-400",
    gift_assigned: "bg-purple-500/10 text-purple-400",
    completed: "bg-emerald-500/10 text-emerald-400",
};

const STATUS_OPTIONS = ["", "draft", "submitted", "under_review", "verification_pending", "approved", "rejected", "gift_assigned", "completed"];
const EVENT_TYPES = ["", "birthday", "anniversary", "wedding", "graduation", "achievement", "festival", "custom"];

function SurpriseAdminPage() {
    const [requests, setRequests] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState("");
    const [eventType, setEventType] = useState("");
    const [search, setSearch] = useState("");
    const [stats, setStats] = useState({});
    const [selected, setSelected] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [statusNote, setStatusNote] = useState("");
    const [newStatus, setNewStatus] = useState("");

    const limit = 15;

    const fetchStats = useCallback(async () => {
        try {
            const { data } = await api.get("admin/surprise/stats", { meta: { auth: "admin" } });
            if (!data.error) setStats(data.data || {});
        } catch (_) {}
    }, []);

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit };
            if (status) params.status = status;
            if (eventType) params.eventType = eventType;
            if (search) params.search = search;
            const { data } = await api.get("admin/surprise", { params, meta: { auth: "admin" } });
            if (!data.error) {
                setRequests(data.data || []);
                setTotal(data.total || 0);
            }
        } catch (_) {}
        setLoading(false);
    }, [page, status, eventType, search]);

    useEffect(() => { fetchStats(); }, [fetchStats]);
    useEffect(() => { fetchRequests(); }, [fetchRequests]);

    const handleStatusUpdate = async () => {
        if (!selected || !newStatus) return;
        setActionLoading(true);
        try {
            await api.patch(`admin/surprise/${selected._id}/status`, {
                status: newStatus,
                adminNotes: statusNote,
                rejectionReason: newStatus === "rejected" ? statusNote : undefined,
            }, { meta: { auth: "admin" } });
            setSelected(null);
            setStatusNote("");
            setNewStatus("");
            fetchRequests();
            fetchStats();
        } catch (_) {}
        setActionLoading(false);
    };

    return (
        <div className="p-6 min-h-screen bg-black text-white">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                        <Gift className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Surprise Requests</h1>
                        <p className="text-sm text-neutral-500">Manage and review user surprise requests</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: "Total", value: stats.total || 0, color: "text-white" },
                        { label: "Pending Review", value: (stats.submitted || 0) + (stats.under_review || 0), color: "text-yellow-400" },
                        { label: "Approved", value: (stats.approved || 0) + (stats.gift_assigned || 0), color: "text-green-400" },
                        { label: "Rejected", value: stats.rejected || 0, color: "text-red-400" },
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
                        <input
                            className="w-full bg-white/[0.04] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/20"
                            placeholder="Search recipient name..."
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                        />
                    </div>
                    <select
                        className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                        value={status}
                        onChange={e => { setStatus(e.target.value); setPage(1); }}
                    >
                        {STATUS_OPTIONS.map(s => <option key={s} value={s} className="bg-black">{s || "All Statuses"}</option>)}
                    </select>
                    <select
                        className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                        value={eventType}
                        onChange={e => { setEventType(e.target.value); setPage(1); }}
                    >
                        {EVENT_TYPES.map(t => <option key={t} value={t} className="bg-black">{t || "All Types"}</option>)}
                    </select>
                </div>

                {/* Table */}
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    {["Recipient", "Event Type", "Event Date", "User", "Status", "Submitted", "Actions"].map(h => (
                                        <th key={h} className="text-left px-4 py-3 text-xs text-neutral-500 font-medium uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={7} className="text-center py-12 text-neutral-500">Loading...</td></tr>
                                ) : requests.length === 0 ? (
                                    <tr><td colSpan={7} className="text-center py-12">
                                        <EmptyTimelineIllustration className="w-20 h-20 mx-auto mb-2" />
                                        <p className="text-neutral-500 text-sm">No requests found</p>
                                    </td></tr>
                                ) : requests.map(r => (
                                    <tr key={r._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                        <td className="px-4 py-3 text-sm text-white font-medium">{r.recipientName}</td>
                                        <td className="px-4 py-3 text-sm text-neutral-400 capitalize">{r.eventType}</td>
                                        <td className="px-4 py-3 text-sm text-neutral-400">{new Date(r.eventDate).toLocaleDateString("en-IN")}</td>
                                        <td className="px-4 py-3 text-sm text-neutral-400">{r.userId?.name || "-"}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-1 rounded-full capitalize ${STATUS_COLORS[r.status] || "bg-neutral-800 text-neutral-400"}`}>
                                                {r.status?.replace(/_/g, " ")}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-neutral-500">{new Date(r.createdAt).toLocaleDateString("en-IN")}</td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => { setSelected(r); setNewStatus(r.status); }}
                                                className="text-xs px-3 py-1.5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-lg text-white transition-colors flex items-center gap-1"
                                            >
                                                <Eye className="w-3 h-3" /> Review
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
                        <span className="text-xs text-neutral-500">{total} total requests</span>
                        <div className="flex gap-2">
                            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="text-xs px-3 py-1 bg-white/[0.04] border border-white/10 rounded-lg text-white disabled:opacity-40">Prev</button>
                            <span className="text-xs px-3 py-1 text-neutral-500">{page}</span>
                            <button disabled={page * limit >= total} onClick={() => setPage(p => p + 1)} className="text-xs px-3 py-1 bg-white/[0.04] border border-white/10 rounded-lg text-white disabled:opacity-40">Next</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Review Modal */}
            {selected && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Review Request</h2>
                                    <p className="text-sm text-neutral-500">{selected.recipientName} · {selected.eventType}</p>
                                </div>
                                <button onClick={() => setSelected(null)} className="text-neutral-500 hover:text-white">✕</button>
                            </div>

                            <div className="space-y-4 mb-6">
                                <InfoRow label="Event Date" value={new Date(selected.eventDate).toLocaleDateString("en-IN")} />
                                <InfoRow label="Description" value={selected.description} />
                                <InfoRow label="Contact" value={selected.recipientContact} />
                                <InfoRow label="Submitted by" value={selected.userId?.email} />
                                {selected.assignedGift && <InfoRow label="Assigned Gift" value={selected.assignedGift?.name || "Yes"} />}
                            </div>

                            {selected.documents?.length > 0 ? (
                                <div className="mb-6">
                                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
                                        Proof Documents ({selected.documents.length})
                                    </p>
                                    <div className="flex gap-2 overflow-x-auto pb-1">
                                        {selected.documents.map((url, i) => {
                                            const isPdf = /\.pdf($|\?)/i.test(url);
                                            return (
                                                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                                                    {isPdf ? (
                                                        <div className="w-24 h-24 rounded-xl border border-white/10 hover:border-red-500/40 transition-colors flex flex-col items-center justify-center gap-1 bg-white/[0.02] text-neutral-400">
                                                            <FileText className="w-6 h-6" />
                                                            <span className="text-[9px] font-bold">Doc {i + 1}</span>
                                                        </div>
                                                    ) : (
                                                        <img src={url} alt="" className="w-24 h-24 rounded-xl object-cover border border-white/10 hover:border-red-500/40 transition-colors" />
                                                    )}
                                                </a>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="mb-6">
                                    <InfoRow label="Documents" value="None uploaded" />
                                </div>
                            )}

                            {/* Timeline */}
                            {selected.verificationTimeline?.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-semibold text-white mb-3">Timeline</h3>
                                    <div className="space-y-2">
                                        {selected.verificationTimeline.map((t, i) => (
                                            <div key={i} className="flex gap-3 text-xs">
                                                <span className={`px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[t.status] || "bg-neutral-800 text-neutral-400"}`}>{t.status?.replace(/_/g, " ")}</span>
                                                <span className="text-neutral-500">{t.note}</span>
                                                <span className="text-neutral-600 ml-auto">{new Date(t.at).toLocaleDateString("en-IN")}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Update Status */}
                            <div className="space-y-3">
                                <select
                                    className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                                    value={newStatus}
                                    onChange={e => setNewStatus(e.target.value)}
                                >
                                    {STATUS_OPTIONS.filter(Boolean).map(s => (
                                        <option key={s} value={s} className="bg-black capitalize">{s.replace(/_/g, " ")}</option>
                                    ))}
                                </select>
                                <textarea
                                    className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none resize-none"
                                    rows={3}
                                    placeholder="Admin notes / rejection reason..."
                                    value={statusNote}
                                    onChange={e => setStatusNote(e.target.value)}
                                />
                                <button
                                    onClick={handleStatusUpdate}
                                    disabled={actionLoading}
                                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
                                >
                                    {actionLoading ? "Updating..." : "Update Status"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function InfoRow({ label, value }) {
    return (
        <div className="flex justify-between text-sm">
            <span className="text-neutral-500">{label}</span>
            <span className="text-white text-right max-w-[60%]">{value || "-"}</span>
        </div>
    );
}

export default withAdminAuth(SurpriseAdminPage);
