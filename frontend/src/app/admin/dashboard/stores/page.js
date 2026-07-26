"use client";
import { useState, useEffect, useCallback } from "react";
import api from "@/app/utils/apiClient";
import withAdminAuth from "@/app/components/withAdminAuth";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/app/components/ConfirmDialog";
import { EmptyBoxIllustration } from "@/app/components/SVGIcons";
import { Store, Plus, Pencil, Trash2 } from "lucide-react";

// Values must match the backend enum exactly (model/Store.js operatingHoursSchema.day)
const WEEKDAYS = [
    { value: "mon", label: "Monday" },
    { value: "tue", label: "Tuesday" },
    { value: "wed", label: "Wednesday" },
    { value: "thu", label: "Thursday" },
    { value: "fri", label: "Friday" },
    { value: "sat", label: "Saturday" },
    { value: "sun", label: "Sunday" },
];
const DEFAULT_HOURS = WEEKDAYS.map(({ value }) => ({ day: value, open: "10:00", close: "20:00", isClosed: false }));
const emptyForm = { name: "", code: "", address: "", city: "", state: "", postalCode: "", phone: "", dailyPickupCapacity: 50, isActive: true, operatingHours: DEFAULT_HOURS };

function StoresAdminPage() {
    const { toast } = useToast();
    const { confirm, ConfirmDialog } = useConfirm();
    const [stores, setStores] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editStore, setEditStore] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    const fetchStores = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get("admin/stores", { meta: { auth: "admin" } });
            if (!data.error) { setStores(data.data || []); setTotal(data.total || 0); }
        } catch (_) {}
        setLoading(false);
    }, []);

    useEffect(() => { fetchStores(); }, [fetchStores]);

    const openEdit = (s) => {
        setEditStore(s);
        setForm({
            name: s.name, code: s.code || "", address: s.address, city: s.city, state: s.state || "",
            postalCode: s.postalCode || "", phone: s.phone || "", dailyPickupCapacity: s.dailyPickupCapacity || 50,
            isActive: s.isActive, operatingHours: s.operatingHours?.length ? s.operatingHours : DEFAULT_HOURS,
        });
        setShowForm(true);
    };

    const updateHourRow = (idx, field, value) => {
        setForm(p => {
            const operatingHours = [...p.operatingHours];
            operatingHours[idx] = { ...operatingHours[idx], [field]: value };
            return { ...p, operatingHours };
        });
    };

    const handleSave = async () => {
        if (!form.code.trim()) {
            toast({ title: "Store code required", description: "Enter a unique code, e.g. DEL-01.", variant: "destructive" });
            return;
        }
        setSaving(true);
        try {
            if (editStore) {
                await api.patch(`admin/stores/${editStore._id}`, form, { meta: { auth: "admin" } });
                toast({ title: "Store updated", description: `${form.name} was saved.` });
            } else {
                await api.post("admin/stores", form, { meta: { auth: "admin" } });
                toast({ title: "Store created", description: `${form.name} added to pickup locations.` });
            }
            setShowForm(false); setEditStore(null);
            setForm(emptyForm);
            fetchStores();
        } catch (err) {
            toast({ title: "Save failed", description: err?.response?.data?.msg || "Could not save store.", variant: "destructive" });
        }
        setSaving(false);
    };

    const handleDelete = async (id) => {
        const ok = await confirm({ title: "Delete this store?", description: "This cannot be undone.", confirmText: "Delete", danger: true });
        if (!ok) return;
        try {
            await api.delete(`admin/stores/${id}`, { meta: { auth: "admin" } });
            toast({ title: "Store deleted" });
            fetchStores();
        } catch (err) {
            toast({ title: "Failed to delete", description: err?.response?.data?.msg, variant: "destructive" });
        }
    };

    return (
        <div className="p-6 min-h-screen bg-black text-white">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                            <Store className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Store Locations</h1>
                            <p className="text-sm text-neutral-500">Manage pickup store locations</p>
                        </div>
                    </div>
                    <button onClick={() => { setEditStore(null); setForm(emptyForm); setShowForm(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl">
                        <Plus className="w-4 h-4" /> Add Store
                    </button>
                </div>

                {loading ? <div className="text-neutral-500 text-center py-12">Loading...</div> : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {stores.map(s => (
                            <div key={s._id} className="bg-white/[0.02] border border-white/10 rounded-2xl p-5">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="text-white font-semibold">{s.name}</h3>
                                        {s.code && <span className="text-[10px] font-mono text-amber-400/80 uppercase tracking-wider">{s.code}</span>}
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${s.isActive ? "bg-green-500/10 text-green-400" : "bg-neutral-800 text-neutral-500"}`}>
                                        {s.isActive ? "Active" : "Inactive"}
                                    </span>
                                </div>
                                <p className="text-sm text-neutral-400 mb-1">{s.address}</p>
                                <p className="text-sm text-neutral-500">{s.city}{s.state ? `, ${s.state}` : ""}</p>
                                {s.phone && <p className="text-xs text-neutral-600 mt-1">{s.phone}</p>}
                                {s.operatingHours?.length > 0 && (
                                    <p className="text-[10px] text-neutral-600 mt-1">
                                        {s.operatingHours.filter(h => !h.isClosed).length} day(s) open · {s.operatingHours.find(h => !h.isClosed)?.open}–{s.operatingHours.find(h => !h.isClosed)?.close}
                                    </p>
                                )}
                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                                    <span className="text-xs text-neutral-500">Capacity: {s.dailyPickupCapacity}/day</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => openEdit(s)} className="text-xs p-1.5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-lg text-white"><Pencil className="w-3 h-3" /></button>
                                        <button onClick={() => handleDelete(s._id)} className="text-xs p-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-400"><Trash2 className="w-3 h-3" /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {stores.length === 0 && (
                            <div className="col-span-3 text-center py-12">
                                <EmptyBoxIllustration className="w-20 h-20 mx-auto mb-2" />
                                <p className="text-neutral-500 text-sm">No stores yet</p>
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
                                <h2 className="text-lg font-bold text-white">{editStore ? "Edit Store" : "Add Store"}</h2>
                                <button onClick={() => setShowForm(false)} className="text-neutral-500 hover:text-white">✕</button>
                            </div>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-neutral-500 mb-1">Store Name</label>
                                        <input className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                                            value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-neutral-500 mb-1">Store Code *</label>
                                        <input placeholder="e.g. DEL-01" className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono uppercase focus:outline-none"
                                            value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} />
                                    </div>
                                </div>
                                {[
                                    { label: "Full Address", key: "address" },
                                    { label: "City", key: "city" },
                                    { label: "State", key: "state" },
                                    { label: "Postal Code", key: "postalCode" },
                                    { label: "Phone", key: "phone" },
                                    { label: "Daily Pickup Capacity", key: "dailyPickupCapacity", type: "number" },
                                ].map(f => (
                                    <div key={f.key}>
                                        <label className="block text-xs text-neutral-500 mb-1">{f.label}</label>
                                        <input type={f.type || "text"} className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                                            value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                                    </div>
                                ))}

                                <div>
                                    <label className="block text-xs text-neutral-500 mb-2">Operating Hours</label>
                                    <div className="space-y-1.5">
                                        {form.operatingHours.map((h, idx) => (
                                            <div key={h.day} className="flex items-center gap-2 text-xs">
                                                <span className="w-20 text-neutral-400 shrink-0">{WEEKDAYS.find(w => w.value === h.day)?.label.slice(0, 3) || h.day}</span>
                                                <input type="time" disabled={h.isClosed} value={h.open}
                                                    onChange={e => updateHourRow(idx, "open", e.target.value)}
                                                    className="bg-white/[0.04] border border-white/10 rounded-lg px-2 py-1.5 text-white disabled:opacity-30 focus:outline-none" />
                                                <span className="text-neutral-600">–</span>
                                                <input type="time" disabled={h.isClosed} value={h.close}
                                                    onChange={e => updateHourRow(idx, "close", e.target.value)}
                                                    className="bg-white/[0.04] border border-white/10 rounded-lg px-2 py-1.5 text-white disabled:opacity-30 focus:outline-none" />
                                                <label className="flex items-center gap-1.5 text-neutral-500 cursor-pointer ml-auto">
                                                    <input type="checkbox" checked={h.isClosed} onChange={e => updateHourRow(idx, "isClosed", e.target.checked)} />
                                                    Closed
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <label className="flex items-center gap-2 text-sm text-neutral-400 cursor-pointer">
                                    <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} />
                                    Active
                                </label>
                            </div>
                            <button onClick={handleSave} disabled={saving}
                                className="mt-6 w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl disabled:opacity-60">
                                {saving ? "Saving..." : editStore ? "Update Store" : "Create Store"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {ConfirmDialog}
        </div>
    );
}

export default withAdminAuth(StoresAdminPage);
