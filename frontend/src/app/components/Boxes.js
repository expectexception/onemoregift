"use client";
import Image from "next/image";
import gift1 from "../../../public/images/gift-1.png";
import dayjs from "../utils/dayjs";
import { useState, useEffect, useCallback, useRef } from "react";
import { HiClock, HiArrowRight } from "react-icons/hi";
import { CheckCircle, Flame, Clock, CalendarClock, Trophy, Users, ShieldAlert, Sparkles, MapPin, User, AlertCircle, Gift } from "lucide-react";
import {
    Dialog, DialogContent, DialogDescription,
    DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useRouter, usePathname } from "next/navigation";
import api from "../utils/apiClient";
import { fetchSiteConfig } from "../utils/siteConfig";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { VerificationIcon, UserIcon, ShieldIcon } from "./SVGIcons";
import RevealOnScroll from "./RevealOnScroll";
import SearchableSelect from "./SearchableSelect";
import AnimatedImage from "./AnimatedImage";

const ALTCHA_CHALLENGE_URL = process.env.NEXT_PUBLIC_ALTCHA_CHALLENGE_URL;

export default function Giveaways() {
    const router = useRouter();
    const pathname = usePathname();
    const [items, setItems] = useState([]);
    const [config, setConfig] = useState({ showUpcoming: true, showEnded: false });
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
    const [newAddressData, setNewAddressData] = useState({ name: "", phone: "", line1: "", line2: "", city: "", country: "", countryCode: "", state: "", pincode: "" });
    const [enteredPersonalPhone, setEnteredPersonalPhone] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    
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
            const [gwRes, cfg] = await Promise.all([
                api.get("giveaway"),
                fetchSiteConfig()
            ]);
            setItems(gwRes.data.data || []);
            if (cfg) setConfig(cfg);
        } catch (error) {
            console.error("Error fetching giveaways or config:", error);
        }
    }, []);

    useEffect(() => {
        fetchItems();
        const interval = setInterval(fetchItems, 20000);
        return () => clearInterval(interval);
    }, [fetchItems]);

    const activeGiveaways   = items.filter(g => g.status === "active");
    const upcomingGiveaways = items.filter(g => g.status === "upcoming");
    const endedGiveaways    = items.filter(g => g.status === "ended");

    // Dynamic tabs
    const dynamicTabs = [
        { key: "active", label: "Live Now", icon: Flame, count: activeGiveaways.length, color: "emerald" }
    ];
    if (config.showUpcoming) {
        dynamicTabs.push({ key: "upcoming", label: "Upcoming", icon: CalendarClock, count: upcomingGiveaways.length, color: "blue" });
    }
    if (config.showEnded) {
        dynamicTabs.push({ key: "ended", label: "Ended", icon: Trophy, count: endedGiveaways.length, color: "red" });
    }

    // Auto-switch to allowed tab if current activeTab is not allowed
    useEffect(() => {
        const isTabAllowed = (activeTab === "active") || 
                             (activeTab === "upcoming" && config.showUpcoming) ||
                             (activeTab === "ended" && config.showEnded);
        if (!isTabAllowed) {
            setActiveTab("active");
        }
    }, [activeTab, config.showUpcoming, config.showEnded]);

    // Auto-switch to upcoming if no active
    useEffect(() => {
        if (activeGiveaways.length === 0 && upcomingGiveaways.length > 0 && config.showUpcoming && activeTab === "active") {
            setActiveTab("upcoming");
        }
    }, [activeGiveaways.length, upcomingGiveaways.length, config.showUpcoming, activeTab]);


    // Fetch profile and other details when entry dialog opens
    const handleOpenEntry = async (item) => {
        setSelectedGiveaway(item);
        setEntryDialogOpen(true);
        setLoadingProfile(true);
        setIsCaptchaValid(false);
        setErrorMsg("");
        setNewAddressData({ name: "", phone: "", line1: "", line2: "", city: "", country: "", countryCode: "", state: "", pincode: "" });
        try {
            const { data } = await api.get("profile/", { meta: { auth: "user" } });
            const p = data.myProfile;
            setProfile(p);
            setEnteredPersonalPhone(p.phone || "");
            
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

    // Load Altcha library once on client mount
    useEffect(() => {
        if (entryDialogOpen && ALTCHA_CHALLENGE_URL && !altchaLoaded) {
            import("altcha").then(() => {
                setAltchaLoaded(true);
            }).catch(console.error);
        }
    }, [entryDialogOpen, altchaLoaded]);

    // Handle Altcha event listeners when widget is mounted
    useEffect(() => {
        if (entryDialogOpen && !loadingProfile && altchaLoaded && ALTCHA_CHALLENGE_URL) {
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
            return () => {
                el.removeEventListener("verified", onVerified);
                el.removeEventListener("statechange", onStateChange);
            };
        }
    }, [entryDialogOpen, loadingProfile, altchaLoaded]);

    const getSelectedAddress = () => {
        if (addressSelection === "saved") {
            const savedAddresses = Array.isArray(profile?.addresses) ? profile.addresses : [];
            const sel = savedAddresses[savedAddressIndex];
            if (sel) return [sel.fullName || sel.name, sel.phone, sel.line1, sel.line2, sel.city, sel.state, sel.country, sel.postalCode].filter(Boolean).join(", ");
            return profile?.address || "";
        }
        return [newAddressData.name, newAddressData.phone, newAddressData.line1, newAddressData.line2, newAddressData.city, newAddressData.state, newAddressData.country, newAddressData.pincode].filter(Boolean).join(", ");
    };

    const submitEntry = async () => {
        const activePhone = (profile?.phone || enteredPersonalPhone || "").replace(/\D/g, "").slice(0, 10);
        if (!activePhone) {
            setErrorMsg("Phone number is required.");
            return;
        }
        if (!/^[6-9]\d{9}$/.test(activePhone)) {
            setErrorMsg("Phone number must be a valid 10-digit Indian number starting with 6-9.");
            return;
        }
        const address = getSelectedAddress();
        if (!address?.trim()) {
            setErrorMsg("Address is required.");
            return;
        }
        if (addressSelection === "new") {
            if (!newAddressData.name.trim() || !newAddressData.phone.trim() || !newAddressData.line1.trim() || !newAddressData.city.trim() || !newAddressData.country.trim() || !newAddressData.state.trim() || !newAddressData.pincode.trim()) {
                setErrorMsg("All address fields marked * are required.");
                return;
            }
            if (!/^[6-9]\d{9}$/.test(newAddressData.phone.replace(/\D/g, "").slice(0, 10))) {
                setErrorMsg("Receiver phone must be a valid 10-digit Indian number starting with 6-9.");
                return;
            }
        }
        if (ALTCHA_CHALLENGE_URL && !isCaptchaValid && process.env.NODE_ENV !== "development") {
            setErrorMsg("Please complete captcha check.");
            return;
        }

        setIsSubmittingEntry(true);
        setErrorMsg("");
        try {
            const updates = {};
            if (!profile?.phone && enteredPersonalPhone) {
                updates.phone = activePhone;
            }
            if (addressSelection === "new") {
                const existingAddresses = Array.isArray(profile?.addresses) ? profile.addresses : [];
                const updatedAddresses = existingAddresses.map(a => ({ ...a, isDefault: false }));
                const newAddr = {
                    label: "Shipping Address",
                    fullName: newAddressData.name.trim(),
                    phone: newAddressData.phone.replace(/\D/g, "").slice(0, 10),
                    line1: newAddressData.line1.trim(),
                    line2: (newAddressData.line2 || "").trim(),
                    city: newAddressData.city.trim(),
                    state: newAddressData.state.trim(),
                    country: newAddressData.country.trim(),
                    countryCode: newAddressData.countryCode,
                    postalCode: newAddressData.pincode.trim(),
                    isDefault: true
                };
                updatedAddresses.push(newAddr);
                updates.addresses = updatedAddresses;
            } else if (addressSelection === "saved") {
                const existingAddresses = Array.isArray(profile?.addresses) ? profile.addresses : [];
                if (existingAddresses.length > 0 && savedAddressIndex >= 0 && savedAddressIndex < existingAddresses.length) {
                    const updatedAddresses = existingAddresses.map((a, i) => ({
                        ...a,
                        isDefault: i === savedAddressIndex
                    }));
                    updates.addresses = updatedAddresses;
                }
            }

            if (Object.keys(updates).length > 0) {
                const { data: updateRes } = await api.patch("profile/update", updates, { meta: { auth: "user" } });
                if (updateRes.error) {
                    setErrorMsg(updateRes.msg || "Failed to update profile.");
                    setIsSubmittingEntry(false);
                    return;
                }
            }

            const { data } = await api.post("giveaway/participate/" + selectedGiveaway._id, {}, { meta: { auth: "user" } });
            if (!data.error) {
                setEntryDialogOpen(false);
                setCelebratingName(profile?.name || "");
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
            } else {
                setErrorMsg(data.msg || "Participation failed.");
            }
        } catch (error) {
            console.error("Entry failed", error);
            setErrorMsg(error?.response?.data?.msg || "Entry failed. Please try again.");
        } finally {
            setIsSubmittingEntry(false);
        }
    };

    const displayed = activeTab === "active" ? activeGiveaways : activeTab === "upcoming" ? upcomingGiveaways : endedGiveaways;
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
                    {dynamicTabs.map(({ key, label, icon: Icon, count, color }) => {
                        const isActive = activeTab === key;
                        return (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                                    isActive
                                        ? color === "emerald"
                                            ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                                            : color === "blue"
                                            ? "bg-blue-500/15 border-blue-500/40 text-blue-400"
                                            : "bg-red-500/15 border-red-500/40 text-red-400"
                                        : "border-white/[0.07] bg-white/[0.02] text-neutral-500 hover:text-neutral-300 hover:border-white/20"
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                {label}
                                <span className={`px-1.5 py-0.5 rounded-md text-xs font-bold ${
                                    isActive
                                        ? color === "emerald" ? "bg-emerald-500/20 text-emerald-300" : color === "blue" ? "bg-blue-500/20 text-blue-300" : "bg-red-500/20 text-red-300"
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
                            {activeTab === "active" ? "No Live Giveaways" : activeTab === "upcoming" ? "No Upcoming Giveaways" : "No Ended Giveaways"}
                        </h3>
                        <p className="text-neutral-500 mb-6">
                            {activeTab === "active"
                                ? upcomingGiveaways.length > 0
                                    ? `${upcomingGiveaways.length} upcoming giveaway${upcomingGiveaways.length > 1 ? "s" : ""} — check the Upcoming tab!`
                                    : "Check back soon for new exciting contests!"
                                : activeTab === "upcoming"
                                ? "Stay tuned — new giveaways are being planned!"
                                : "History of all completed giveaways."}
                        </p>
                        {activeTab === "active" && upcomingGiveaways.length > 0 && config.showUpcoming && (
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
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center p-1 shadow-2xl relative overflow-hidden">
                                <AnimatedImage src={selectedGiveaway?.image || gift1} height={64} width={64} className="object-cover rounded-full w-full h-full" alt="Giveaway Image" unoptimized />
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
                                    <div className="space-y-2 relative z-10">
                                        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-amber-200 text-xs flex items-start gap-2">
                                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                            <span>Mobile number is required to participate. Enter below:</span>
                                        </div>
                                        <input
                                            type="tel"
                                            value={enteredPersonalPhone}
                                            onChange={e => setEnteredPersonalPhone(e.target.value)}
                                            placeholder="Your Phone Number *"
                                            className="w-full h-10 px-3 rounded-xl text-white placeholder:text-neutral-600 bg-black/40 border border-white/10 hover:border-white/20 focus:border-white/30 transition-all text-xs outline-none"
                                        />
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
                            <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-3 sm:p-4 relative group">
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/[0.02] rounded-full blur-2xl group-hover:bg-white/[0.04] transition-colors pointer-events-none" />
                                <div className="flex items-center justify-between gap-2 mb-3 relative z-10">
                                    <div className="flex items-center gap-2 text-neutral-200 text-xs sm:text-sm font-semibold">
                                        <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center">
                                            <MapPin className="w-3.5 h-3.5 text-blue-400" />
                                        </div>
                                        Shipping Address
                                    </div>
                                    <button onClick={() => router.push("/my-profile/edit")} className="text-[10px] sm:text-xs text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1 rounded-full transition-all font-medium border border-white/5">
                                        Update Address
                                    </button>
                                </div>
                                
                                <div className="relative z-10">
                                    {profile?.addresses?.length > 0 ? (
                                        <div className="space-y-2">
                                            <SearchableSelect
                                                value={savedAddressIndex.toString()}
                                                onChange={(val) => setSavedAddressIndex(Number(val))}
                                                options={profile.addresses.map((a, i) => ({
                                                    value: i.toString(),
                                                    label: (a.label || "Address " + (i + 1)) + (a.isDefault ? " (Default)" : "")
                                                }))}
                                                placeholder="Select Saved Address"
                                                usePortal={false}
                                            />
                                            <div className="bg-black/40 border border-white/5 px-3 py-2.5 rounded-xl text-neutral-300 text-xs leading-relaxed">
                                                {[profile.addresses[savedAddressIndex]?.line1, profile.addresses[savedAddressIndex]?.line2, profile.addresses[savedAddressIndex]?.city, profile.addresses[savedAddressIndex]?.state, profile.addresses[savedAddressIndex]?.country, profile.addresses[savedAddressIndex]?.postalCode].filter(Boolean).join(", ")}
                                            </div>
                                        </div>
                                    ) : profile?.address ? (
                                        <div className="bg-black/40 border border-white/5 px-3 py-2.5 rounded-xl text-neutral-300 text-xs leading-relaxed">{profile.address}</div>
                                    ) : (
                                        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-200 text-xs flex flex-col gap-2">
                                            <p className="font-semibold flex items-center gap-1.5"><AlertCircle className="w-4 h-4 text-amber-400" /> No saved address found</p>
                                            <p className="text-[11px] text-neutral-350">You must add at least one shipping address in your profile settings to enter this giveaway.</p>
                                            <button type="button" onClick={() => router.push("/my-profile/edit")} className="mt-1 w-full h-8 rounded-lg bg-amber-500 text-black hover:bg-amber-400 font-bold transition-all text-xs">
                                                Go to Profile Settings
                                            </button>
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
                                        <altcha-widget ref={altchaRef} challengeurl={ALTCHA_CHALLENGE_URL} auto="onfocus" theme="dark" style={{ maxWidth: "100%", width: "100%" }} />
                                    </div>
                                </div>
                            )}

                            {/* Error Msg Display */}
                            {errorMsg && (
                                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-2.5 text-red-400 text-xs flex items-start gap-2 relative z-10 animate-fade-up">
                                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 animate-pulse" />
                                    <span>{errorMsg}</span>
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
                                        !(profile?.phone || enteredPersonalPhone) ||
                                        !getSelectedAddress()?.trim() ||
                                        (addressSelection === "new" && (!newAddressData.name || !newAddressData.phone || !newAddressData.line1 || !newAddressData.city || !newAddressData.country || !newAddressData.state || !newAddressData.pincode)) ||
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
    const isEnded = status === "ended";

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

    const hasJoined = item.joined || Boolean(loggedIn && user && item.participants?.some(p => String(p._id || p) === String(user._id)));
    const isWinner = loggedIn && user && item.winners?.some(w => (w._id || w) === user._id);

    const handleEnter = () => {
        if (!loggedIn) { setShowDialog(true); return; }
        onEnter();
    };

    // Badge config
    const badge = isUpcoming
        ? { color: "bg-blue-500/20 border-blue-500/40 text-blue-400", dot: "bg-blue-400", label: "Soon" }
        : isEnded
        ? { color: "bg-red-500/20 border-red-500/40 text-red-400", dot: "bg-red-500", label: "Ended" }
        : { color: "bg-emerald-500/20 border-emerald-500/40 text-emerald-400", dot: "bg-emerald-400 animate-pulse", label: "Live" };

    // Timer label
    const timerLabel = isUpcoming ? "Starts in" : isEnded ? "Ended on" : "Ends in";
    const timerColor = isUpcoming ? "text-blue-400" : isEnded ? "text-neutral-500" : "text-red-400";

    return (
        <>
            <div className="giveaway-card p-4 sm:p-6 h-full flex flex-col border border-white/5 transition-all duration-300 hover:border-white/10">
                {/* Image */}
                <div className="relative h-48 w-full mb-4 sm:mb-5 rounded-xl overflow-hidden bg-neutral-900/80 border border-white/5 flex items-center justify-center">
                    <AnimatedImage
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

                    {/* Countdown / Winner list */}
                    {isEnded ? (
                        <div className="bg-white/[0.02] border border-white/[0.05] p-3 rounded-xl mb-4 flex-1 flex flex-col justify-center">
                            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                                Winners
                            </p>
                            {item.winners && item.winners.length > 0 ? (
                                <p className="text-xs text-neutral-200 font-semibold line-clamp-2 leading-relaxed">
                                    {item.winners.map(w => w.name || w.fullName || "User").join(", ")}
                                </p>
                            ) : (
                                <p className="text-xs text-neutral-500 italic">Winners selection pending</p>
                            )}
                        </div>
                    ) : (
                        timeLeft && (
                            <div className="grid grid-cols-4 gap-2 mb-4">
                                <CountdownUnit value={timeLeft.days}    label="D" active={isActive} />
                                <CountdownUnit value={timeLeft.hours}   label="H" active={isActive} />
                                <CountdownUnit value={timeLeft.minutes} label="M" active={isActive} />
                                <CountdownUnit value={timeLeft.seconds} label="S" active={isActive} />
                            </div>
                        )
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
                    {isWinner ? (
                        <div className="w-full py-3 rounded-xl font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center gap-2 cursor-default mt-auto">
                            <Trophy className="w-5 h-5 flex-shrink-0 animate-bounce" />
                            <span>You Won! 🎉</span>
                        </div>
                    ) : hasJoined ? (
                        <div className="w-full py-3 rounded-xl font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center gap-2 cursor-default mt-auto">
                            <CheckCircle className="w-5 h-5 flex-shrink-0" />
                            <span>Joined</span>
                        </div>
                    ) : isUpcoming ? (
                        <div className="w-full py-3 rounded-xl font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center gap-1.5 cursor-default mt-auto text-sm">
                            <CalendarClock className="w-4 h-4" />
                            Opens Soon
                        </div>
                    ) : isEnded ? (
                        <div className="w-full py-3 rounded-xl font-semibold bg-neutral-900 border border-white/5 text-neutral-500 flex items-center justify-center gap-2 cursor-default mt-auto text-sm">
                            <span>Ended</span>
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
    return (
        <div className="pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-black/85 backdrop-blur-md animate-[fadeIn_0.3s_ease-out_forwards]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.15),transparent_60%)]" />

            <div className="relative flex flex-col items-center max-w-sm w-[90%] p-8 bg-neutral-900/90 border border-white/10 rounded-2xl shadow-[0_25px_60px_-15px_rgba(220,38,38,0.3)] text-center animate-[scaleIn_0.4s_cubic-bezier(0.16,1,0.3,1)_forwards]">
                <div className="w-20 h-20 rounded-full bg-red-600/10 border border-red-500/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(220,38,38,0.2)]">
                    <Gift className="w-10 h-10 text-red-500 animate-[pulse_2s_infinite]" />
                </div>

                <h2 className="text-white font-extrabold text-2xl tracking-tight mb-2">You&apos;re In! 🎉</h2>
                {name && <p className="text-red-400 font-semibold text-base mb-1">Good luck, {name.split(" ")[0]}! 🤞</p>}
                <p className="text-neutral-400 text-sm leading-relaxed mb-6">Your entry is sealed. We will notify you by email if you win.</p>
                
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                    <span>Processing...</span>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </div>
    );
}
