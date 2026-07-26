"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
    Database, Trash2, AlertTriangle, RefreshCw, Shield, CheckCircle, ShoppingBag,
    LayoutTemplate, QrCode, Upload, CreditCard, Banknote, CalendarDays, Phone,
    Settings2, Save, Sparkles, Gift, Camera, Lock, Store, Info,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import api, { mediaUrl } from "@/app/utils/apiClient";
import { invalidateSiteConfig } from "@/app/utils/siteConfig";
import withAdminAuth from "../../../components/withAdminAuth";

// Every key this page owns. The draft is diffed against the last saved config so
// only genuinely changed keys are sent, and the "unsaved" badge can be accurate.
const EDITABLE_KEYS = [
    // shop & drop
    "shopEnabled", "weeklyDropEnabled", "dropRevealDays", "dropSaleDays", "dropPickupDays",
    "orderAutoCancelHours", "paymentProofWindowHours",
    // payments
    "qrPaymentEnabled", "codEnabled", "paymentGatewayEnabled",
    "paymentUpiId", "paymentPayeeName", "paymentWhatsapp", "paymentInstructions", "paymentQrImage",
    // features
    "giveawaysEnabled", "surpriseEnabled", "momentsEnabled",
    "showUpcoming", "showEnded", "requireSurpriseProof", "requireMomentProof", "surpriseOneActivePerUser",
    // homepage
    "homeShowStats", "homeShowSteps", "homeShowMoments", "homeShowShop",
    // contact
    "contactEmail", "contactPhone", "contactWhatsapp", "businessAddress", "instagramUrl",
];

const TABS = [
    { key: "shop", label: "Shop & Drop", icon: Store },
    { key: "payments", label: "Payments", icon: CreditCard },
    { key: "features", label: "Features", icon: Sparkles },
    { key: "homepage", label: "Homepage", icon: LayoutTemplate },
    { key: "contact", label: "Contact", icon: Phone },
    { key: "system", label: "Data & Security", icon: Shield },
];

const PHASE_LABELS = {
    pickup: "Order Pickup",
    reveal: "Product & Price Reveal",
    sale: "Sale Live",
    prep: "Preparing Orders",
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ---------------------------------------------------------------- primitives

function ToggleRow({ title, desc, value, onToggle, accent = "red", disabled = false }) {
    const on = {
        red: "bg-red-600", emerald: "bg-emerald-600", amber: "bg-amber-600",
        blue: "bg-blue-600", fuchsia: "bg-fuchsia-600", cyan: "bg-cyan-600",
    }[accent] || "bg-red-600";

    return (
        <div className={`flex items-center justify-between gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] ${disabled ? "opacity-50" : ""}`}>
            <div className="min-w-0">
                <div className="text-sm font-semibold text-white">{title}</div>
                <div className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{desc}</div>
            </div>
            <button
                type="button"
                disabled={disabled}
                onClick={onToggle}
                aria-pressed={!!value}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none shrink-0 disabled:cursor-not-allowed ${value ? on : "bg-neutral-800"}`}
            >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? "translate-x-6" : "translate-x-1"}`} />
            </button>
        </div>
    );
}

function Field({ label, hint, children }) {
    return (
        <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-500 pl-1 block">{label}</label>
            {children}
            {hint && <p className="text-[10px] text-neutral-600 pl-1 leading-relaxed">{hint}</p>}
        </div>
    );
}

