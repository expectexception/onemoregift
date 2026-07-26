"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
    Ticket, Plus, RefreshCw, Trash2, Pencil, X, Search, AlertTriangle, CheckCircle,
} from "lucide-react";
import api from "@/app/utils/apiClient";
import withAdminAuth from "../../../components/withAdminAuth";

const EMPTY = {
    code: "", description: "", discountType: "percent", discountValue: "",
    maxDiscount: "", minOrderValue: "", usageLimit: "", perUserLimit: 1,
    validFrom: "", validUntil: "", isActive: true,
};

// A coupon is only usable if it is active, in date, and has redemptions left
function statusOf(c) {
    const now = new Date();
    if (!c.isActive) return { label: "Inactive", tone: "bg-neutral-800 text-neutral-400" };
    if (c.validUntil && new Date(c.validUntil) < now) return { label: "Expired", tone: "bg-amber-900/40 text-amber-400" };
    if (c.validFrom && new Date(c.validFrom) > now) return { label: "Scheduled", tone: "bg-blue-900/40 text-blue-400" };
    if (c.usageLimit > 0 && c.usedCount >= c.usageLimit) return { label: "Used up", tone: "bg-red-900/40 text-red-400" };
    return { label: "Live", tone: "bg-emerald-900/40 text-emerald-400" };
}

const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "");

