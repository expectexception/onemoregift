"use client";
import { useState, useEffect, useCallback } from "react";
import api from "@/app/utils/apiClient";
import withAdminAuth from "@/app/components/withAdminAuth";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/app/components/ConfirmDialog";
import MultiImageUploader from "@/app/components/MultiImageUploader";
import { EmptyBoxIllustration } from "@/app/components/SVGIcons";
import { Star, Plus, Pencil, Trash2 } from "lucide-react";

const OCCASIONS = ["birthday", "anniversary", "wedding", "graduation", "achievement", "festival", "custom"];

function GiftsAdminPage() {
    const { toast } = useToast();
    const { confirm, ConfirmDialog } = useConfirm();
    const [gifts, setGifts] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editGift, setEditGift] = useState(null);
    const [form, setForm] = useState({ name: "", description: "", estimatedValue: "", stock: "", occasions: [], requiresVerification: true, isActive: true, images: [] });
    const [saving, setSaving] = useState(false);

    const fetchGifts = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get("admin/gifts", { meta: { auth: "admin" } });
            if (!data.error) { setGifts(data.data || []); setTotal(data.total || 0); }
        } catch (_) {}
        setLoading(false);
    }, []);

    useEffect(() => { fetchGifts(); }, [fetchGifts]);

    const openEdit = (g) => {
        setEditGift(g);
        setForm({ name: g.name, description: g.description || "", estimatedValue: g.estimatedValue, stock: g.stock, occasions: g.occasions || [], requiresVerification: g.requiresVerification, isActive: g.isActive, images: g.images || [] });
        setShowForm(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = { ...form, estimatedValue: Number(form.estimatedValue), stock: Number(form.stock) };
            if (editGift) {
                await api.patch(`admin/gifts/${editGift._id}`, payload, { meta: { auth: "admin" } });
                toast({ title: "Gift updated", description: `${form.name} was saved.` });
            } else {
                await api.post("admin/gifts", payload, { meta: { auth: "admin" } });
                toast({ title: "Gift created", description: `${form.name} added to the catalog.` });
            }
            setShowForm(false); setEditGift(null);
            setForm({ name: "", description: "", estimatedValue: "", stock: "", occasions: [], requiresVerification: true, isActive: true, images: [] });
            fetchGifts();
        } catch (err) {
            toast({ title: "Save failed", description: err?.response?.data?.msg || "Could not save gift.", variant: "destructive" });
        }
        setSaving(false);
    };

    const handleDelete = async (id) => {
        const ok = await confirm({ title: "Delete this gift?", description: "This cannot be undone.", confirmText: "Delete", danger: true });
        if (!ok) return;
        try {
            await api.delete(`admin/gifts/${id}`, { meta: { auth: "admin" } });
            toast({ title: "Gift deleted" });
            fetchGifts();
        } catch (err) {
            toast({ title: "Failed to delete", description: err?.response?.data?.msg, variant: "destructive" });
        }
    };

    const toggleOccasion = (occ) => {
        setForm(p => ({
            ...p,
            occasions: p.occasions.includes(occ) ? p.occasions.filter(o => o !== occ) : [...p.occasions, occ]
        }));
    };

    return (
        <div className="p-6 min-h-screen bg-black text-white">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                            <Star className="w-5 h-5 text-yellow-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Gift Catalog</h1>
                            <p className="text-sm text-neutral-500">Manage gifts for surprise assignments</p>
                        </div>
                    </div>
                    <button onClick={() => { setEditGift(null); setForm({ name: "", description: "", estimatedValue: "", stock: "", occasions: [], requiresVerification: true, isActive: true, images: [] }); setShowForm(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl">
                        <Plus className="w-4 h-4" /> Add Gift
                    </button>
                </div>

                {loading ? <div className="text-neutral-500 text-center py-12">Loading...</div> : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {gifts.map(g => (
                            <div key={g._id} className="bg-white/[0.02] border border-white/10 rounded-2xl p-5">
                                {g.images?.[0] && (
                                    <div className="w-full h-32 rounded-xl overflow-hidden mb-3 bg-white/5 border border-white/10">
                                        <img src={g.images[0]} alt="" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="text-white font-semibold">{g.name}</h3>
                                    <span className={`text-xs px-2 py-1 rounded-full ${g.isActive ? "bg-green-500/10 text-green-400" : "bg-neutral-800 text-neutral-500"}`}>
                                        {g.isActive ? "Active" : "Inactive"}
                                    </span>
                                </div>
                                <p className="text-sm text-neutral-400 mb-3">{g.description}</p>
                                <div className="flex flex-wrap gap-1 mb-3">
                                    {g.occasions?.map(o => (
                                        <span key={o} className="text-xs px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full capitalize">{o}</span>
                                    ))}
                                </div>
                                <div className="flex items-center justify-between text-sm border-t border-white/10 pt-3">
                                    <div>
                                        <span className="text-neutral-500 text-xs">Value: </span>
                                        <span className="text-white font-semibold">₹{g.estimatedValue?.toLocaleString("en-IN")}</span>
                                    </div>
                                    <div>
                                        <span className="text-neutral-500 text-xs">Stock: </span>
                                        <span className={`font-semibold ${g.stock === 0 ? "text-red-400" : "text-white"}`}>{g.stock}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => openEdit(g)} className="p-1.5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-lg text-white"><Pencil className="w-3 h-3" /></button>
                                        <button onClick={() => handleDelete(g._id)} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-400"><Trash2 className="w-3 h-3" /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {gifts.length === 0 && (
                            <div className="col-span-3 text-center py-12">
                                <EmptyBoxIllustration className="w-20 h-20 mx-auto mb-2" />
                                <p className="text-neutral-500 text-sm">No gifts yet</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <h2 className="text-lg font-bold text-white">{editGift ? "Edit Gift" : "Add Gift"}</h2>
                                <button onClick={() => setShowForm(false)} className="text-neutral-500 hover:text-white">✕</button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs text-neutral-500 mb-1.5">Gift Images</label>
                                    <MultiImageUploader images={form.images} onChange={(images) => setForm(p => ({ ...p, images }))} />
                                </div>
                                {[
                                    { label: "Gift Name", key: "name" },
                                    { label: "Estimated Value (₹)", key: "estimatedValue", type: "number" },
                                    { label: "Stock", key: "stock", type: "number" },
                                ].map(f => (
                                    <div key={f.key}>
                                        <label className="block text-xs text-neutral-500 mb-1">{f.label}</label>
                                        <input type={f.type || "text"} className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                                            value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                                    </div>
                                ))}
                                <div>
                                    <label className="block text-xs text-neutral-500 mb-1">Description</label>
                                    <textarea rows={2} className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none resize-none"
                                        value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="block text-xs text-neutral-500 mb-2">Occasions</label>
                                    <div className="flex flex-wrap gap-2">
                                        {OCCASIONS.map(o => (
                                            <button key={o} type="button" onClick={() => toggleOccasion(o)}
                                                className={`text-xs px-3 py-1 rounded-full border capitalize transition-colors ${form.occasions.includes(o) ? "bg-purple-500/20 border-purple-500/40 text-purple-300" : "bg-white/[0.04] border-white/10 text-neutral-400"}`}>
                                                {o}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 text-sm text-neutral-400 cursor-pointer">
                                        <input type="checkbox" checked={form.requiresVerification} onChange={e => setForm(p => ({ ...p, requiresVerification: e.target.checked }))} />
                                        Requires Verification
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-neutral-400 cursor-pointer">
                                        <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} />
                                        Active
                                    </label>
                                </div>
                            </div>
                            <button onClick={handleSave} disabled={saving}
                                className="mt-6 w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl disabled:opacity-60">
                                {saving ? "Saving..." : editGift ? "Update Gift" : "Create Gift"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {ConfirmDialog}
        </div>
    );
}

export default withAdminAuth(GiftsAdminPage);