function Panel({ title, desc, icon: Icon, accent = "red", children }) {
    const tone = {
        red: "bg-red-600/10 text-red-500", amber: "bg-amber-600/10 text-amber-500",
        emerald: "bg-emerald-600/10 text-emerald-500", blue: "bg-blue-600/10 text-blue-500",
        fuchsia: "bg-fuchsia-600/10 text-fuchsia-500", cyan: "bg-cyan-600/10 text-cyan-500",
        teal: "bg-teal-600/10 text-teal-500", indigo: "bg-indigo-600/10 text-indigo-500",
    }[accent];

    return (
        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            <header className="p-5 sm:p-6 border-b border-white/[0.05]">
                <h2 className="text-lg font-bold text-white flex items-center gap-3">
                    <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${tone}`}>
                        <Icon className="w-4.5 h-4.5" />
                    </span>
                    {title}
                </h2>
                {desc && <p className="text-neutral-500 text-xs mt-2 leading-relaxed">{desc}</p>}
            </header>
            <div className="p-5 sm:p-6 space-y-4">{children}</div>
        </section>
    );
}

// Weekday chip row for one drop phase. A day can only belong to one phase, so days
// taken by another phase are shown locked rather than silently rejected on save.
function DayWindowPicker({ label, hint, value, onChange, takenBy, accent = "amber" }) {
    const selected = String(value || "")
        .split(",")
        .map((d) => Number(d.trim()))
        .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);

    const toggleDay = (day) => {
        const next = selected.includes(day)
            ? selected.filter((d) => d !== day)
            : [...selected, day].sort((a, b) => a - b);
        onChange(next.join(","));
    };

    const activeTone = {
        amber: "bg-amber-600 border-amber-500 text-white",
        emerald: "bg-emerald-600 border-emerald-500 text-white",
        blue: "bg-blue-600 border-blue-500 text-white",
    }[accent];

    return (
        <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-500 pl-1 block">{label}</label>
            <div className="grid grid-cols-7 gap-1.5">
                {DAY_LABELS.map((name, day) => {
                    const isOn = selected.includes(day);
                    const owner = takenBy?.[day];
                    const locked = !isOn && !!owner;
                    return (
                        <button
                            key={day}
                            type="button"
                            onClick={() => !locked && toggleDay(day)}
                            disabled={locked}
                            title={locked ? `Used by ${owner}` : name}
                            className={`h-9 rounded-lg border text-[10px] font-bold uppercase tracking-wide transition-all ${
                                isOn ? activeTone
                                    : locked ? "bg-white/[0.01] border-white/[0.04] text-neutral-700 cursor-not-allowed"
                                        : "bg-white/[0.02] border-white/[0.06] text-neutral-400 hover:border-white/20 hover:text-white"
                            }`}
                        >
                            {name}
                        </button>
                    );
                })}
            </div>
            {hint && <p className="text-[10px] text-neutral-600 pl-1">{hint}</p>}
            {!selected.length && (
                <p className="text-[10px] text-amber-500 pl-1">Pick at least one day — this window is currently empty.</p>
            )}
        </div>
    );
}

// ---------------------------------------------------------------- config state

function useConfigDraft() {
    const { toast } = useToast();
    const [saved, setSaved] = useState(null);
    const [draft, setDraft] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get("admin/config", { meta: { auth: "admin" } });
            if (!data.error && data.config) {
                setSaved(data.config);
                setDraft(data.config);
            } else {
                toast({ title: "Failed to load settings", description: data.msg, variant: "destructive" });
            }
        } catch (error) {
            toast({
                title: "Failed to load settings",
                description: error?.response?.data?.msg || "Could not reach the server.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => { load(); }, [load]);

    const setField = useCallback((key, value) => {
        setDraft((prev) => ({ ...prev, [key]: value }));
    }, []);

    const toggle = useCallback((key) => {
        setDraft((prev) => ({ ...prev, [key]: !prev[key] }));
    }, []);

    const changedKeys = useMemo(() => {
        if (!draft || !saved) return [];
        return EDITABLE_KEYS.filter((key) => String(draft[key] ?? "") !== String(saved[key] ?? ""));
    }, [draft, saved]);

    const save = useCallback(async () => {
        if (!draft || !changedKeys.length) return;
        setSaving(true);
        try {
            const payload = Object.fromEntries(changedKeys.map((key) => [key, draft[key]]));
            const { data } = await api.post("admin/config", payload, { meta: { auth: "admin" } });
            if (!data.error) {
                invalidateSiteConfig();
                // Trust the server's echo — it normalises day lists and clamps numbers
                setSaved(data.config);
                setDraft(data.config);
                toast({
                    title: "Settings saved",
                    description: (
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>Live on the site immediately.</span>
                        </div>
                    ),
                });
            } else {
                toast({ title: "Save failed", description: data.msg, variant: "destructive" });
            }
        } catch (error) {
            toast({
                title: "Save failed",
                description: error?.response?.data?.msg || "Request failed.",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    }, [changedKeys, draft, toast]);

    const reset = useCallback(() => setDraft(saved), [saved]);

    return { draft, saved, loading, saving, setField, toggle, changedKeys, save, reset, reload: load };
}

// ---------------------------------------------------------------- page

function AdminSettings() {
    const [tab, setTab] = useState("shop");
    const cfg = useConfigDraft();
    const { draft, loading, saving, changedKeys, save, reset } = cfg;

    return (
        <div className="min-h-screen bg-[#070707] pb-28">
            <div className="p-4 md:p-8 max-w-6xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500/20 to-amber-500/5 border border-red-500/30 flex items-center justify-center shadow-[0_8px_32px_-8px_rgba(239,68,68,0.35)] shrink-0">
                        <Settings2 className="text-red-400 w-7 h-7" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-2xl md:text-4xl font-bold text-white tracking-tight">Control Centre</h1>
                        <p className="text-neutral-500 font-medium text-sm">
                            Everything on the live site — shop, payments, giveaways, surprises & moments
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-1 px-1 scrollbar-none">
                    {TABS.map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setTab(key)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
                                tab === key
                                    ? "bg-white text-black border-white"
                                    : "bg-white/[0.02] text-neutral-400 border-white/[0.06] hover:text-white hover:border-white/20"
                            }`}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            {label}
                        </button>
                    ))}
                </div>

                {loading || !draft ? (
                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-16 text-center text-neutral-500 text-sm animate-pulse">
                        Loading live configuration…
                    </div>
                ) : (
                    <div className="space-y-6">
                        {tab === "shop" && <ShopTab cfg={cfg} />}
                        {tab === "payments" && <PaymentsTab cfg={cfg} />}
                        {tab === "features" && <FeaturesTab cfg={cfg} />}
                        {tab === "homepage" && <HomepageTab cfg={cfg} />}
                        {tab === "contact" && <ContactTab cfg={cfg} />}
                        {tab === "system" && <SystemTab />}
                    </div>
                )}
            </div>

            {/* Sticky save bar — settings on this page apply to the live site, so an
                unsaved change must never be easy to walk away from. */}
            {changedKeys.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#0b0b0b]/95 backdrop-blur-xl">
                    <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                            <p className="text-xs text-neutral-300 font-semibold truncate">
                                {changedKeys.length} unsaved {changedKeys.length === 1 ? "change" : "changes"}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <Button
                                onClick={reset}
                                disabled={saving}
                                className="h-10 rounded-lg bg-white/[0.04] border border-white/[0.08] text-neutral-300 hover:bg-white/[0.08] text-xs font-semibold px-4"
                            >
                                Discard
                            </Button>
                            <Button
                                onClick={save}
                                disabled={saving}
                                className="h-10 rounded-lg bg-white text-black hover:bg-neutral-200 font-bold text-xs px-6 active:scale-[0.98] transition-all"
                            >
                                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Save className="w-3.5 h-3.5 mr-2" />Save changes</>}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------- tabs

