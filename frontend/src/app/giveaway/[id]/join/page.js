"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import medal from "../../../../../public/images/medal.png";
import Image from "next/image";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import api from "@/app/utils/apiClient";
import withUserAuth from "@/app/components/withUserAuth";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const ALTCHA_CHALLENGE_URL = process.env.NEXT_PUBLIC_ALTCHA_CHALLENGE_URL;

function Home() {
    const { toast } = useToast();
    const path = usePathname();
    const router = useRouter();
    const altchaRef = useRef(null);
    const giveawayId = path.split("/")[2];
    const [isCaptchaValid, setIsCaptchaValid] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [user, setUser] = useState({});
    const [participated, setParticipated] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        address: "",
    });
    const [addressData, setAddressData] = useState({
        line1: "",
        line2: "",
        country: "",
        countryCode: "",
        state: "",
        pincode: "",
    });
    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const [addressSelection, setAddressSelection] = useState("saved");
    const [savedAddressIndex, setSavedAddressIndex] = useState(0);
    const [alreadyJoined, setAlreadyJoined] = useState(false);
    const [isGiveawayEnded, setIsGiveawayEnded] = useState(false);
    const [isGiveawayNotStarted, setIsGiveawayNotStarted] = useState(false);
    const [isCheckingStatus, setIsCheckingStatus] = useState(true);

    const checkGiveawayStatus = useCallback(async () => {
        if (!user?._id || !giveawayId) return;
        try {
            const { data } = await api.get(`giveaway/${giveawayId}`);
            if (data?.giveaway) {
                const giveaway = data.giveaway;
                const nowIst = dayjs().tz("Asia/Kolkata");
                const startIst = dayjs(giveaway.startDate).tz("Asia/Kolkata");
                const endIst = dayjs(giveaway.endDate).tz("Asia/Kolkata");

                setIsGiveawayNotStarted(nowIst.isBefore(startIst));
                setIsGiveawayEnded(nowIst.isAfter(endIst) || nowIst.isSame(endIst));

                const joined = giveaway.participants?.some((p) => (p._id || p) === user._id);
                if (joined) {
                    setAlreadyJoined(true);
                    setTimeout(() => { router.push(`/giveaway/${giveawayId}`); }, 3500);
                }
            }
        } catch (error) {
            console.error("Failed to fetch giveaway status", error);
        } finally {
            setIsCheckingStatus(false);
        }
    }, [giveawayId, router, user?._id]);

    const fetchData = async () => {
        try {
            const { data } = await api.get("profile/", { meta: { auth: "user" } });
            setUser(data.myProfile);
        } catch (error) {
            console.error(error);
        }
    };

    const saveProfileData = async (dataToSave) => {
        try {
            const { data } = await api.patch("profile/update", dataToSave, { meta: { auth: "user" } });
            if (!data.error) {
                toast({
                    title: "Success",
                    description: (<div className="flex items-center space-x-2"><CheckCircle className="text-green-500 w-5 h-5" /><span>Profile Updated</span></div>),
                });
            } else {
                toast({ title: "Error", description: data.msg || "Profile change failed.", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "An error occurred while saving the profile.", variant: "destructive" });
        }
    };

    useEffect(() => { fetchData(); }, []);

    useEffect(() => {
        if (user) {
            const savedAddresses = Array.isArray(user.addresses) ? user.addresses : [];
            const defaultAddressIndex = savedAddresses.findIndex((a) => a.isDefault);
            const fallbackAddress = user.address || "";
            const hasSavedAddress = savedAddresses.length > 0 || Boolean(fallbackAddress && String(fallbackAddress).trim());
            setFormData({
                name: user.name || "",
                phone: user.phone || "",
                email: user.email || "",
                address: fallbackAddress,
            });
            setAddressSelection(hasSavedAddress ? "saved" : "new");
            setSavedAddressIndex(defaultAddressIndex >= 0 ? defaultAddressIndex : 0);
            if (hasSavedAddress && !savedAddresses.length) {
                setAddressData(prev => ({ ...prev, line1: fallbackAddress }));
            }
            checkGiveawayStatus();
        } else {
            setIsCheckingStatus(false);
        }
    }, [user, giveawayId, checkGiveawayStatus]);

    useEffect(() => {
        if (currentStep === 2 && countries.length === 0) {
            import("country-state-city").then(({ Country }) => {
                setCountries(Country.getAllCountries());
            }).catch(err => console.error("Failed to load country data", err));
        }
    }, [currentStep, countries.length]);

    useEffect(() => {
        if (currentStep === 2 && addressData.countryCode) {
            import("country-state-city").then(({ State }) => {
                setStates(State.getStatesOfCountry(addressData.countryCode));
            }).catch(err => console.error("Failed to load state data", err));
        } else {
            setStates([]);
        }
    }, [currentStep, addressData.countryCode]);

    useEffect(() => {
        if (currentStep !== 3) return;

        import("altcha").then(() => {
            const altchaElement = altchaRef.current;
            if (!altchaElement) return;

            const onVerified = async (event) => {
                const payload = event?.detail?.payload;
                if (!payload) { setIsCaptchaValid(false); return; }
                await validateCaptcha(payload);
            };

            const onStateChange = (event) => {
                if (event?.detail?.state !== "verified") setIsCaptchaValid(false);
            };

            altchaElement.addEventListener("verified", onVerified);
            altchaElement.addEventListener("statechange", onStateChange);

            return () => {
                altchaElement.removeEventListener("verified", onVerified);
                altchaElement.removeEventListener("statechange", onStateChange);
            };
        }).catch(err => console.error("Failed to load Altcha", err));
    }, [currentStep]);

    const handleNext = async () => {
        if (currentStep === 2) {
            if (addressSelection === "new") {
                if (!addressData.line1 || !addressData.country || !addressData.state || !addressData.pincode) {
                    toast({
                        title: "Missing address fields",
                        description: "Please fill address line 1, country, state, and pincode.",
                        variant: "destructive"
                    });
                    return;
                }
            }
            const parts = [addressData.line1, addressData.line2, addressData.state, addressData.country, addressData.pincode].filter(Boolean);
            const fullAddress = parts.join(", ");
            const savedAddresses = Array.isArray(user.addresses) ? user.addresses : [];
            const selectedSavedAddress = savedAddresses[savedAddressIndex];
            const selectedSavedAddressText = selectedSavedAddress
                ? [selectedSavedAddress.line1, selectedSavedAddress.line2, selectedSavedAddress.city, selectedSavedAddress.state, selectedSavedAddress.country, selectedSavedAddress.postalCode]
                    .filter(Boolean).join(", ")
                : (user.address || "");
            const selectedAddress = addressSelection === "saved" ? selectedSavedAddressText : fullAddress;
            setFormData((prev) => ({ ...prev, address: selectedAddress }));

            if (addressSelection === "new" && selectedAddress && selectedAddress !== (user.address || "")) {
                await saveProfileData({ address: selectedAddress });
            }
        }
        if (currentStep < 3) setCurrentStep(currentStep + 1);
    };

    const handleBack = () => {
        if (currentStep === 1) {
            router.back();
        } else {
            setCurrentStep((prev) => Math.max(prev - 1, 1));
        }
    };

    const handleJoin = async () => {
        try {
            let { data } = await api.post("giveaway/participate/" + giveawayId, {}, { meta: { auth: "user" } });
            if (!data.error) {
                setParticipated(true);
                import("canvas-confetti").then((module) => {
                    const confetti = module.default;
                    // Premium, expensive multi-burst fireworks animation
                    const count = 250;
                    const defaults = {
                        origin: { y: 0.6 },
                        colors: ['#dc2626', '#991b1b', '#fbbf24', '#f59e0b', '#ffffff'], // Deep Red, Crimson, Gold, Light Gold, Silver
                        zIndex: 9999
                    };

                    const fire = (particleRatio, opts) => {
                        confetti(Object.assign({}, defaults, opts, {
                            particleCount: Math.floor(count * particleRatio)
                        }));
                    };

                    fire(0.25, { spread: 26, startVelocity: 55 });
                    fire(0.2, { spread: 60 });
                    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
                    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
                    fire(0.1, { spread: 120, startVelocity: 45 });
                }).catch(err => console.error("Failed to load confetti", err));
                
                setTimeout(() => { router.push("/thank-you"); }, 3500); // Give the premium confetti time to shine
            }
            if (data.error) {
                toast({ title: "Error", description: data.msg || "Participation failed.", variant: "destructive" });
            }
        } catch (error) {
            const message = error?.response?.data?.msg || "Participation failed.";
            toast({ title: "Error", description: message, variant: "destructive" });
        }
    };

    const validateCaptcha = async (payload) => {
        try {
            const response = await axios.post("/api/verify-captcha", { payload });
            setIsCaptchaValid(response.data.success);
        } catch (error) {
            setIsCaptchaValid(false);
        }
    };

    const displayStep = (step) => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-5">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-neutral-300 text-sm font-medium">Profile Information</span>
                                <Button
                                    variant="outline"
                                    onClick={() => router.push("/my-profile/edit")}
                                    className="h-9 px-3 rounded-lg border-white/[0.08] text-neutral-200 hover:bg-white/[0.04]"
                                >
                                    Edit Profile
                                </Button>
                            </div>
                            <div className="premium-input h-11 px-4 rounded-xl text-white flex items-center">
                                {formData.name || "Not set"}
                            </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                            <label className="text-neutral-300 text-sm font-medium">Phone</label>
                            <div className="premium-input h-11 px-4 rounded-xl text-white flex items-center">
                                {formData.phone || "Not set"}
                            </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                            <label className="text-neutral-300 text-sm font-medium">Email</label>
                            <div className="premium-input h-11 px-4 rounded-xl text-white flex items-center">
                                {formData.email || "Not set"}
                            </div>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-4">
                        <label className="text-neutral-300 text-sm font-medium">Shipping Address</label>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setAddressSelection("saved")}
                                disabled={!((Array.isArray(user.addresses) && user.addresses.length) || user.address)}
                                className={`h-10 px-3 rounded-lg text-sm border transition-all ${
                                    addressSelection === "saved"
                                        ? "bg-red-600 text-white border-red-500"
                                        : "bg-white/[0.03] text-neutral-300 border-white/[0.08]"
                                } ${!((Array.isArray(user.addresses) && user.addresses.length) || user.address) ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                                Use Saved Address
                            </button>
                            <button
                                type="button"
                                onClick={() => setAddressSelection("new")}
                                className={`h-10 px-3 rounded-lg text-sm border transition-all ${
                                    addressSelection === "new"
                                        ? "bg-red-600 text-white border-red-500"
                                        : "bg-white/[0.03] text-neutral-300 border-white/[0.08]"
                                }`}
                            >
                                Add New Address
                            </button>
                        </div>

                        {addressSelection === "saved" && (Array.isArray(user.addresses) && user.addresses.length > 0) ? (
                            <div className="space-y-3">
                                <select
                                    value={savedAddressIndex}
                                    onChange={(e) => setSavedAddressIndex(Number(e.target.value))}
                                    className="premium-input h-11 px-4 rounded-xl text-white bg-black placeholder:text-neutral-600 form-select"
                                >
                                    {user.addresses.map((addr, idx) => (
                                        <option key={idx} value={idx}>
                                            {addr.label || `Address ${idx + 1}`}{addr.isDefault ? " (Default)" : ""}
                                        </option>
                                    ))}
                                </select>
                                <div className="premium-input min-h-20 px-4 py-3 rounded-xl text-white whitespace-pre-wrap">
                                    {[user.addresses[savedAddressIndex]?.fullName, user.addresses[savedAddressIndex]?.line1, user.addresses[savedAddressIndex]?.line2, user.addresses[savedAddressIndex]?.city, user.addresses[savedAddressIndex]?.state, user.addresses[savedAddressIndex]?.country, user.addresses[savedAddressIndex]?.postalCode]
                                        .filter(Boolean).join(", ")}
                                </div>
                            </div>
                        ) : null}

                        {addressSelection === "saved" && !(Array.isArray(user.addresses) && user.addresses.length > 0) && user.address ? (
                            <div className="premium-input min-h-20 px-4 py-3 rounded-xl text-white whitespace-pre-wrap">{user.address}</div>
                        ) : null}

                        {addressSelection === "saved" && !((Array.isArray(user.addresses) && user.addresses.length > 0) || user.address) ? (
                            <p className="text-sm text-neutral-400">
                                No saved address found. Please add a new address.
                            </p>
                        ) : null}

                        {addressSelection === "new" ? (
                        <div className="space-y-3">
                            <input
                                type="text"
                                value={addressData.line1}
                                onChange={e => setAddressData({ ...addressData, line1: e.target.value })}
                                placeholder="Address Line 1"
                                className="premium-input w-full h-11 px-4 rounded-xl text-white placeholder:text-neutral-600"
                            />
                            <input
                                type="text"
                                value={addressData.line2}
                                onChange={e => setAddressData({ ...addressData, line2: e.target.value })}
                                placeholder="Address Line 2 (Optional)"
                                className="premium-input w-full h-11 px-4 rounded-xl text-white placeholder:text-neutral-600"
                            />

                            <div className="grid grid-cols-2 gap-3">
                                <select
                                    value={addressData.countryCode}
                                    onChange={e => {
                                        const code = e.target.value;
                                        const countryName = countries.find(c => c.isoCode === code)?.name || "";
                                        setAddressData({ ...addressData, countryCode: code, country: countryName, state: "" });
                                    }}
                                    className="premium-input h-11 px-4 rounded-xl text-white bg-black placeholder:text-neutral-600 form-select"
                                >
                                    <option value="" disabled>Country</option>
                                    {countries.map(c => (
                                        <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
                                    ))}
                                </select>

                                <select
                                    value={addressData.state}
                                    onChange={e => setAddressData({ ...addressData, state: e.target.value })}
                                    className="premium-input h-11 px-4 rounded-xl text-white bg-black placeholder:text-neutral-600 form-select"
                                    disabled={!addressData.countryCode}
                                >
                                    <option value="" disabled>State / Province</option>
                                    {states.map(s => (
                                        <option key={s.isoCode} value={s.name}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <input
                                type="text"
                                value={addressData.pincode}
                                onChange={e => setAddressData({ ...addressData, pincode: e.target.value })}
                                placeholder="Pincode / Zipcode"
                                className="premium-input w-full h-11 px-4 rounded-xl text-white placeholder:text-neutral-600"
                            />
                        </div>
                        ) : null}
                    </div>
                );
            case 3:
                return (
                    <div className="text-center space-y-4">
                        <h2 className="text-xl font-semibold text-white">Verification</h2>
                        <p className="text-neutral-400">
                            Please complete the ALTCHA verification to confirm your entry.
                        </p>
                        <div className="flex justify-center mt-4">
                            {ALTCHA_CHALLENGE_URL ? (
                                <altcha-widget
                                    ref={altchaRef}
                                    challengeurl={ALTCHA_CHALLENGE_URL}
                                    auto="onfocus"
                                />
                            ) : (
                                <p className="text-sm text-red-400">
                                    ALTCHA is not configured. Set NEXT_PUBLIC_ALTCHA_CHALLENGE_URL.
                                </p>
                            )}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    if (isCheckingStatus) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4">
                <div className="animate-spin rounded-full border-t-4 border-red-600 h-12 w-12 mb-4"></div>
                <p className="text-white font-medium">Verifying eligibility...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black p-3 sm:p-4">
            <Image src={medal} height={100} width={100} alt="Medal" className="mb-4 sm:mb-6 w-16 sm:w-24 h-16 sm:h-24" />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4 sm:mb-6 text-center px-2">
                {participated
                    ? "Participation Successful!"
                    : alreadyJoined
                        ? "Already Participated"
                        : isGiveawayEnded
                            ? "Giveaway Ended"
                        : isGiveawayNotStarted
                            ? "Giveaway Not Started"
                            : "Confirm Your Participation"}
            </h1>
            <div className="w-full max-w-2xl premium-card rounded-2xl p-4 sm:p-6 min-h-[420px] flex flex-col justify-between">

                {alreadyJoined ? (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-3 sm:space-y-4 text-center animate-fade-up">
                        <div className="w-16 sm:w-20 h-16 sm:h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 mb-2">
                            <CheckCircle className="w-8 sm:w-10 h-8 sm:h-10 text-emerald-400" />
                        </div>
                        <h2 className="text-lg sm:text-2xl font-bold text-white">You&apos;re already in!</h2>
                        <p className="text-sm sm:text-base text-neutral-400 max-w-sm mx-auto">
                            You have successfully entered this giveaway. Redirecting you back to the main page...
                        </p>
                        <Button
                            onClick={() => router.push(`/giveaway/${giveawayId}`)}
                            className="mt-3 sm:mt-4 px-6 sm:px-8 btn-outline-premium rounded-xl text-sm sm:text-base"
                        >
                            Return Now
                        </Button>
                    </div>
                ) : isGiveawayEnded ? (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-3 sm:space-y-4 text-center animate-fade-up">
                        <div className="w-16 sm:w-20 h-16 sm:h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 mb-2">
                            <XCircle className="w-8 sm:w-10 h-8 sm:h-10 text-red-400" />
                        </div>
                        <h2 className="text-lg sm:text-2xl font-bold text-white">This giveaway has ended</h2>
                        <p className="text-sm sm:text-base text-neutral-400 max-w-sm mx-auto">
                            Entries are closed for this giveaway.
                        </p>
                        <Button
                            onClick={() => router.push(`/giveaway/${giveawayId}`)}
                            className="mt-3 sm:mt-4 px-6 sm:px-8 bg-neutral-800 text-neutral-300 hover:bg-neutral-700 rounded-xl text-sm sm:text-base"
                        >
                            Back to Giveaway
                        </Button>
                    </div>
                ) : isGiveawayNotStarted ? (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-3 sm:space-y-4 text-center animate-fade-up">
                        <div className="w-16 sm:w-20 h-16 sm:h-20 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20 mb-2">
                            <AlertCircle className="w-8 sm:w-10 h-8 sm:h-10 text-blue-300" />
                        </div>
                        <h2 className="text-lg sm:text-2xl font-bold text-white">Giveaway not started yet</h2>
                        <p className="text-sm sm:text-base text-neutral-400 max-w-sm mx-auto">
                            You can enter this giveaway once it goes live.
                        </p>
                        <Button
                            onClick={() => router.push(`/giveaway/${giveawayId}`)}
                            className="mt-3 sm:mt-4 px-6 sm:px-8 bg-neutral-800 text-neutral-300 hover:bg-neutral-700 rounded-xl text-sm sm:text-base"
                        >
                            Back to Giveaway
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Step Indicators */}
                        <div className="flex justify-between items-center mb-4 sm:mb-6 gap-1 sm:gap-2">
                            {[1, 2, 3].map((step) => (
                                <div
                                    key={step}
                                    className={`flex-1 text-center py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${step === currentStep
                                        ? "bg-red-600 text-white"
                                        : step < currentStep
                                            ? "bg-red-600/20 text-red-400"
                                            : "bg-white/[0.04] text-neutral-500"
                                        }`}
                                >
                                    {step === 1 ? "Details" : step === 2 ? "Address" : "Verify"}
                                </div>
                            ))}
                        </div>

                        {/* Step Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">{displayStep(currentStep)}</div>

                        {/* Navigation */}
                        <div className="flex flex-col-reverse sm:flex-row justify-between mt-4 sm:mt-6 gap-2 sm:gap-3">
                            <Button
                                variant="outline"
                                onClick={handleBack}
                                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl border-white/[0.06] text-neutral-300 hover:bg-white/[0.04] text-sm sm:text-base"
                            >
                                Back
                            </Button>
                            <Button
                                onClick={currentStep === 3 ? handleJoin : handleNext}
                                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 btn-gradient rounded-xl font-medium text-sm sm:text-base"
                                disabled={currentStep === 3 && !!ALTCHA_CHALLENGE_URL && !isCaptchaValid && process.env.NODE_ENV !== 'development'}
                            >
                                {currentStep === 3 ? "Submit Entry" : "Next"}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default withUserAuth(Home, {
    loadingLabel: "Preparing your entry...",
});