function CouponsPage() {
    const { toast } = useToast();
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [editing, setEditing] = useState(null); // null | {} for new | coupon for edit
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get("admin/coupons", { params: { search }, meta: { auth: "admin" } });
            if (!data.error) setCoupons(data.data || []);
        } catch (error) {
            toast({ title: "Failed to load coupons", description: error?.response?.data?.msg, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [search, toast]);

    useEffect(() => { load(); }, [load]);

    const openNew = () => { setForm(EMPTY); setEditing({}); };
    const openEdit = (c) => {
        setForm({
            code: c.code, description: c.description || "", discountType: c.discountType,
            discountValue: c.discountValue, maxDiscount: c.maxDiscount || "",
            minOrderValue: c.minOrderValue || "", usageLimit: c.usageLimit || "",
            perUserLimit: c.perUserLimit ?? 1,
            validFrom: toDateInput(c.validFrom), validUntil: toDateInput(c.validUntil),
            isActive: c.isActive,
        });
        setEditing(c);
    };

    const save = async () => {
        setSaving(true);
        try {
            const payload = {
                ...form,
                discountValue: Number(form.discountValue),
                maxDiscount: Number(form.maxDiscount) || 0,
                minOrderValue: Number(form.minOrderValue) || 0,
                usageLimit: Number(form.usageLimit) || 0,
                perUserLimit: Number(form.perUserLimit) || 0,
                validFrom: form.validFrom || null,
                validUntil: form.validUntil || null,
            };
            const { data } = editing?._id
                ? await api.patch(`admin/coupons/${editing._id}`, payload, { meta: { auth: "admin" } })
                : await api.post("admin/coupons", payload, { meta: { auth: "admin" } });

            if (!data.error) {
                toast({
                    title: editing?._id ? "Coupon updated" : "Coupon created",
                    description: (
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>{data.data?.code}</span>
                        </div>
                    ),
                });
                setEditing(null);
                load();
            } else {
                toast({ title: "Could not save", description: data.msg, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Could not save", description: error?.response?.data?.msg || "Request failed", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const remove = async (c) => {
        const warning = c.usedCount > 0
            ? `${c.code} has ${c.usedCount} redemption(s), so it will be deactivated rather than deleted. Continue?`
            : `Delete ${c.code}?`;
        if (!confirm(warning)) return;
        try {
            const { data } = await api.delete(`admin/coupons/${c._id}`, { meta: { auth: "admin" } });
            toast({ title: data.error ? "Failed" : "Done", description: data.msg, variant: data.error ? "destructive" : undefined });
            load();
        } catch (error) {
            toast({ title: "Failed", description: error?.response?.data?.msg, variant: "destructive" });
        }
    };

    const set = (key, value) => setForm((p) => ({ ...p, [key]: value }));

    return (
        <div className="min-h-screen bg-[#070707] p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-600/10 border border-red-500/25 flex items-center justify-center">
                            <Ticket className="w-6 h-6 text-red-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Coupons</h1>
                            <p className="text-neutral-500 text-sm">Discount codes for the shop checkout</p>
                        </div>
                    </div>
                    <Button onClick={openNew} className="h-11 rounded-xl bg-white text-black hover:bg-neutral-200 font-semibold text-sm px-5">
                        <Plus className="w-4 h-4 mr-2" /> New coupon
                    </Button>
                </div>

                <div className="flex gap-2 mb-6">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by code"
                            className="h-11 pl-9 rounded-xl bg-white/[0.03] border-white/[0.08] text-white"
                        />
                    </div>
                    <Button onClick={load} className="h-11 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-neutral-300 hover:bg-white/[0.08]">
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                </div>

                {loading && !coupons.length ? (
                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-16 text-center text-neutral-500 text-sm animate-pulse">
                        Loading coupons...
                    </div>
                ) : coupons.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/[0.08] p-16 text-center">
                        <Ticket className="w-10 h-10 mx-auto text-neutral-700 mb-3" />
                        <p className="text-neutral-400 text-sm font-medium">No coupons yet</p>
                        <p className="text-neutral-600 text-xs mt-1">Create one to offer a discount at checkout.</p>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-white/[0.03]">
                                    <tr className="text-[10px] uppercase tracking-wider text-neutral-500">
                                        <th className="px-4 py-3 font-bold">Code</th>
                                        <th className="px-4 py-3 font-bold">Discount</th>
                                        <th className="px-4 py-3 font-bold">Conditions</th>
                                        <th className="px-4 py-3 font-bold">Used</th>
                                        <th className="px-4 py-3 font-bold">Status</th>
                                        <th className="px-4 py-3 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {coupons.map((c) => {
                                        const s = statusOf(c);
                                        return (
                                            <tr key={c._id} className="border-t border-white/[0.05] hover:bg-white/[0.015]">
                                                <td className="px-4 py-3">
                                                    <div className="font-mono text-sm font-bold text-white">{c.code}</div>
                                                    {c.description && <div className="text-[11px] text-neutral-600 mt-0.5 max-w-[220px] truncate">{c.description}</div>}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-neutral-300">
                                                    {c.discountType === "percent" ? `${c.discountValue}%` : `₹${c.discountValue}`}
                                                    {c.maxDiscount > 0 && <span className="text-[11px] text-neutral-600 block">max ₹{c.maxDiscount}</span>}
                                                </td>
                                                <td className="px-4 py-3 text-[11px] text-neutral-500 leading-relaxed">
                                                    {c.minOrderValue > 0 && <div>Min order ₹{c.minOrderValue}</div>}
                                                    {c.perUserLimit > 0 && <div>{c.perUserLimit} per customer</div>}
                                                    {c.validUntil && <div>Until {new Date(c.validUntil).toLocaleDateString("en-IN")}</div>}
                                                    {!c.minOrderValue && !c.perUserLimit && !c.validUntil && <span className="text-neutral-700">No limits</span>}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-neutral-300 tabular-nums">
                                                    {c.usedCount}{c.usageLimit > 0 ? ` / ${c.usageLimit}` : ""}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${s.tone}`}>{s.label}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button onClick={() => openEdit(c)} aria-label={`Edit ${c.code}`}
                                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/[0.06]">
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button onClick={() => remove(c)} aria-label={`Delete ${c.code}`}
                                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:text-red-400 hover:bg-red-500/10">
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {editing && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setEditing(null)} />
                    <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#0b0b0b] p-6 space-y-4 animate-scale-in">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-white">{editing._id ? "Edit coupon" : "New coupon"}</h2>
                            <button onClick={() => setEditing(null)} aria-label="Close"
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/[0.06]">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Code">
                                <Input value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())}
                                    placeholder="WELCOME10" className="h-10 rounded-lg bg-white/[0.03] border-white/[0.08] text-white font-mono" />
                            </Field>
                            <Field label="Type">
                                <div className="inline-flex rounded-lg border border-white/[0.08] overflow-hidden h-10 w-full">
                                    {["percent", "flat"].map((t) => (
                                        <button key={t} type="button" onClick={() => set("discountType", t)}
                                            className={`flex-1 text-[11px] font-bold transition-colors ${form.discountType === t ? "bg-red-600 text-white" : "text-neutral-500 hover:text-white"}`}>
                                            {t === "percent" ? "% off" : "₹ off"}
                                        </button>
                                    ))}
                                </div>
                            </Field>
                        </div>

                        <Field label="Description (shown to nobody, just your note)">
                            <Input value={form.description} onChange={(e) => set("description", e.target.value)}
                                placeholder="Launch week offer" className="h-10 rounded-lg bg-white/[0.03] border-white/[0.08] text-white" />
                        </Field>

                        <div className="grid grid-cols-2 gap-3">
                            <Field label={form.discountType === "percent" ? "Percent off" : "Rupees off"}>
                                <Input type="number" min="1" value={form.discountValue} onChange={(e) => set("discountValue", e.target.value)}
                                    className="h-10 rounded-lg bg-white/[0.03] border-white/[0.08] text-white" />
                            </Field>
                            <Field label="Max discount ₹ (0 = none)" hint={form.discountType === "flat" ? "Only applies to percentage coupons" : ""}>
                                <Input type="number" min="0" value={form.maxDiscount} onChange={(e) => set("maxDiscount", e.target.value)}
                                    disabled={form.discountType === "flat"}
                                    className="h-10 rounded-lg bg-white/[0.03] border-white/[0.08] text-white disabled:opacity-40" />
                            </Field>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Minimum order ₹">
                                <Input type="number" min="0" value={form.minOrderValue} onChange={(e) => set("minOrderValue", e.target.value)}
                                    className="h-10 rounded-lg bg-white/[0.03] border-white/[0.08] text-white" />
                            </Field>
                            <Field label="Total uses (0 = unlimited)">
                                <Input type="number" min="0" value={form.usageLimit} onChange={(e) => set("usageLimit", e.target.value)}
                                    className="h-10 rounded-lg bg-white/[0.03] border-white/[0.08] text-white" />
                            </Field>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Uses per customer (0 = unlimited)">
                                <Input type="number" min="0" value={form.perUserLimit} onChange={(e) => set("perUserLimit", e.target.value)}
                                    className="h-10 rounded-lg bg-white/[0.03] border-white/[0.08] text-white" />
                            </Field>
                            <Field label="Active">
                                <button type="button" onClick={() => set("isActive", !form.isActive)}
                                    className={`h-10 w-full rounded-lg text-[11px] font-bold transition-colors ${form.isActive ? "bg-emerald-600 text-white" : "bg-neutral-800 text-neutral-400"}`}>
                                    {form.isActive ? "Active" : "Inactive"}
                                </button>
                            </Field>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Valid from (optional)">
                                <Input type="date" value={form.validFrom} onChange={(e) => set("validFrom", e.target.value)}
                                    className="h-10 rounded-lg bg-white/[0.03] border-white/[0.08] text-white" />
                            </Field>
                            <Field label="Valid until (optional)">
                                <Input type="date" value={form.validUntil} onChange={(e) => set("validUntil", e.target.value)}
                                    className="h-10 rounded-lg bg-white/[0.03] border-white/[0.08] text-white" />
                            </Field>
                        </div>

                        {editing._id && editing.usedCount > 0 && (
                            <div className="flex gap-2.5 p-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/15">
                                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-neutral-300 leading-relaxed">
                                    This code has been redeemed {editing.usedCount} time(s). Changing the discount does not
                                    alter orders that already used it.
                                </p>
                            </div>
                        )}

                        <div className="flex gap-2 pt-2">
                            <Button onClick={() => setEditing(null)}
                                className="flex-1 h-11 rounded-lg bg-white/[0.04] border border-white/[0.08] text-neutral-300 hover:bg-white/[0.08] text-sm">
                                Cancel
                            </Button>
                            <Button onClick={save} disabled={saving}
                                className="flex-1 h-11 rounded-lg bg-white text-black hover:bg-neutral-200 font-semibold text-sm">
                                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : editing._id ? "Save changes" : "Create coupon"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function Field({ label, hint, children }) {
    return (
        <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-neutral-500 block">{label}</label>
            {children}
            {hint && <p className="text-[10px] text-neutral-600">{hint}</p>}
        </div>
    );
}

export default withAdminAuth(CouponsPage);