function ShopTab({ cfg }) {
    const { draft, setField, toggle } = cfg;

    // Build a day -> owning phase map so each picker can lock days another phase owns
    const owners = useMemo(() => {
        const map = {};
        const claim = (key, name) => {
            String(draft[key] || "").split(",").forEach((d) => {
                const day = Number(d.trim());
                if (Number.isInteger(day) && day >= 0 && day <= 6) map[day] = name;
            });
        };
        claim("dropRevealDays", "Reveal");
        claim("dropSaleDays", "Sale");
        claim("dropPickupDays", "Pickup");
        return map;
    }, [draft]);

    const ownersExcept = (name) => Object.fromEntries(
        Object.entries(owners).filter(([, value]) => value !== name)
    );

    return (
        <>
            <Panel
                title="Shop"
                desc="The master switch blocks new orders while leaving the catalogue browsable."
                icon={ShoppingBag}
                accent="amber"
            >
                <ToggleRow
                    title="Shop checkout"
                    desc="Off = customers can browse products but cannot place any order"
                    value={draft.shopEnabled}
                    onToggle={() => toggle("shopEnabled")}
                    accent="amber"
                />
                <ToggleRow
                    title="Weekly drop cycle"
                    desc="Restrict ordering to the sale window below. Off = shop behaves like a regular always-open store"
                    value={draft.weeklyDropEnabled}
                    onToggle={() => toggle("weeklyDropEnabled")}
                    accent="amber"
                />

                <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/[0.06] border border-amber-500/15">
                    <Info className="w-4 h-4 text-amber-400 shrink-0" />
                    <p className="text-xs text-neutral-300">
                        Right now it is{" "}
                        <span className="text-amber-400 font-bold">
                            {PHASE_LABELS[draft.shopPhase] || draft.shopPhase}
                        </span>
                        {draft.shopPhases?.[draft.shopPhase]?.days
                            ? <span className="text-neutral-500"> ({draft.shopPhases[draft.shopPhase].days})</span>
                            : null}
                    </p>
                </div>
            </Panel>

            <Panel
                title="Weekly drop schedule"
                desc="Pick which weekdays each stage of the cycle runs on. A day can belong to only one stage; anything left over becomes the preparation day."
                icon={CalendarDays}
                accent="blue"
            >
                <DayWindowPicker
                    label="Reveal — products & prices go public"
                    value={draft.dropRevealDays}
                    onChange={(v) => setField("dropRevealDays", v)}
                    takenBy={ownersExcept("Reveal")}
                    accent="blue"
                />
                <DayWindowPicker
                    label="Sale — orders can be placed"
                    value={draft.dropSaleDays}
                    onChange={(v) => setField("dropSaleDays", v)}
                    takenBy={ownersExcept("Sale")}
                    accent="amber"
                    hint="Outside these days the cart and checkout are locked."
                />
                <DayWindowPicker
                    label="Pickup — customers collect from the store"
                    value={draft.dropPickupDays}
                    onChange={(v) => setField("dropPickupDays", v)}
                    takenBy={ownersExcept("Pickup")}
                    accent="emerald"
                    hint="Customers can only schedule a pickup slot on these days."
                />
            </Panel>

            <Panel
                title="Order housekeeping"
                desc="Automatic cleanup so unpaid orders don't hold stock forever."
                icon={Gift}
                accent="emerald"
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field
                        label="Auto-cancel unpaid orders after (hours)"
                        hint="0 = never. Stock is restored automatically. Orders already awaiting payment verification are never auto-cancelled."
                    >
                        <Input
                            type="number" min="0"
                            value={draft.orderAutoCancelHours}
                            onChange={(e) => setField("orderAutoCancelHours", e.target.value)}
                            className="h-11 rounded-lg bg-white/[0.03] border-white/[0.08] text-white"
                        />
                    </Field>
                    <Field
                        label="Payment proof window (hours)"
                        hint="How long the customer is told they have to upload the payment screenshot."
                    >
                        <Input
                            type="number" min="0"
                            value={draft.paymentProofWindowHours}
                            onChange={(e) => setField("paymentProofWindowHours", e.target.value)}
                            className="h-11 rounded-lg bg-white/[0.03] border-white/[0.08] text-white"
                        />
                    </Field>
                </div>
            </Panel>
        </>
    );
}

