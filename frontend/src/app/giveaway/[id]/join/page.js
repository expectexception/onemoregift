"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import medal from "../../../../../public/images/medal.png";
import Image from "next/image";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, AlertCircle, Gift, MapPin, User, Sparkles } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import api from "@/app/utils/apiClient";
import withUserAuth from "@/app/components/withUserAuth";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const ALTCHA_CHALLENGE_URL = process.env.NEXT_PUBLIC_ALTCHA_CHALLENGE_URL;
const getApiErrorMessage = (error, fallback) =>
  error?.response?.data?.msg || error?.response?.data?.message || error?.message || fallback;

function Home() {
  const { toast } = useToast();
  const path = usePathname();
  const router = useRouter();
  const altchaRef = useRef(null);
  const giveawayId = path.split("/")[2];

  const [isCaptchaValid, setIsCaptchaValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState({});
  const [participated, setParticipated] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [addressSelection, setAddressSelection] = useState("saved");
  const [savedAddressIndex, setSavedAddressIndex] = useState(0);
  const [alreadyJoined, setAlreadyJoined] = useState(false);
  const [isGiveawayEnded, setIsGiveawayEnded] = useState(false);
  const [isGiveawayNotStarted, setIsGiveawayNotStarted] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [addressData, setAddressData] = useState({ line1: "", line2: "", country: "", countryCode: "", state: "", pincode: "" });
  const [altchaLoaded, setAltchaLoaded] = useState(false);

  const hasPhone = Boolean(user.phone && String(user.phone).trim());
  const hasSavedAddress = Boolean(
    (Array.isArray(user.addresses) && user.addresses.length > 0) ||
    (user.address && String(user.address).trim())
  );

  const checkGiveawayStatus = useCallback(async () => {
    if (!user?._id || !giveawayId) return;
    try {
      const { data } = await api.get(`giveaway/${giveawayId}`);
      if (data?.giveaway) {
        const g = data.giveaway;
        const now = dayjs().tz("Asia/Kolkata");
        setIsGiveawayNotStarted(now.isBefore(dayjs(g.startDate).tz("Asia/Kolkata")));
        setIsGiveawayEnded(now.isAfter(dayjs(g.endDate).tz("Asia/Kolkata")));
        if (g.participants?.some(p => String(p._id || p) === String(user._id))) {
          setAlreadyJoined(true);
          setTimeout(() => router.push(`/giveaway/${giveawayId}`), 3500);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCheckingStatus(false);
    }
  }, [giveawayId, router, user?._id]);

  useEffect(() => {
    api.get("profile/", { meta: { auth: "user" } })
      .then(({ data }) => setUser(data.myProfile))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (user?._id) {
      const savedAddresses = Array.isArray(user.addresses) ? user.addresses : [];
      const defIdx = savedAddresses.findIndex(a => a.isDefault);
      setSavedAddressIndex(defIdx >= 0 ? defIdx : 0);
      setAddressSelection(hasSavedAddress ? "saved" : "new");
      checkGiveawayStatus();
    } else {
      setIsCheckingStatus(false);
    }
  }, [user, giveawayId, checkGiveawayStatus]);

  useEffect(() => {
    if (countries.length === 0) {
      import("country-state-city").then(({ Country }) => setCountries(Country.getAllCountries())).catch(console.error);
    }
  }, []);

  useEffect(() => {
    if (addressData.countryCode) {
      import("country-state-city").then(({ State }) => setStates(State.getStatesOfCountry(addressData.countryCode))).catch(console.error);
    } else {
      setStates([]);
    }
  }, [addressData.countryCode]);

  useEffect(() => {
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
  }, [altchaLoaded]);

  const getSelectedAddress = () => {
    if (addressSelection === "saved") {
      const savedAddresses = Array.isArray(user.addresses) ? user.addresses : [];
      const sel = savedAddresses[savedAddressIndex];
      if (sel) return [sel.line1, sel.line2, sel.city, sel.state, sel.country, sel.postalCode].filter(Boolean).join(", ");
      return user.address || "";
    }
    return [addressData.line1, addressData.line2, addressData.state, addressData.country, addressData.pincode].filter(Boolean).join(", ");
  };

  const handleJoin = async () => {
    if (!hasPhone) {
      toast({ title: "Phone required", description: "Add mobile number to your profile first.", variant: "destructive" });
      return;
    }
    const address = getSelectedAddress();
    if (!address?.trim()) {
      toast({ title: "Address required", description: "Please select or enter a shipping address.", variant: "destructive" });
      return;
    }
    if (addressSelection === "new") {
      if (!addressData.line1 || !addressData.country || !addressData.state || !addressData.pincode) {
        toast({ title: "Incomplete address", description: "Fill in Address Line 1, Country, State, and Pincode.", variant: "destructive" });
        return;
      }
    }
    if (ALTCHA_CHALLENGE_URL && !isCaptchaValid && process.env.NODE_ENV !== "development") {
      toast({ title: "Verify required", description: "Please complete the verification check.", variant: "destructive" });
      return;
    }
    try {
      setIsSubmitting(true);
      if (addressSelection === "new" && address && address !== (user.address || "")) {
        await api.patch("profile/update", { address }, { meta: { auth: "user" } });
      }
      const { data } = await api.post("giveaway/participate/" + giveawayId, {}, { meta: { auth: "user" } });
      if (!data.error) {
        setParticipated(true);
        setShowCelebration(true);
        import("canvas-confetti").then((m) => {
          const confetti = m.default;
          const defaults = { origin: { y: 0.6 }, colors: ["#ef4444", "#dc2626", "#f97316", "#fbbf24", "#ffffff", "#a78bfa"], zIndex: 9999 };
          const fire = (r, opts) => confetti(Object.assign({}, defaults, opts, { particleCount: Math.floor(300 * r) }));
          fire(0.25, { spread: 26, startVelocity: 55 });
          fire(0.2, { spread: 60 });
          fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
          fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
          fire(0.1, { spread: 120, startVelocity: 45 });
          const end = Date.now() + 2500;
          const shoot = () => {
            confetti({ ...defaults, particleCount: 10, angle: 60, spread: 55, origin: { x: 0, y: 0.65 } });
            confetti({ ...defaults, particleCount: 10, angle: 120, spread: 55, origin: { x: 1, y: 0.65 } });
            if (Date.now() < end) requestAnimationFrame(shoot);
          };
          shoot();
        }).catch(console.error);
        setTimeout(() => router.push("/thank-you"), 4500);
      } else {
        toast({ title: "Error", description: data.msg || "Participation failed.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: getApiErrorMessage(error, "Participation failed."), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingStatus) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4">
        <div className="animate-spin rounded-full border-t-4 border-red-600 h-12 w-12 mb-4" />
        <p className="text-white font-medium">Verifying eligibility...</p>
      </div>
    );
  }

  const StatusScreen = ({ icon, color, title, desc, giveawayId, router }) => (
    <div className="flex-1 flex flex-col items-center justify-center space-y-4 text-center animate-fade-up">
      <div className={`w-20 h-20 ${color} rounded-full flex items-center justify-center border mb-2`}>{icon}</div>
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      <p className="text-neutral-400 max-w-sm">{desc}</p>
      <Button onClick={() => router.push(`/giveaway/${giveawayId}`)} className="mt-4 px-8 bg-neutral-800 text-neutral-300 hover:bg-neutral-700 rounded-xl">Back to Giveaway</Button>
    </div>
  );

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-black p-4 overflow-hidden">
      {showCelebration && <CelebrationOverlay name={user.name} />}

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(220,38,38,0.08),transparent_60%)] pointer-events-none" />

      <Image src={medal} height={96} width={96} alt="Medal" className="mb-5 w-20 h-20 drop-shadow-[0_0_20px_rgba(220,38,38,0.5)]" />
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-6 text-center">
        {participated ? "You're In! 🎉" : alreadyJoined ? "Already Entered" : isGiveawayEnded ? "Giveaway Ended" : isGiveawayNotStarted ? "Not Started Yet" : "Enter Giveaway"}
      </h1>

      <div className="w-full max-w-xl premium-card rounded-2xl p-6 flex flex-col gap-6">
        {alreadyJoined ? (
          <StatusScreen icon={<CheckCircle className="w-10 h-10 text-emerald-400" />} color="bg-emerald-500/10 border-emerald-500/20" title="You're already in!" desc="You have successfully entered this giveaway. Redirecting..." giveawayId={giveawayId} router={router} />
        ) : isGiveawayEnded ? (
          <StatusScreen icon={<XCircle className="w-10 h-10 text-red-400" />} color="bg-red-500/10 border-red-500/20" title="This giveaway has ended" desc="Entries are closed." giveawayId={giveawayId} router={router} />
        ) : isGiveawayNotStarted ? (
          <StatusScreen icon={<AlertCircle className="w-10 h-10 text-blue-300" />} color="bg-blue-500/10 border-blue-500/20" title="Giveaway not started yet" desc="You can enter once it goes live." giveawayId={giveawayId} router={router} />
        ) : (
          <>
            {/* Profile Info */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-neutral-300 text-sm font-semibold">
                  <User className="w-4 h-4 text-red-400" /> Your Details
                </div>
                <button onClick={() => router.push("/my-profile/edit")} className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 px-3 py-1 rounded-lg hover:bg-red-500/10 transition-all">
                  Edit Profile
                </button>
              </div>
              {!hasPhone && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-200 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>Mobile number required. Please update your profile before entering.</span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { label: "Name", value: user.name },
                  { label: "Phone", value: user.phone },
                  { label: "Email", value: user.email },
                ].map(({ label, value }) => (
                  <div key={label} className="premium-input px-3 py-2 rounded-xl">
                    <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-0.5">{label}</p>
                    <p className="text-white text-sm truncate">{value || <span className="text-neutral-500">Not set</span>}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="divider-gradient" />

            {/* Address */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-neutral-300 text-sm font-semibold">
                <MapPin className="w-4 h-4 text-red-400" /> Shipping Address
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 ml-1">Required</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setAddressSelection("saved")} disabled={!hasSavedAddress}
                  className={`h-9 px-3 rounded-lg text-xs border transition-all ${addressSelection === "saved" ? "bg-red-600 text-white border-red-500" : "bg-white/[0.03] text-neutral-300 border-white/[0.08]"} ${!hasSavedAddress ? "opacity-40 cursor-not-allowed" : ""}`}>
                  Use Saved Address
                </button>
                <button type="button" onClick={() => setAddressSelection("new")}
                  className={`h-9 px-3 rounded-lg text-xs border transition-all ${addressSelection === "new" ? "bg-red-600 text-white border-red-500" : "bg-white/[0.03] text-neutral-300 border-white/[0.08]"}`}>
                  New Address
                </button>
              </div>

              {addressSelection === "saved" && Array.isArray(user.addresses) && user.addresses.length > 0 && (
                <div className="space-y-2">
                  <select value={savedAddressIndex} onChange={e => setSavedAddressIndex(Number(e.target.value))}
                    className="premium-input w-full h-10 px-3 rounded-xl text-white bg-black text-sm">
                    {user.addresses.map((a, i) => (
                      <option key={i} value={i}>{a.label || `Address ${i + 1}`}{a.isDefault ? " (Default)" : ""}</option>
                    ))}
                  </select>
                  <div className="premium-input px-4 py-3 rounded-xl text-neutral-300 text-sm">
                    {[user.addresses[savedAddressIndex]?.line1, user.addresses[savedAddressIndex]?.line2, user.addresses[savedAddressIndex]?.city, user.addresses[savedAddressIndex]?.state, user.addresses[savedAddressIndex]?.country, user.addresses[savedAddressIndex]?.postalCode].filter(Boolean).join(", ")}
                  </div>
                </div>
              )}
              {addressSelection === "saved" && !(Array.isArray(user.addresses) && user.addresses.length > 0) && user.address && (
                <div className="premium-input px-4 py-3 rounded-xl text-neutral-300 text-sm">{user.address}</div>
              )}

              {addressSelection === "new" && (
                <div className="space-y-2">
                  <input type="text" value={addressData.line1} onChange={e => setAddressData({ ...addressData, line1: e.target.value })} placeholder="Address Line 1 *" className="premium-input w-full h-10 px-3 rounded-xl text-white placeholder:text-neutral-600 text-sm" />
                  <input type="text" value={addressData.line2} onChange={e => setAddressData({ ...addressData, line2: e.target.value })} placeholder="Address Line 2 (Optional)" className="premium-input w-full h-10 px-3 rounded-xl text-white placeholder:text-neutral-600 text-sm" />
                  <div className="grid grid-cols-2 gap-2">
                    <select value={addressData.countryCode} onChange={e => { const c = countries.find(x => x.isoCode === e.target.value); setAddressData({ ...addressData, countryCode: e.target.value, country: c?.name || "", state: "" }); }} className="premium-input h-10 px-3 rounded-xl text-white bg-black text-sm">
                      <option value="" disabled>Country *</option>
                      {countries.map(c => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
                    </select>
                    <select value={addressData.state} onChange={e => setAddressData({ ...addressData, state: e.target.value })} disabled={!addressData.countryCode} className="premium-input h-10 px-3 rounded-xl text-white bg-black text-sm disabled:opacity-40">
                      <option value="" disabled>State *</option>
                      {states.map(s => <option key={s.isoCode} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                  <input type="text" value={addressData.pincode} onChange={e => setAddressData({ ...addressData, pincode: e.target.value })} placeholder="Pincode / Zipcode *" className="premium-input w-full h-10 px-3 rounded-xl text-white placeholder:text-neutral-600 text-sm" />
                </div>
              )}
            </section>

            {ALTCHA_CHALLENGE_URL && (
              <>
                <div className="divider-gradient" />
                <section className="flex flex-col items-center gap-2">
                  <p className="text-neutral-400 text-xs text-center">Complete the check below to confirm you&apos;re human</p>
                  <altcha-widget ref={altchaRef} challengeurl={ALTCHA_CHALLENGE_URL} auto="onfocus" />
                </section>
              </>
            )}

            <div className="flex gap-3 mt-2">
              <Button variant="outline" onClick={() => router.back()} className="flex-1 rounded-xl border-white/[0.06] text-neutral-300 hover:bg-white/[0.04]">Back</Button>
              <Button onClick={handleJoin} disabled={isSubmitting || !hasPhone || (ALTCHA_CHALLENGE_URL && !isCaptchaValid && process.env.NODE_ENV !== "development")}
                className="flex-[2] btn-gradient rounded-xl font-semibold text-base py-2.5 flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Entering...</>
                ) : (
                  <><Gift className="w-4 h-4" /> Enter Giveaway</>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
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
          <p className="text-neutral-400 text-xs mt-2 animate-pulse">Redirecting to thank-you page...</p>
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

export default withUserAuth(Home, { loadingLabel: "Preparing your entry..." });
