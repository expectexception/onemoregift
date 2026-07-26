"use client";
import { useState, useEffect, useCallback } from "react";
import api from "@/app/utils/apiClient";
import withAdminAuth from "@/app/components/withAdminAuth";
import { FileText, Search, Filter } from "lucide-react";

const CATEGORIES = ["", "user", "admin", "surprise", "moment", "product", "order", "store", "gift", "setting", "auth", "system"];

const ACTION_COLORS = {
    "user.ban": "text-red-400",
    "user.unban": "text-green-400",
    "product.create": "text-blue-400",
    "product.delete": "text-red-400",
    "order.refund": "text-orange-400",
    "surprise.gift_assigned": "text-purple-400",
    "admin.role_change": "text-yellow-400",
};

function AuditLogsPage() {
    const [logs, setLogs] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [category, setCategory] = useState("");
    const [action, setAction] = useState("");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [selected, setSelected] = useState(null);
    const limit = 30;

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit };
            if (category) params.category = category;
            if (action) params.action = action;
            if (from) params.from = from;
            if (to) params.to = to;
            const { data } = await api.get("admin/audit-logs", { params, meta: { auth: "admin" } });
            if (!data.error) { setLogs(data.data || []); setTotal(data.total || 0); }
        } catch (_) {}
        setLoading(false);
    }, [page, category, action, from, to]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    return (
        <div className="p-6 min-h-screen bg-black text-white">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-white/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-neutral-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
                        <p className="text-sm text-neutral-500">Immutable record of all admin actions</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3 mb-6">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                        <input className="w-full bg-white/[0.04] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none"
                            placeholder="Filter by action (e.g. product.create)..." value={action} onChange={e => { setAction(e.target.value); setPage(1); }} />
                    </div>
                    <select className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                        value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}>
                        {CATEGORIES.map(c => <option key={c} value={c} className="bg-black capitalize">{c || "All Categories"}</option>)}
                    </select>
                    <input type="date" className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                        value={from} onChange={e => setFrom(e.target.value)} />
                    <input type="date" className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                        value={to} onChange={e => setTo(e.target.value)} />
                </div>

                {/* Table */}
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    {["Action", "Category", "Admin", "Description", "IP", "Timestamp"].map(h => (
                                        <th key={h} className="text-left px-4 py-3 text-xs text-neutral-500 font-medium uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={6} className="text-center py-12 text-neutral-500">Loading...</td></tr>
                                ) : logs.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-12 text-neutral-500">No logs found</td></tr>
                                ) : logs.map(l => (
                                    <tr key={l._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => setSelected(l)}>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs font-mono ${ACTION_COLORS[l.action] || "text-white"}`}>{l.action}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs px-2 py-0.5 bg-white/[0.05] border border-white/10 rounded text-neutral-400 capitalize">{l.category}</span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-neutral-400">{l.adminEmail || "-"}</td>
                                        <td className="px-4 py-3 text-xs text-neutral-500 max-w-[200px] truncate">{l.description || "-"}</td>
                                        <td className="px-4 py-3 text-xs text-neutral-600 font-mono">{l.ipAddress || "-"}</td>
                                        <td className="px-4 py-3 text-xs text-neutral-500">{new Date(l.createdAt).toLocaleString("en-IN")}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
                        <span className="text-xs text-neutral-500">{total} total log entries</span>
                        <div className="flex gap-2">
                            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="text-xs px-3 py-1 bg-white/[0.04] border border-white/10 rounded-lg text-white disabled:opacity-40">Prev</button>
                            <button disabled={page * limit >= total} onClick={() => setPage(p => p + 1)} className="text-xs px-3 py-1 bg-white/[0.04] border border-white/10 rounded-lg text-white disabled:opacity-40">Next</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Log Detail Modal */}
            {selected && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <h2 className="text-lg font-bold text-white">Log Detail</h2>
                                <button onClick={() => setSelected(null)} className="text-neutral-500 hover:text-white">✕</button>
                            </div>
                            <div className="space-y-3 text-sm">
                                {[
                                    { label: "Action", value: selected.action },
                                    { label: "Category", value: selected.category },
                                    { label: "Admin", value: `${selected.adminEmail} (${selected.adminRole})` },
                                    { label: "Description", value: selected.description },
                                    { label: "IP Address", value: selected.ipAddress },
                                    { label: "Entity", value: selected.entityType ? `${selected.entityType}: ${selected.entityId}` : "-" },
                                    { label: "Timestamp", value: new Date(selected.createdAt).toLocaleString("en-IN") },
                                ].map(r => (
                                    <div key={r.label} className="flex justify-between gap-4">
                                        <span className="text-neutral-500 shrink-0">{r.label}</span>
                                        <span className="text-white text-right break-all">{r.value || "-"}</span>
                                    </div>
                                ))}
                                {selected.prevValue && (
                                    <div>
                                        <div className="text-neutral-500 mb-1">Previous Value</div>
                                        <pre className="text-xs text-yellow-300 bg-white/[0.03] border border-white/10 rounded p-2 overflow-x-auto">{JSON.stringify(selected.prevValue, null, 2)}</pre>
                                    </div>
                                )}
                                {selected.newValue && (
                                    <div>
                                        <div className="text-neutral-500 mb-1">New Value</div>
                                        <pre className="text-xs text-green-300 bg-white/[0.03] border border-white/10 rounded p-2 overflow-x-auto">{JSON.stringify(selected.newValue, null, 2)}</pre>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default withAdminAuth(AuditLogsPage);