function PaymentsTab({ cfg }) {
    const { draft, setField, toggle } = cfg;
    const { toast } = useToast();
    const [uploadingQr, setUploadingQr] = useState(false);
    const fileRef = useRef(null);

    const gatewayReady = draft.onlinePaymentReady || draft.sandboxPaymentsAllowed;

    const handleQrUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingQr(true);
        const formData = new FormData();
        formData.append("image", file);
        try {
            const { data } = await api.post("upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
                meta: { auth: "admin" },
            });
            if (!data.error && data.url) {
                setField("paymentQrImage", data.url);
                toast({ title: "QR image uploaded", description: "Hit Save changes to publish it." });
            } else {
                toast({ title: "Upload failed", description: data.msg, variant: "destructive" });
            }
        } catch (error) {
            toast({
                title: "Upload failed",
                description: error?.response?.data?.msg || "Could not upload image",
                variant: "destructive",
            });
        }
        setUploadingQr(false);
        if (fileRef.current) fileRef.current.value = "";
    };

    return (
        <>
            <Panel
                title="Payment methods"
                desc="What customers can choose at checkout. At least one must stay on, or checkout is blocked."
                icon={CreditCard}
                accent="emerald"
            >
                <ToggleRow
                    title="UPI QR + screenshot"
                    desc="Customer scans your QR, pays, then uploads the payment screenshot for you to verify"
                    value={draft.qrPaymentEnabled}
                    onToggle={() => toggle("qrPaymentEnabled")}
                    accent="emerald"
                />
                <ToggleRow
                    title="Cash on pickup"
                    desc="Customer pays in cash when collecting the order from the store"
                    value={draft.codEnabled}
                    onToggle={() => toggle("codEnabled")}
                    accent="emerald"
                />
                <ToggleRow
                    title="Online payment gateway"
                    desc={gatewayReady
                        ? "Card / UPI gateway checkout"
                        : "No live gateway is connected yet — this stays hidden at checkout until one is wired up"}
                    value={draft.paymentGatewayEnabled}
                    onToggle={() => toggle("paymentGatewayEnabled")}
                    accent="emerald"
                />

                {draft.paymentGatewayEnabled && !gatewayReady && (
                    <div className="flex gap-3 p-4 rounded-xl bg-amber-500/[0.06] border border-amber-500/15">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-neutral-300 leading-relaxed">
                            Provider is <span className="text-amber-400 font-semibold">{draft.paymentsProvider}</span>, which cannot
                            actually collect money. Customers will not see the &quot;Pay Online&quot; option and the server refuses to mark
                            any order as paid through it — use UPI QR or cash on pickup until a real gateway is integrated.
                        </p>
                    </div>
                )}

                {!draft.qrPaymentEnabled && !draft.codEnabled && !gatewayReady && (
                    <div className="flex gap-3 p-4 rounded-xl bg-red-500/[0.06] border border-red-500/20">
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-red-200 leading-relaxed">
                            No usable payment method is enabled — customers cannot check out at all.
                        </p>
                    </div>
                )}
            </Panel>

            <Panel
                title="Your payment details"
                desc="Shown to the customer right after they place an order, on the payment screen and in the order email."
                icon={QrCode}
                accent="amber"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="UPI ID" hint="Used to auto-generate a QR if you don't upload one.">
                        <Input
                            value={draft.paymentUpiId}
                            onChange={(e) => setField("paymentUpiId", e.target.value)}
                            placeholder="yourupi@bank"
                            className="h-11 rounded-lg bg-white/[0.03] border-white/[0.08] text-white"
                        />
                    </Field>
                    <Field label="Payee name">
                        <Input
                            value={draft.paymentPayeeName}
                            onChange={(e) => setField("paymentPayeeName", e.target.value)}
                            placeholder="OneMoreGift"
                            className="h-11 rounded-lg bg-white/[0.03] border-white/[0.08] text-white"
                        />
                    </Field>
                    <Field label="WhatsApp number for payment screenshots" hint="With country code, digits only — e.g. 919876543210">
                        <Input
                            value={draft.paymentWhatsapp}
                            onChange={(e) => setField("paymentWhatsapp", e.target.value.replace(/[^\d+]/g, ""))}
                            placeholder="919876543210"
                            className="h-11 rounded-lg bg-white/[0.03] border-white/[0.08] text-white"
                        />
                    </Field>
                    <Field label="Payment QR image" hint="Optional — overrides the auto-generated UPI QR.">
                        <div className="flex items-center gap-3">
                            {draft.paymentQrImage ? (
                                <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/10 bg-white shrink-0">
                                    <img src={mediaUrl(draft.paymentQrImage)} alt="Payment QR" className="w-full h-full object-contain" />
                                    <button
                                        type="button"
                                        onClick={() => setField("paymentQrImage", "")}
                                        className="absolute top-0 right-0 bg-black/80 text-white text-[10px] px-1.5 py-0.5 hover:text-red-400"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <div className="w-16 h-16 rounded-xl border border-dashed border-white/15 flex items-center justify-center text-neutral-600 shrink-0">
                                    <QrCode className="w-6 h-6" />
                                </div>
                            )}
                            <label className="flex-1 flex items-center justify-center gap-2 h-11 border border-white/10 border-dashed rounded-lg cursor-pointer bg-white/[0.01] hover:bg-white/[0.04] transition-all text-xs text-neutral-400">
                                <Upload className={`w-4 h-4 ${uploadingQr ? "animate-bounce text-amber-400" : ""}`} />
                                {uploadingQr ? "Uploading…" : "Upload QR"}
                                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleQrUpload} disabled={uploadingQr} />
                            </label>
                        </div>
                    </Field>
                </div>

                <Field label="Payment instructions" hint="Shown under the QR. Keep it short and specific.">
                    <textarea
                        value={draft.paymentInstructions}
                        onChange={(e) => setField("paymentInstructions", e.target.value)}
                        rows={3}
                        className="w-full rounded-lg bg-white/[0.03] border border-white/[0.08] text-white text-sm p-3 focus:outline-none focus:border-amber-500/50 resize-none"
                    />
                </Field>
            </Panel>
        </>
    );
}

