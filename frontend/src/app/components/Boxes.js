"use client";
import Image from "next/image";
import gift1 from "../../../public/images/gift-1.png";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { useState, useEffect, useCallback, useRef } from "react";
import { HiClock, HiArrowRight } from "react-icons/hi";
import { CheckCircle, Flame, Clock, CalendarClock, Trophy, Users, ShieldAlert, Sparkles, MapPin, User, AlertCircle, Gift } from "lucide-react";
import {
    Dialog, DialogContent, DialogDescription,
    DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useRouter, usePathname } from "next/navigation";
import api from "../utils/apiClient";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { VerificationIcon, UserIcon, ShieldIcon } from "./SVGIcons";
import RevealOnScroll from "./RevealOnScroll";
import SearchableSelect from "./SearchableSelect";

dayjs.extend(utc);
dayjs.extend(timezone);

const TABS = [
    { key: "active",   label: "Live Now",  icon: Flame },
    { key: "upcoming", label: "Upcoming",  icon: CalendarClock },
];

const ALTCHA_CHALLENGE_URL = process.env.NEXT_PUBLIC_ALTCHA_CHALLENGE_URL;

export default function Giveaways() {
    const router = useRouter();
    const pathname = usePathname();
    const [items, setItems] = useState([]);
    const [activeTab, setActiveTab] = useState("active");
    const { userAuthenticated } = useAuth();

    // Dialog state for entry form
    const [entryDialogOpen, setEntryDialogOpen] = useState(false);
    const [selectedGiveaway, setSelectedGiveaway] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [isSubmittingEntry, setIsSubmittingEntry] = useState(false);
    const [addressSelection, setAddressSelection] = useState("saved");
    const [savedAddressIndex, setSavedAddressIndex] = useState(0);
    const [newAddressData, setNewAddressData] = useState({ name: "", phone: "", line1: "", line2: "", country: "", countryCode: "", state: "", pincode: "" });
    
    // Captcha states
    const [isCaptchaValid, setIsCaptchaValid] = useState(false);
    const [altchaLoaded, setAltchaLoaded] = useState(false);
    const altchaRef = useRef(null);

    // Countries / States
    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);

    // Celebration
    const [showCelebration, setShowCelebration] = useState(false);
    const [celebratingName, setCelebratingName] = useState("");

    const fetchItems = useCallback(async () => {
        try {
            const response = await api.get("giveaway");
            setItems(response.data.data || []);
        } catch (error) {
            console.error("Error fetching giveaways:", error);
        }
    }, []);

    useEffect(() => {
        fetchItems();
        const interval = setInterval(fetchItems, 20000);
        return () => clearInterval(interval);
    }, [fetchItems]);

    const activeGiveaways   = items.filter(g => g.status === "active");
    const upcomingGiveaways = items.filter(g => g.status === "upcoming");

    // Auto-switch to upcoming if no active
    useEffect(() => {
        if (activeGiveaways.length === 0 && upcomingGiveaways.length > 0) {
            setActiveTab("upcoming");
        }
    }, [activeGiveaways.length, upcomingGiveaways.length]);

    // Fetch profile and other details when entry dialog opens
    const handleOpenEntry = async (item) => {
        setSelectedGiveaway(item);
        setEntryDialogOpen(true);
        setLoadingProfile(true);
        setIsCaptchaValid(false);
        try {
            const { data } = await api.get("profile/", { meta: { auth: "user" } });
            const p = data.myProfile;
            setProfile(p);
            
            const hasSaved = Boolean(
                (Array.isArray(p.addresses) && p.addresses.length > 0) ||
                (p.address && String(p.address).trim())
            );
            setAddressSelection(hasSaved ? "saved" : "new");

            const savedAddresses = Array.isArray(p.addresses) ? p.addresses : [];
            const defIdx = savedAddresses.findIndex(a => a.isDefault);
            setSavedAddressIndex(defIdx >= 0 ? defIdx : 0);

            // Fetch countries
            const { Country } = await import("country-state-city");
            setCountries(Country.getAllCountries());
        } catch (error) {
            console.error("Failed to load profile", error);
        } finally {
            setLoadingProfile(false);
        }
    };

    // Fetch states when country changes
    useEffect(() => {
        if (newAddressData.countryCode) {
            import("country-state-city").then(({ State }) => {
                setStates(State.getStatesOfCountry(newAddressData.countryCode));
            }).catch(console.error);
        } else {
            setStates([]);
        }
    }, [newAddressData.countryCode]);

    // Handle Altcha load and solution
    useEffect(() => {
        if (entryDialogOpen && ALTCHA_CHALLENGE_URL) {
            import("altcha").then(() => {
                setAltchaLoaded(true);
                const el = altchaRef.current;
                if (!el) return;
                const onVerified = async (e) => {
                    const payload = e?.detail?.payload;
                    if (!payload) { setIsCaptchaValid(false); return; }
                    try {
                        const r = await axios.post("/api/verify-captcha", { payload });
                        setIsCaptchaValid(r.data.success);
                    } catch { setIsCaptchaValid(false); }
                };
                const onStateChange = (e) => { if (e?.detail?.state !== "verified") setIsCaptchaValid(false); };
                el.addEventListener("verified", onVerified);
                el.addEventListener("statechange", onStateChange);
                return () => { el.removeEventListener("verified", onVerified); el.removeEventListener("statechange", onStateChange); };
            }).catch(console.error);
        }
    }, [entryDialogOpen, altchaLoaded]);

    const getSelectedAddress = () => {
        if (addressSelection === "saved") {
            const savedAddresses = Array.isArray(profile?.addresses) ? profile.addresses : [];
            const sel = savedAddresses[savedAddressIndex];
            if (sel) return [sel.name, sel.phone, sel.line1, sel.line2, sel.city, sel.state, sel.country, sel.postalCode].filter(Boolean).join(", ");
            return profile?.address || "";
        }
        return [newAddressData.name, newAddressData.phone, newAddressData.line1, newAddressData.line2, newAddressData.state, newAddressData.country, newAddressData.pincode].filter(Boolean).join(", ");
    };

    const submitEntry = async () => {
        if (!profile?.phone || !String(profile.phone).trim()) {
            return;
        }
        const address = getSelectedAddress();
        if (!address?.trim()) {
            return;
        }
        if (addressSelection === "new") {
            if (!newAddressData.name || !newAddressData.phone || !newAddressData.line1 || !newAddressData.country || !newAddressData.state || !newAddressData.pincode) {
                return;
            }
        }
        if (ALTCHA_CHALLENGE_URL && !isCaptchaValid && process.env.NODE_ENV !== "development") {
            return;
        }

        setIsSubmittingEntry(true);
        try {
            if (addressSelection === "new" && address && address !== (profile.address || "")) {
                await api.patch("profile/update", { address }, { meta: { auth: "user" } });
            }
            const { data } = await api.post("giveaway/participate/" + selectedGiveaway._id, {}, { meta: { auth: "user" } });
            if (!data.error) {
                setEntryDialogOpen(false);
                setCelebratingName(profile.name || "");
                setShowCelebration(true);
                
                // Confetti trigger
                import("canvas-confetti").then((m) => {
                    const confetti = m.default;
                    const defaults = { origin: { y: 0.6 }, colors: ["#ef4444", "#dc2626", "#f97316", "#fbbf24", "#ffffff", "#a78bfa"], zIndex: 9999 };
                    const fire = (r, opts) => confetti(Object.assign({}, defaults, opts, { particleCount: Math.floor(300 * r) }));
                    fire(0.25, { spread: 26, startVelocity: 55 });
                    fire(0.2, { spread: 60 });
                    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
                    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
                    fire(0.1, { spread: 120, startVelocity: 45 });
                }).catch(console.error);

                setTimeout(() => {
                    setShowCelebration(false);
                    fetchItems();
                }, 3500);
            }
        } catch (error) {
            console.error("Entry failed", error);
        } finally {
            setIsSubmittingEntry(false);
        }
    };

    const displayed = activeTab === "active" ? activeGiveaways : upcomingGiveaways;
    const hasAny = items.length > 0;

    return (
        <section className="section-dark py-20 px-4 relative">
            {showCelebration && <CelebrationOverlay name={celebratingName} />}

            {/* Header */}
            <RevealOnScroll className="max-w-7xl mx-auto mb-10 text-center" delayMs={80}>
                {/* <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4 border border-white/[0.06]">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-neutral-400 text-sm font-medium">Contests</span>
                </div> */}
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                    Active & <span className="text-gradient">Upcoming</span> Giveaways
                </h2>
                <p className="text-neutral-500 text-lg max-w-2xl mx-auto">
                    Enter our exclusive giveaways and stand a chance to win amazing prizes.
                </p>
            </RevealOnScroll>

            {/* Tabs */}
            {hasAny && (
                <div className="max-w-7xl mx-auto mb-8 flex items-center gap-3 flex-wrap">
                    {TABS.map(({ key, label, icon: Icon }) => {
                        const count = key === "active" ? activeGiveaways.length : upcomingGiveaways.length;
                        const isActive = activeTab === key;
                        return (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                                    isActive
                                        ? key === "active"
                                            ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                                            : "bg-blue-500/15 border-blue-500/40 text-blue-400"
                                        : "border-white/[0.07] bg-white/[0.02] text-neutral-500 hover:text-neutral-300 hover:border-white/20"
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                {label}
                                <span className={`px-1.5 py-0.5 rounded-md text-xs font-bold ${
                                    isActive
                                        ? key === "active" ? "bg-emerald-500/20 text-emerald-300" : "bg-blue-500/20 text-blue-300"
                                        : "bg-white/[0.06] text-neutral-500"
                                }`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Grid */}
            <div className="max-w-7xl mx-auto">
                {displayed.length === 0 ? (
                    <div className="glass rounded-2xl p-16 text-center border border-white/[0.06]">
                        <div className="w-20 h-20 rounded-full bg-red-600/10 flex items-center justify-center mx-auto mb-6">
                            <VerificationIcon className="w-12 h-12" />
                        </div>
                        <h3 className="text-2xl font-semibold text-white mb-2">
                            {activeTab === "active" ? "No Live Giveaways" : "No Upcoming Giveaways"}
                        </h3>
                        <p className="text-neutral-500 mb-6">
                            {activeTab === "active"
                                ? upcomingGiveaways.length > 0
                                    ? `${upcomingGiveaways.length} upcoming giveaway${upcomingGiveaways.length > 1 ? "s" : ""} — check the Upcoming tab!`
                                    : "Check back soon for new exciting contests!"
                                : "Stay tuned — new giveaways are being planned!"}
                        </p>
                        {activeTab === "active" && upcomingGiveaways.length > 0 && (
                            <button
                                className="btn-outline-premium px-6 py-3 rounded-xl"
                                onClick={() => setActiveTab("upcoming")}
                            >
                                View Upcoming
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayed.map((item) => (
                            <GiveawayCard
                                key={item._id}
                                item={item}
                                loggedIn={userAuthenticated}
                                router={router}
                                onEnter={() => handleOpenEntry(item)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* View All */}
            {hasAny && pathname !== "/giveaway" && (
                <div className="text-center mt-12">
                    <button
                        className="btn-outline-premium px-8 py-3 rounded-xl inline-flex items-center gap-2 group"
                        onClick={() => router.push("/giveaway")}
                    >
                        View All Giveaways
                        <HiArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            )}

            {/* Inline Single Step Entry Dialog */}
            <Dialog open={entryDialogOpen} onOpenChange={setEntryDialogOpen}>
                <DialogContent className="bg-neutral-950/90 backdrop-blur-2xl border border-white/10 rounded-[24px] w-[92vw] sm:w-[500px] md:w-[540px] mx-auto overflow-y-auto overflow-x-hidden max-h-[95vh] sm:max-h-[90vh] shadow-[0_0_80px_rgba(220,38,38,0.08)] p-4 sm:p-5 custom-scrollbar">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-red-500/10 rounded-full blur-[60px] pointer-events-none" />
                    
                    <DialogHeader className="text-center relative z-10">
                        <div className="flex justify-center mb-3 relative">
                            <div className="absolute inset-[-6px] rounded-full border border-red-500/20 animate-[ping_3s_infinite] pointer-events-none" />
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center p-1 shadow-2xl relative">
                                <Image src={selectedGiveaway?.image || gift1} height={64} width={64} className="object-cover rounded-full w-full h-full" alt="Giveaway Image" unoptimized />
                            </div>
                        </div>
                        <DialogTitle className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mb-0.5">Enter {selectedGiveaway?.title}</DialogTitle>
                        <DialogDescription className="text-neutral-400 text-xs sm:text-sm max-w-sm mx-auto font-medium">
                            Verify your details below to secure your entry instantly.
                        </DialogDescription>
                    </DialogHeader>

                    {loadingProfile ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-4">
                            <div className="w-8 h-8 border-4 border-white/10 border-t-red-500 rounded-full animate-spin" />
                            <p className="text-neutral-400 text-xs font-medium animate-pulse">Loading profile...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4 pt-2 relative z-10">
                            {/* Personal Details */}
                            <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-3 sm:p-4 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full blur-2xl group-hover:bg-white/[0.04] transition-colors pointer-events-none" />
                                <div className="flex items-center justify-between mb-3 relative z-10">
                                    <div className="flex items-center gap-2 text-neutral-200 text-xs sm:text-sm font-semibold">
                                        <div className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center">
                                            <User className="w-3.5 h-3.5 text-red-400" />
                                        </div>
                                        Personal Details
                                    </div>
                                    <button onClick={() => router.push("/my-profile/edit")} className="text-[10px] sm:text-xs text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1 rounded-full transition-all font-medium border border-white/5">
                                        Edit Profile
                                    </button>
                                </div>

                                {(!profile?.phone || !String(profile.phone).trim()) ? (
                                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-amber-200 text-xs flex items-start gap-2 relative z-10">
                                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                        <span>Mobile number is required. Please edit your profile to add a phone number before entering.</span>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 relative z-10">
                                        {[
                                            { label: "Name", value: profile?.name },
                                            { label: "Phone", value: profile?.phone },
                                            { label: "Email", value: profile?.email },
                                        ].map(({ label, value }) => (
                                            <div key={label} className="bg-black/40 border border-white/5 px-3 py-2 rounded-xl">
                                                <p className="text-[9px] text-neutral-500 uppercase tracking-wider mb-0.5 font-bold">{label}</p>
                                                <p className="text-neutral-200 text-xs font-medium truncate">{value || <span className="text-neutral-600 italic">Not set</span>}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Shipping Address */}
                            <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-3 sm:p-4 relative overflow-hidden group">
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/[0.02] rounded-full blur-2xl group-hover:bg-white/[0.04] transition-colors pointer-events-none" />
                                <div className="flex items-center gap-2 text-neutral-200 text-xs sm:text-sm font-semibold mb-3 relative z-10">
                                    <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center">
                                        <MapPin className="w-3.5 h-3.5 text-blue-400" />
                                    </div>
                                    Shipping Address
                                </div>
                                
                                <div className="p-1 rounded-xl bg-black/40 border border-white/5 flex gap-1 mb-3 relative z-10">
                                    <button type="button" onClick={() => setAddressSelection("saved")} disabled={!profile?.address && !(profile?.addresses?.length > 0)}
                                        className={`flex-1 h-8 rounded-lg text-xs font-semibold transition-all ${addressSelection === "saved" ? "bg-white/10 text-white shadow-sm" : "text-neutral-400 hover:text-neutral-200 hover:bg-white/5"} ${(!profile?.address && !(profile?.addresses?.length > 0)) ? "opacity-30 cursor-not-allowed" : ""}`}>
                                        Saved Address
                                    </button>
                                    <button type="button" onClick={() => setAddressSelection("new")}
                                        className={`flex-1 h-8 rounded-lg text-xs font-semibold transition-all ${addressSelection === "new" ? "bg-white/10 text-white shadow-sm" : "text-neutral-400 hover:text-neutral-200 hover:bg-white/5"}`}>
                                        New Address
                                    </button>
                                </div>

                                <div className="relative z-10">
                                    {addressSelection === "saved" && profile?.addresses?.length > 0 && (
                                        <div className="space-y-2">
                                            <SearchableSelect
                                                value={savedAddressIndex.toString()}
                                                onChange={(val) => setSavedAddressIndex(Number(val))}
                                                options={profile.addresses.map((a, i) => ({
                                                    value: i.toString(),
                                                    label: (a.label || "Address " + (i + 1)) + (a.isDefault ? " (Default)" : "")
                                                }))}
                                                placeholder="Select Saved Address"
                                            />
                                            <div className="bg-black/40 border border-white/5 px-3 py-2.5 rounded-xl text-neutral-300 text-xs leading-relaxed">
                                                {[profile.addresses[savedAddressIndex]?.line1, profile.addresses[savedAddressIndex]?.line2, profile.addresses[savedAddressIndex]?.city, profile.addresses[savedAddressIndex]?.state, profile.addresses[savedAddressIndex]?.country, profile.addresses[savedAddressIndex]?.postalCode].filter(Boolean).join(", ")}
                                            </div>
                                        </div>
                                    )}
                                    {addressSelection === "saved" && !(profile?.addresses?.length > 0) && profile?.address && (
                                        <div className="bg-black/40 border border-white/5 px-3 py-2.5 rounded-xl text-neutral-300 text-xs leading-relaxed">{profile.address}</div>
                                    )}
                                    {addressSelection === "saved" && !profile?.address && !(profile?.addresses?.length > 0) && (
                                        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-amber-200 text-xs">
                                            No saved address found. Please select &quot;New Address&quot; above to add one.
                                        </div>
                                    )}

                                    {addressSelection === "new" && (
                                        <div className="space-y-2">
                                            <div className="grid grid-cols-2 gap-2">
                                                <input type="text" value={newAddressData.name} onChange={e => setNewAddressData({ ...newAddressData, name: e.target.value })} placeholder="Receiver Name *" className="w-full h-9 px-3 rounded-xl text-white placeholder:text-neutral-600 bg-black/40 border border-white/10 hover:border-white/20 focus:border-white/30 transition-colors text-xs outline-none" />
                                                <input type="tel" value={newAddressData.phone} onChange={e => setNewAddressData({ ...newAddressData, phone: e.target.value })} placeholder="Phone Number *" className="w-full h-9 px-3 rounded-xl text-white placeholder:text-neutral-600 bg-black/40 border border-white/10 hover:border-white/20 focus:border-white/30 transition-colors text-xs outline-none" />
                                            </div>
                                            <input type="text" value={newAddressData.line1} onChange={e => setNewAddressData({ ...newAddressData, line1: e.target.value })} placeholder="Address Line 1 *" className="w-full h-9 px-3 rounded-xl text-white placeholder:text-neutral-600 bg-black/40 border border-white/10 hover:border-white/20 focus:border-white/30 transition-colors text-xs outline-none" />
                                            <input type="text" value={newAddressData.line2} onChange={e => setNewAddressData({ ...newAddressData, line2: e.target.value })} placeholder="Address Line 2 (Optional)" className="w-full h-9 px-3 rounded-xl text-white placeholder:text-neutral-600 bg-black/40 border border-white/10 hover:border-white/20 focus:border-white/30 transition-colors text-xs outline-none" />
                                            <div className="grid grid-cols-2 gap-2">
                                                <SearchableSelect
                                                    value={newAddressData.countryCode || ""}
                                                    onChange={(val) => {
                                                        const c = countries.find(x => x.isoCode === val);
                                                        setNewAddressData({ ...newAddressData, countryCode: val, country: c?.name || "", state: "" });
                                                    }}
                                                    options={countries.map(c => ({ value: c.isoCode, label: c.name }))}
                                                    placeholder="Country *"
                                                />
                                                <SearchableSelect
                                                    value={newAddressData.state || ""}
                                                    onChange={(val) => setNewAddressData({ ...newAddressData, state: val })}
                                                    options={states.map(s => ({ value: s.name, label: s.name }))}
                                                    placeholder="State *"
                                                    disabled={!newAddressData.countryCode}
                                                />
                                            </div>
                                            <input type="text" value={newAddressData.pincode} onChange={e => setNewAddressData({ ...newAddressData, pincode: e.target.value })} placeholder="Pincode / Zipcode *" className="w-full h-9 px-3 rounded-xl text-white placeholder:text-neutral-600 bg-black/40 border border-white/10 hover:border-white/20 focus:border-white/30 transition-colors text-xs outline-none" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Captcha */}
                            {ALTCHA_CHALLENGE_URL && (
                                <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-3 sm:p-4 flex flex-col items-center gap-2">
                                    <div className="flex items-center gap-2 text-neutral-300 text-[10px] sm:text-xs font-semibold uppercase tracking-wider">
                                        <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" /> Human Verification
                                    </div>
                                    <div className="w-full flex justify-center">
                                        <altcha-widget ref={altchaRef} challengeurl={ALTCHA_CHALLENGE_URL} auto="onfocus" theme="dark" style={{ maxWidth: "100%", width: "100%", "--altcha-color-bg": "rgba(255, 255, 255, 0.03)", "--altcha-color-border": "rgba(255, 255, 255, 0.1)", "--altcha-border-radius": "12px" }} />
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3 mt-1">
                                <button className="flex-[1] h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs sm:text-sm transition-all" onClick={() => setEntryDialogOpen(false)}>
                                    Cancel
                                </button>
                                <button
                                    className="flex-[2] h-10 rounded-xl bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 border border-red-500/50 shadow-[0_0_20px_rgba(220,38,38,0.3)] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    onClick={submitEntry}
                                    disabled={
                                        isSubmittingEntry ||
                                        !profile?.phone ||
                                        !String(profile.phone).trim() ||
                                        !getSelectedAddress()?.trim() ||
                                        (addressSelection === "new" && (!newAddressData.name || !newAddressData.phone || !newAddressData.line1 || !newAddressData.country || !newAddressData.state || !newAddressData.pincode)) ||
                                        (ALTCHA_CHALLENGE_URL && !isCaptchaValid && process.env.NODE_ENV !== "development")
                                    }
                                >
                                    {isSubmittingEntry ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Gift className="w-4 h-4" />
                                            Submit Entry
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </section>
    );
}

function GiveawayCard({ item, loggedIn, router, onEnter }) {
    const [timeLeft, setTimeLeft] = useState(null);
    const [showDialog, setShowDialog] = useState(false);
    const { user } = useAuth();

    const status = item.status || "active";
    const isUpcoming = status === "upcoming";
    const isActive = status === "active";

    const targetDateStr = isUpcoming ? item.startDate : item.endDate;

    useEffect(() => {
        const target = dayjs(targetDateStr).tz("Asia/Kolkata");
        const calc = () => {
            const now = dayjs().tz("Asia/Kolkata");
            const diff = target.diff(now);
            if (diff > 0) {
                setTimeLeft({
                    days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
                    hours:   Math.floor((diff / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((diff / (1000 * 60)) % 60),
                    seconds: Math.floor((diff / 1000) % 60),
                });
            } else {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            }
        };
        calc();
        const t = setInterval(calc, 1000);
        return () => clearInterval(t);
    }, [targetDateStr]);

    const hasJoined = loggedIn && user && item.participants?.some(p => (p._id || p) === user._id);

    const handleEnter = () => {
        if (!loggedIn) { setShowDialog(true); return; }
        onEnter();
    };

    // Badge config
    const badge = isUpcoming
        ? { color: "bg-blue-500/20 border-blue-500/40 text-blue-400", dot: "bg-blue-400", label: "Soon" }
        : { color: "bg-emerald-500/20 border-emerald-500/40 text-emerald-400", dot: "bg-emerald-400 animate-pulse", label: "Live" };

    // Timer label
    const timerLabel = isUpcoming ? "Starts in" : "Ends in";
    const timerColor = isUpcoming ? "text-blue-400" : "text-red-400";

    return (
        <>
            <div className="giveaway-card p-4 sm:p-6 h-full flex flex-col border border-white/5 transition-all duration-300 hover:border-white/10">
                {/* Image */}
                <div className="relative h-48 w-full mb-4 sm:mb-5 rounded-xl overflow-hidden bg-neutral-900/80 border border-white/5 flex items-center justify-center">
                    <Image
                        src={item.image || gift1}
                        fill
                        alt={item.title}
                        className="object-cover transition-transform duration-500 hover:scale-105"
                        unoptimized
                    />
                    {/* Shadow overlay at bottom of image for readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

                    {/* Status badge */}
                    <div className={`absolute top-3 right-3 px-3 py-1 rounded-full border flex items-center gap-1.5 backdrop-blur-md ${badge.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        <span className="text-xs font-semibold">{badge.label}</span>
                    </div>

                    {/* Prize value chip */}
                    {item.prizeValue > 0 && (
                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/70 border border-white/10 flex items-center gap-1 backdrop-blur-md">
                            <Trophy className="w-3 h-3 text-amber-400" />
                            <span className="text-xs font-bold text-amber-400">
                                ₹{Number(item.prizeValue).toLocaleString("en-IN")}
                            </span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-1 line-clamp-2">{item.title}</h3>

                    {/* Timer label */}
                    <p className={`text-xs font-semibold mb-2 flex items-center gap-1 ${timerColor}`}>
                        <HiClock className="text-sm" />
                        {timerLabel}
                    </p>

                    {/* Countdown */}
                    {timeLeft && (
                        <div className="grid grid-cols-4 gap-2 mb-4">
                            <CountdownUnit value={timeLeft.days}    label="D" active={isActive} />
                            <CountdownUnit value={timeLeft.hours}   label="H" active={isActive} />
                            <CountdownUnit value={timeLeft.minutes} label="M" active={isActive} />
                            <CountdownUnit value={timeLeft.seconds} label="S" active={isActive} />
                        </div>
                    )}

                    {/* Meta row */}
                    <div className="flex items-center justify-between text-neutral-500 text-xs mb-4">
                        <span className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            {item.participantCount || 0} / {item.maxParticipants || "∞"} participants
                        </span>
                        <span className="flex items-center gap-1">
                            <Trophy className="w-3 h-3 text-amber-500/60" />
                            {item.winnerCount || 1} winner{(item.winnerCount || 1) > 1 ? "s" : ""}
                        </span>
                    </div>

                    {/* Prize name */}
                    {item.prize && (
                        <p className="text-xs text-neutral-500 mb-4 line-clamp-1">
                            🎁 <span className="text-neutral-300">{item.prize}</span>
                        </p>
                    )}

                    {/* CTA */}
                    {hasJoined ? (
                        <div className="w-full py-3 rounded-xl font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center gap-2 cursor-default mt-auto">
                            <CheckCircle className="w-5 h-5 flex-shrink-0" />
                            <span>Joined</span>
                        </div>
                    ) : isUpcoming ? (
                        <div className="w-full py-3 rounded-xl font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center gap-1.5 cursor-default mt-auto text-sm">
                            <CalendarClock className="w-4 h-4" />
                            Opens Soon
                        </div>
                    ) : (
                        <button
                            className="w-full py-3 rounded-xl text-sm font-semibold btn-gradient hover:shadow-glow-lg transition-all duration-300 mt-auto"
                            onClick={handleEnter}
                        >
                            Enter Now →
                        </button>
                    )}
                </div>
            </div>

            {/* Login dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="glass-dark border-white/10 rounded-2xl max-w-md mx-auto">
                    <DialogHeader className="text-center">
                        <div className="flex justify-center mb-4">
                            <ShieldIcon className="w-12 h-12" />
                        </div>
                        <DialogTitle className="text-2xl font-bold text-white">Join the Giveaway</DialogTitle>
                        <DialogDescription className="text-neutral-400 text-base">
                            Sign in or create an account to enter this giveaway and win amazing prizes!
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-3 pt-4">
                        <button className="btn-gradient w-full py-3.5 rounded-xl font-semibold" onClick={() => router.push("/login")}>
                            Sign In
                        </button>
                        <button className="btn-outline-premium w-full py-3.5 rounded-xl font-medium" onClick={() => router.push("/register")}>
                            Create Account
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

function CountdownUnit({ value, label, active }) {
    return (
        <div className={`flex flex-col items-center w-full rounded-lg py-1.5 border ${
            active
                ? "bg-red-500/10 border-red-500/20"
                : "bg-blue-500/10 border-blue-500/20"
        }`}>
            <span className={`text-lg font-bold font-mono ${active ? "text-white" : "text-blue-300"}`}>
                {String(value).padStart(2, "0")}
            </span>
            <span className={`text-[10px] font-semibold ${active ? "text-red-400" : "text-blue-400"}`}>{label}</span>
        </div>
    );
}

function CelebrationOverlay({ name }) {
    const sparkles = Array.from({ length: 18 }, (_, i) => ({
        id: i,
        left: 4 + i * 5.3,
        delay: (i % 6) * 0.15,
        dur: 1.5 + (i % 4) * 0.22,
        size: i % 3 === 0 ? "w-5 h-5" : "w-3 h-3",
    }));

    return (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.22),transparent_55%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(16,185,129,0.06)_1px,transparent_1px),linear-gradient(rgba(16,185,129,0.06)_1px,transparent_1px)] bg-[size:40px_40px]" />

            {/* Orbit rings */}
            <div className="absolute w-[480px] h-[480px] rounded-full border border-emerald-400/25 animate-[spin_22s_linear_infinite]">
                {["#34d399","#fbbf24","#f59e0b","#ef4444","#a78bfa","#60a5fa"].map((color, i) => (
                    <span key={i} className="absolute w-2.5 h-2.5 rounded-full shadow-lg" style={{ top: `${[5,22,68,80,20,50][i]}%`, left: `${[50,85,83,18,15,95][i]}%`, backgroundColor: color, boxShadow: `0 0 12px ${color}` }} />
                ))}
            </div>
            <div className="absolute w-[360px] h-[360px] rounded-full border border-rose-400/20 animate-[spin_32s_linear_infinite_reverse]" />
            <div className="absolute w-[250px] h-[250px] rounded-full border border-amber-300/15" />

            {/* Badge */}
            <div className="relative flex flex-col items-center gap-4 animate-fade-up">
                <div className="relative">
                    <div className="absolute inset-[-20px] rounded-full border border-emerald-300/50 animate-[ping_1.4s_ease-out_infinite]" />
                    <div className="absolute inset-[-36px] rounded-full border border-rose-300/30 animate-[ping_2s_ease-out_infinite]" />
                    <div className="animate-[bounce_2.5s_ease-in-out_infinite]">
                        <div className="w-36 h-36 rounded-full bg-gradient-to-br from-emerald-400/20 to-emerald-600/10 border-2 border-emerald-400/60 flex items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.5)]">
                            <div className="text-center">
                                <div className="text-5xl mb-1">🎁</div>
                                <CheckCircle className="w-7 h-7 text-emerald-400 mx-auto" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-center space-y-1.5 px-6">
                    <p className="text-white font-bold text-2xl tracking-tight">You&apos;re In!</p>
                    {name && <p className="text-emerald-300 font-medium text-base">Good luck, {name.split(" ")[0]}! 🤞</p>}
                    <p className="text-emerald-100/80 text-sm">Entry confirmed · Winner notified by email</p>
                </div>
            </div>

            {/* Sparkles */}
            {sparkles.map(s => (
                <div key={s.id} className="absolute" style={{ left: `${s.left}%`, bottom: "12%", animation: `sparkle-rise ${s.dur}s ease-out ${s.delay}s infinite` }}>
                    <Sparkles className={`${s.size} text-emerald-200/80`} />
                </div>
            ))}

            <style>{`
                @keyframes sparkle-rise {
                    0% { transform: translateY(0) scale(0.7) rotate(0deg); opacity: 0; }
                    15% { opacity: 1; }
                    100% { transform: translateY(-140px) scale(1.2) rotate(130deg); opacity: 0; }
                }
            `}</style>
        </div>
    );
}
