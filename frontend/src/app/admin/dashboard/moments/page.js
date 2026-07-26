"use client";
import { useState, useEffect, useCallback } from "react";
import api from "@/app/utils/apiClient";
import withAdminAuth from "@/app/components/withAdminAuth";
import MediaReviewer from "@/app/components/MediaReviewer";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/app/components/ConfirmDialog";
import { EmptyGalleryIllustration } from "@/app/components/SVGIcons";
import { Heart, Eye, Star, Trash2, Search, ImageOff, X } from "lucide-react";

const STATUS_COLORS = {
    draft: "bg-neutral-800 text-neutral-400",
    submitted: "bg-blue-500/10 text-blue-400",
    under_review: "bg-yellow-500/10 text-yellow-400",
    approved: "bg-green-500/10 text-green-400",
    rejected: "bg-red-500/10 text-red-400",
    published: "bg-purple-500/10 text-purple-400",
    gift_assigned: "bg-pink-500/10 text-pink-400",
};

const STATUS_OPTIONS = ["", "submitted", "under_review", "approved", "rejected", "published", "gift_assigned"];

function MomentsAdminPage() {
    const { toast } = useToast();
    const { confirm, ConfirmDialog } = useConfirm();
    const [moments, setMoments] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState("");
    const [flagged, setFlagged] = useState(false);
    const [selected, setSelected] = useState(null);
    const [newStatus, setNewStatus] = useState("");
    const [adminNotes, setAdminNotes] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const limit = 15;

    const fetchMoments = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit };
            if (status) params.status = status;
            if (flagged) params.flagged = "true";
            const { data } = await api.get("admin/moments", { params, meta: { auth: "admin" } });
            if (!data.error) { setMoments(data.data || []); setTotal(data.total || 0); }
        } catch (_) {}
        setLoading(false);
    }, [page, status, flagged]);

    useEffect(() => { fetchMoments(); }, [fetchMoments]);

    const handleStatusUpdate = async () => {
        if (!selected || !newStatus) return;
        setActionLoading(true);
        try {
            await api.patch(`admin/moments/${selected._id}/status`, { status: newStatus, adminNotes }, { meta: { auth: "admin" } });
            toast({ title: "Status updated", description: `Moment is now "${newStatus.replace(/_/g, " ")}".` });
            setSelected(null);
            fetchMoments();
        } catch (err) {
            toast({ title: "Update failed", description: err?.response?.data?.msg, variant: "destructive" });
        }
        setActionLoading(false);
    };

    const handleFeature = async (id) => {
        try {
            await api.patch(`admin/moments/${id}/feature`, {}, { meta: { auth: "admin" } });
            fetchMoments();
        } catch (err) {
            toast({ title: "Failed to toggle feature", description: err?.response?.data?.msg, variant: "destructive" });
        }
    };

    const handleDelete = async (id) => {
        const ok = await confirm({ title: "Remove this moment?", description: "This will permanently delete the post.", confirmText: "Remove", danger: true });
        if (!ok) return;
        try {
            await api.delete(`admin/moments/${id}`, { meta: { auth: "admin" } });
            toast({ title: "Moment removed" });
            fetchMoments();
        } catch (err) {
            toast({ title: "Failed to remove", description: err?.response?.data?.msg, variant: "destructive" });
        }
    };

    return (
        <div className="p-6 min-h-screen bg-black text-white">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                        <Heart className="w-5 h-5 text-pink-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Happy Moments</h1>
                        <p className="text-sm text-neutral-500">Moderate and manage user moments</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3 mb-6">
                    <select
                        className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                        value={status}
                        onChange={e => { setStatus(e.target.value); setPage(1); }}
                    >
                        {STATUS_OPTIONS.map(s => <option key={s} value={s} className="bg-black">{s || "All Statuses"}</option>)}
                    </select>
                    <label className="flex items-center gap-2 text-sm text-neutral-400 cursor-pointer">
                        <input type="checkbox" checked={flagged} onChange={e => setFlagged(e.target.checked)} className="rounded" />
                        Show Reported Only
                    </label>
                </div>

                {/* Table */}
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    {["", "Caption", "User", "Media", "Status", "Featured", "Reports", "Submitted", "Actions"].map(h => (
                                        <th key={h} className="text-left px-4 py-3 text-xs text-neutral-500 font-medium uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={9} className="text-center py-12 text-neutral-500">Loading...</td></tr>
                                ) : moments.length === 0 ? (
                                    <tr><td colSpan={9} className="text-center py-12">
                                        <EmptyGalleryIllustration className="w-20 h-20 mx-auto mb-2" />
                                        <p className="text-neutral-500 text-sm">No moments found</p>
                                    </td></tr>
                                ) : moments.map(m => (
                                    <tr key={m._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 border border-white/10 shrink-0">
                                                {m.media?.[0]?.url ? (
                                                    <img src={m.media[0].url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-neutral-600"><ImageOff className="w-4 h-4" /></div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-white max-w-[140px] sm:max-w-[200px] truncate">{m.caption}</td>
                                        <td className="px-4 py-3 text-sm text-neutral-400">{m.userId?.name || "-"}</td>
                                        <td className="px-4 py-3 text-sm text-neutral-400">{m.media?.length || 0} files</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-1 rounded-full capitalize ${STATUS_COLORS[m.status] || "bg-neutral-800 text-neutral-400"}`}>
                                                {m.status?.replace(/_/g, " ")}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button onClick={() => handleFeature(m._id)} className={`text-xs ${m.isFeatured ? "text-yellow-400" : "text-neutral-600 hover:text-yellow-400"}`}>
                                                <Star className="w-4 h-4" fill={m.isFeatured ? "currentColor" : "none"} />
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-neutral-400">{m.reports?.length || 0}</td>
                                        <td className="px-4 py-3 text-xs text-neutral-500">{new Date(m.createdAt).toLocaleDateString("en-IN")}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <button onClick={() => { setSelected(m); setNewStatus(m.status); setAdminNotes(m.adminNotes || ""); }}
                                                    className="text-xs px-2 py-1.5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-lg text-white transition-colors">
                                                    <Eye className="w-3 h-3" />
                                                </button>
                                                <button onClick={() => handleDelete(m._id)}
                                                    className="text-xs px-2 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-400 transition-colors">
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
                        <span className="text-xs text-neutral-500">{total} total moments</span>
                        <div className="flex gap-2">
                            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="text-xs px-3 py-1 bg-white/[0.04] border border-white/10 rounded-lg text-white disabled:opacity-40">Prev</button>
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
                                <h2 className="text-lg font-bold text-white">Review Moment</h2>
                                <button onClick={() => setSelected(null)} className="text-neutral-500 hover:text-white"><X className="w-5 h-5" /></button>
                            </div>
                            <p className="text-sm text-neutral-400 mb-4">{selected.caption}</p>
                            <p className="text-xs text-neutral-500 mb-6">{selected.description}</p>

                            <div className="mb-4">
                                <MediaReviewer
                                    items={selected.media}
                                    label="Shared media"
                                    emptyText="No media attached to this moment."
                                />
                            </div>

                            <div className="mb-4">
                                <MediaReviewer
                                    items={selected.proofs}
                                    label="Verification proofs (private)"
                                    accent="amber"
                                    emptyText="No verification proof was submitted."
                                />
                            </div>

                            {selected.reports?.length > 0 && (
                                <div className="mb-4 p-3 bg-red-500/5 border border-red-500/20 rounded-xl">
                                    <p className="text-xs text-red-400 font-semibold mb-2">⚠ {selected.reports.length} Report(s)</p>
                                    {selected.reports.slice(0, 3).map((r, i) => (
                                        <p key={i} className="text-xs text-neutral-400">{r.reason}</p>
                                    ))}
                                </div>
                            )}

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
                                    placeholder="Admin notes..."
                                    value={adminNotes}
                                    onChange={e => setAdminNotes(e.target.value)}
                                />
                                <button onClick={handleStatusUpdate} disabled={actionLoading}
                                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60">
                                    {actionLoading ? "Updating..." : "Update Status"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {ConfirmDialog}
        </div>
    );
}

export default withAdminAuth(MomentsAdminPage);