function FeaturesTab({ cfg }) {
    const { draft, toggle } = cfg;
    return (
        <>
            <Panel
                title="Feature switches"
                desc="Turn whole sections of the site on or off. Existing data is never touched — off simply stops new submissions and hides the nav link."
                icon={Sparkles}
                accent="cyan"
            >
                <ToggleRow title="Giveaways" desc="Users can browse and enter giveaways" value={draft.giveawaysEnabled} onToggle={() => toggle("giveawaysEnabled")} accent="cyan" />
                <ToggleRow title="Surprise applications" desc="Users can apply for a surprise gift" value={draft.surpriseEnabled} onToggle={() => toggle("surpriseEnabled")} accent="cyan" />
                <ToggleRow title="Happy moments" desc="Users can share their moments to the public gallery" value={draft.momentsEnabled} onToggle={() => toggle("momentsEnabled")} accent="cyan" />
            </Panel>

            <Panel title="Giveaway visibility" desc="Which giveaways appear in public listings." icon={Gift} accent="blue">
                <ToggleRow title="Show upcoming" desc="List giveaways that haven't started yet" value={draft.showUpcoming} onToggle={() => toggle("showUpcoming")} accent="blue" />
                <ToggleRow title="Show ended" desc="Keep finished giveaways in public lists" value={draft.showEnded} onToggle={() => toggle("showEnded")} accent="blue" />
            </Panel>

            <Panel
                title="Surprises & moments rules"
                desc="Verification requirements and application limits."
                icon={Camera}
                accent="fuchsia"
            >
                <ToggleRow title="Require surprise proof" desc="Applicants must upload supporting documents" value={draft.requireSurpriseProof} onToggle={() => toggle("requireSurpriseProof")} accent="fuchsia" />
                <ToggleRow title="Require moment proof" desc="Users must attach verification proof with a shared moment" value={draft.requireMomentProof} onToggle={() => toggle("requireMomentProof")} accent="fuchsia" />
                <ToggleRow title="One application per user" desc="A user can only have one surprise application in flight at a time" value={draft.surpriseOneActivePerUser} onToggle={() => toggle("surpriseOneActivePerUser")} accent="fuchsia" />
            </Panel>
        </>
    );
}

function HomepageTab({ cfg }) {
    const { draft, toggle } = cfg;
    return (
        <Panel
            title="Homepage sections"
            desc="Toggle which showcase blocks render on the public homepage."
            icon={LayoutTemplate}
            accent="fuchsia"
        >
            <ToggleRow title="Hero stats" desc="Animated live counters in the hero section" value={draft.homeShowStats} onToggle={() => toggle("homeShowStats")} accent="fuchsia" />
            <ToggleRow title="How it works" desc="The animated 3-step process strip" value={draft.homeShowSteps} onToggle={() => toggle("homeShowSteps")} accent="fuchsia" />
            <ToggleRow title="Popular moments" desc="Showcase of happy moments shared by users" value={draft.homeShowMoments} onToggle={() => toggle("homeShowMoments")} accent="fuchsia" />
            <ToggleRow title="Featured products" desc="Showcase of products from the shop" value={draft.homeShowShop} onToggle={() => toggle("homeShowShop")} accent="fuchsia" />
        </Panel>
    );
}

function ContactTab({ cfg }) {
    const { draft, setField } = cfg;
    return (
        <Panel
            title="Contact & business details"
            desc="Shown in the site footer and on help sections. Leave a field empty to hide it."
            icon={Phone}
            accent="teal"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Contact email">
                    <Input
                        value={draft.contactEmail}
                        onChange={(e) => setField("contactEmail", e.target.value)}
                        placeholder="contact@onemoregift.in"
                        className="h-11 rounded-lg bg-white/[0.03] border-white/[0.08] text-white"
                    />
                </Field>
                <Field label="Contact phone">
                    <Input
                        value={draft.contactPhone}
                        onChange={(e) => setField("contactPhone", e.target.value)}
                        placeholder="+91 98765 43210"
                        className="h-11 rounded-lg bg-white/[0.03] border-white/[0.08] text-white"
                    />
                </Field>
                <Field label="WhatsApp number" hint="Country code, digits only — used for the footer chat link.">
                    <Input
                        value={draft.contactWhatsapp}
                        onChange={(e) => setField("contactWhatsapp", e.target.value.replace(/[^\d+]/g, ""))}
                        placeholder="919876543210"
                        className="h-11 rounded-lg bg-white/[0.03] border-white/[0.08] text-white"
                    />
                </Field>
                <Field label="Instagram URL">
                    <Input
                        value={draft.instagramUrl}
                        onChange={(e) => setField("instagramUrl", e.target.value)}
                        placeholder="https://instagram.com/…"
                        className="h-11 rounded-lg bg-white/[0.03] border-white/[0.08] text-white"
                    />
                </Field>
            </div>

            <Field label="Shop / business address" hint="Appears in the footer. Use separate lines for street, city and pincode.">
                <textarea
                    value={draft.businessAddress}
                    onChange={(e) => setField("businessAddress", e.target.value)}
                    rows={3}
                    placeholder={"Shop 12, Main Market\nJhajjar, Haryana 124103"}
                    className="w-full rounded-lg bg-white/[0.03] border border-white/[0.08] text-white text-sm p-3 focus:outline-none focus:border-teal-500/50 resize-none"
                />
            </Field>
        </Panel>
    );
}

// ---------------------------------------------------------------- system tab

function SystemTab() {
    return (
        <>
            <DbStatusPanel />
            <BackupPanel />
            <SecurityPanel />
            <MaintenancePanel />
        </>
    );
}

function DbStatusPanel() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);

    const fetchDbStatus = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get("admin/maintenance/db-status", { meta: { auth: "admin" } });
            if (!data.error && data.stats) setStats(data.stats);
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch database status", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => { fetchDbStatus(); }, [fetchDbStatus]);

    return (
        <Panel title="Database status" desc="Live document counts." icon={Database} accent="indigo">
            {loading && !stats ? (
                <div className="text-neutral-500 text-sm animate-pulse py-6 text-center">Loading metrics…</div>
            ) : stats ? (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[
                            { label: "Users", value: stats.users },
                            { label: "Giveaways", value: stats.giveaways },
                            { label: "Entries", value: stats.entries },
                            { label: "Banned users", value: stats.bannedUsers },
                            { label: "Administrators", value: stats.admins },
                        ].map(({ label, value }) => (
                            <div key={label} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                                <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">{label}</div>
                                <div className="text-2xl font-extrabold text-white mt-1">{value}</div>
                            </div>
                        ))}
                    </div>
                    <Button
                        onClick={fetchDbStatus}
                        disabled={loading}
                        className="w-full h-10 rounded-lg bg-white/[0.04] border border-white/[0.08] text-neutral-300 hover:bg-white/[0.08] text-xs font-semibold"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </>
            ) : (
                <div className="text-red-400 text-sm py-6 text-center">Failed to load statistics.</div>
            )}
        </Panel>
    );
}

function BackupPanel() {
    const { toast } = useToast();
    const [downloading, setDownloading] = useState(false);
    const [includeMedia, setIncludeMedia] = useState(false);

    const handleDownload = async () => {
        setDownloading(true);
        try {
            const response = await api.get("admin/maintenance/backup", {
                params: includeMedia ? { includeMedia: 1 } : {},
                responseType: "blob",
                timeout: 300000,
                meta: { auth: "admin" },
            });
            const disposition = response.headers["content-disposition"] || "";
            const match = disposition.match(/filename="(.+)"/);
            const filename = match ? match[1] : `omg-backup-${new Date().toISOString().slice(0, 10)}.json.gz`;

            const url = window.URL.createObjectURL(response.data);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            toast({ title: "Backup downloaded", description: filename });
        } catch (error) {
            const msg = error?.response?.status === 403
                ? "Root admin access required for backups."
                : error?.response?.data?.msg || "Backup download failed.";
            toast({ title: "Backup failed", description: msg, variant: "destructive" });
        } finally {
            setDownloading(false);
        }
    };

    return (
        <Panel
            title="Database backup"
            desc="Full gzipped JSON snapshot of every collection (root admin only). Personal data stays encrypted inside the dump."
            icon={Database}
            accent="teal"
        >
            <label className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] cursor-pointer">
                <input
                    type="checkbox"
                    checked={includeMedia}
                    onChange={(e) => setIncludeMedia(e.target.checked)}
                    className="accent-teal-500 w-4 h-4"
                />
                <div>
                    <div className="text-sm font-semibold text-white">Include media blobs</div>
                    <div className="text-xs text-neutral-500 mt-0.5">Adds DB-stored images/videos — makes the file much larger</div>
                </div>
            </label>
            <Button
                onClick={handleDownload}
                disabled={downloading}
                className="w-full h-11 rounded-lg bg-white text-black hover:bg-neutral-200 font-semibold text-sm active:scale-[0.98] transition-all"
            >
                {downloading ? <RefreshCw className="animate-spin w-4 h-4" /> : "Download full backup (.json.gz)"}
            </Button>
        </Panel>
    );
}

function SecurityPanel() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!currentPassword || !newPassword) return;
        if (newPassword.length < 6) {
            toast({ title: "Invalid password", description: "New password must be at least 6 characters.", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            const { data } = await api.patch("admin/change-password", { currentPassword, newPassword }, { meta: { auth: "admin" } });
            if (!data.error) {
                toast({
                    title: "Security updated",
                    description: (
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>Your admin password has been changed.</span>
                        </div>
                    ),
                });
                setCurrentPassword("");
                setNewPassword("");
            } else {
                toast({ title: "Update failed", description: data.msg, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: error?.response?.data?.msg || "Request failed.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Panel title="Security & access" desc="Update your administrator credentials." icon={Lock} accent="emerald">
            <form onSubmit={handleUpdate} className="space-y-4">
                <Field label="Current password">
                    <Input
                        type="password" required placeholder="••••••••"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="h-11 rounded-lg bg-white/[0.03] border-white/[0.08] text-white"
                    />
                </Field>
                <Field label="New password">
                    <Input
                        type="password" required placeholder="Min 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="h-11 rounded-lg bg-white/[0.03] border-white/[0.08] text-white"
                    />
                </Field>
                <Button
                    type="submit"
                    disabled={loading || !currentPassword || !newPassword}
                    className="w-full h-11 rounded-lg bg-white text-black hover:bg-neutral-200 font-semibold text-sm active:scale-[0.98] transition-all"
                >
                    {loading ? <RefreshCw className="animate-spin w-4 h-4" /> : "Update credentials"}
                </Button>
            </form>
        </Panel>
    );
}

function MaintenancePanel() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const handleClearAll = async () => {
        if (!confirm("CRITICAL: This will clear ALL participations system-wide. Are you absolutely sure?")) return;
        setLoading(true);
        try {
            const { data } = await api.post("admin/maintenance/clear-all", {}, { meta: { auth: "admin" } });
            if (!data.error) {
                toast({ title: "System reset successful", description: "All entries have been cleared." });
            } else {
                toast({ title: "Error", description: data.msg, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Failed", description: error?.response?.data?.msg || "Maintenance action failed.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Panel
            title="Maintenance"
            desc="Irreversibly clear every participation record. Used for a season reset."
            icon={Trash2}
            accent="red"
        >
            <div className="p-4 rounded-xl bg-red-600/5 border border-red-600/15 flex gap-3">
                <AlertTriangle className="text-red-500 w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-xs text-neutral-400 leading-relaxed">
                    Wipes the <code className="text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">JoinedGiveaway</code> collection and
                    resets participant lists on every giveaway. This cannot be undone — take a backup first.
                </p>
            </div>
            <Button
                variant="destructive"
                className="w-full h-11 rounded-lg font-semibold text-sm active:scale-[0.98] transition-all"
                onClick={handleClearAll}
                disabled={loading}
            >
                {loading ? <RefreshCw className="animate-spin w-4 h-4" /> : <><Trash2 className="mr-2 w-4 h-4" />Purge all participation data</>}
            </Button>
        </Panel>
    );
}

export default withAdminAuth(AdminSettings);
