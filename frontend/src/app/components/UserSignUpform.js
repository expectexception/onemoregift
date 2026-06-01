"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, CheckCircle, XCircle, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { GoogleLogin } from "@react-oauth/google";
import api from "../utils/apiClient";
import { useAuth } from "../context/AuthContext";
import SessionLoader from "./SessionLoader";
import TermsModal from "./TermsModal";
import { ShieldCheck } from "lucide-react";
import { UserIcon, EmailIcon, LockIcon, PhoneIcon, ShieldIcon, RegisterBadgeIcon } from "./SVGIcons";

const POLICY_VERSION = "2026-05-28";
const AUTH_HEADER_ICON_CLASS = "w-[72px] h-[72px] mx-auto mb-5";
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
const ENABLE_GOOGLE_LOGIN = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN === "true";
const SHOW_GOOGLE_LOGIN = ENABLE_GOOGLE_LOGIN && Boolean(GOOGLE_CLIENT_ID);
const PHONE_COUNTRY_CODES = [
    "+1", "+7", "+20", "+27", "+30", "+31", "+32", "+33", "+34", "+36", "+39",
    "+40", "+41", "+43", "+44", "+45", "+46", "+47", "+48", "+49", "+51", "+52",
    "+53", "+54", "+55", "+56", "+57", "+58", "+60", "+61", "+62", "+63", "+64",
    "+65", "+66", "+81", "+82", "+84", "+86", "+90", "+91", "+92", "+93", "+94",
    "+95", "+98", "+212", "+213", "+216", "+218", "+220", "+221", "+223", "+224",
    "+225", "+226", "+227", "+228", "+229", "+230", "+231", "+232", "+233", "+234",
    "+235", "+236", "+237", "+238", "+239", "+240", "+241", "+242", "+243", "+244",
    "+245", "+246", "+248", "+249", "+250", "+251", "+252", "+253", "+254", "+255",
    "+256", "+257", "+258", "+260", "+261", "+262", "+263", "+264", "+265", "+266",
    "+267", "+268", "+269", "+291", "+297", "+298", "+299", "+350", "+351", "+352",
    "+353", "+354", "+355", "+356", "+357", "+358", "+359", "+370", "+371", "+372",
    "+373", "+374", "+375", "+376", "+377", "+378", "+380", "+381", "+382", "+383",
    "+385", "+386", "+387", "+389", "+420", "+421", "+423", "+500", "+501", "+502",
    "+503", "+504", "+505", "+506", "+507", "+508", "+509", "+590", "+591", "+592",
    "+593", "+594", "+595", "+596", "+597", "+598", "+599", "+670", "+672", "+673",
    "+674", "+675", "+676", "+677", "+678", "+679", "+680", "+681", "+682", "+683",
    "+685", "+686", "+687", "+688", "+689", "+690", "+691", "+692", "+850", "+852",
    "+853", "+855", "+856", "+880", "+886", "+960", "+961", "+962", "+963", "+964",
    "+965", "+966", "+967", "+968", "+970", "+971", "+972", "+973", "+974", "+975",
    "+976", "+977", "+992", "+993", "+994", "+995", "+996", "+998"
];

export default function UserSignupForm() {
    const { toast } = useToast();
    const router = useRouter();
    const { userAuthenticated, loadingUser, refreshUserSession } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [termsError, setTermsError] = useState(false);
    const [pendingFormData, setPendingFormData] = useState(null);
    const [pendingGoogleCredential, setPendingGoogleCredential] = useState("");
    const [consentSource, setConsentSource] = useState("");
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
    const [phoneCountryCode, setPhoneCountryCode] = useState("+91");

    // OTP states
    const [registrationStep, setRegistrationStep] = useState('form');
    const [registeredEmail, setRegisteredEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting }
    } = useForm();

    const passwordValue = watch("password", "");

    const getPasswordStrength = (pass) => {
        let score = 0;
        if (!pass) return { score: 0, label: "", color: "bg-transparent" };
        if (pass.length > 5) score += 1;
        if (pass.length > 8) score += 1;
        if (/[A-Z]/.test(pass)) score += 1;
        if (/[0-9]/.test(pass)) score += 1;
        if (/[^A-Za-z0-9]/.test(pass)) score += 1;

        if (score <= 2) return { score, label: "Weak", color: "bg-red-500", width: "w-1/3" };
        if (score <= 4) return { score, label: "Good", color: "bg-amber-400", width: "w-2/3" };
        return { score, label: "Strong", color: "bg-emerald-500", width: "w-full" };
    };

    const strength = getPasswordStrength(passwordValue);

    useEffect(() => {
        if (userAuthenticated) {
            router.replace("/");
        }
    }, [userAuthenticated, router]);

    if (loadingUser) return <SessionLoader label="Checking your account session..." />;
    if (userAuthenticated) return null;

    const onSubmit = async (formData) => {
        setPendingFormData(formData);
        setPendingGoogleCredential("");
        setConsentSource("email");
        setRegistrationStep("consent");
    };

    const submitEmailRegistration = async (formData) => {
        try {
            const { data } = await api.post(`auth/register`, {
                ...formData,
                phoneCountryCode,
                termsAccepted: true,
                privacyAccepted: true,
                policyVersion: POLICY_VERSION,
            });
            if (data.error === false && data.requiresOtp) {
                toast({
                    title: "OTP Sent!",
                    description: "Please check your email for the verification code.",
                });
                setRegisteredEmail(formData.email);
                setRegistrationStep('otp');
            } else if (data.error === false) {
                // Fallback if requiresOtp wasn't sent (though backend now sends it)
                toast({
                    title: "Account Created!",
                    description: (
                        <div className="flex items-center gap-2">
                            <CheckCircle className="text-green-500 w-5 h-5" />
                            <span>Welcome to OneMoreGift!</span>
                        </div>
                    )
                });
                localStorage.setItem("token", data.token);
                await refreshUserSession();
                router.push("/my-profile");
            } else {
                toast({
                    title: "Registration Failed",
                    variant: "destructive",
                    description: (
                        <div className="flex items-center gap-2">
                            <XCircle className="text-white w-5 h-5" />
                            <span>{data.msg}</span>
                        </div>
                    )
                });
            }
        } catch (error) {
            const status = error?.response?.status;
            const message = error?.response?.data?.msg || "Something went wrong";
            if (status === 409) {
                toast({
                    title: "Account already exists",
                    description: "This email is already registered. Please sign in instead.",
                    variant: "destructive"
                });
                router.push("/login");
                return;
            }
            toast({ title: "Registration Error", description: message, variant: "destructive" });
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (!otp || otp.length < 6) {
            toast({ title: "Invalid OTP", description: "Please enter a valid 6-digit OTP.", variant: "destructive" });
            return;
        }

        setIsVerifying(true);
        try {
            const { data } = await api.post(`auth/verify-registration-otp`, { email: registeredEmail, otp });
            if (data.error === false) {
                toast({
                    title: "Account Verified!",
                    description: (
                        <div className="flex items-center gap-2">
                            <CheckCircle className="text-green-500 w-5 h-5" />
                            <span>Welcome to OneMoreGift!</span>
                        </div>
                    )
                });
                localStorage.setItem("token", data.token);
                await refreshUserSession();
                router.push("/my-profile");
            } else {
                toast({ title: "Verification Failed", description: data.msg, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Verification Error", description: error?.response?.data?.msg || "Invalid OTP", variant: "destructive" });
        } finally {
            setIsVerifying(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setPendingGoogleCredential(credentialResponse.credential || "");
        setPendingFormData(null);
        setConsentSource("google");
        setRegistrationStep("consent");
    };

    const handleGoogleError = () => {
        toast({ title: "Google Sign-In failed", description: "Could not connect to Google. Try again.", variant: "destructive" });
    };

    const handleConsentContinue = async () => {
        if (!termsAccepted) {
            setTermsError(true);
            return;
        }
        setTermsError(false);

        if (consentSource === "google") {
            try {
                const { data } = await api.post(`auth/google-signin`, {
                    credential: pendingGoogleCredential,
                    termsAccepted: true,
                    privacyAccepted: true,
                    policyVersion: POLICY_VERSION,
                    mode: "register",
                });
                if (!data.error) {
                    localStorage.setItem("token", data.token);
                    await refreshUserSession();
                    toast({
                        title: "Welcome!",
                        description: (
                            <div className="flex items-center gap-2">
                                <CheckCircle className="text-green-500 w-5 h-5" />
                                <span>Signed in with Google successfully.</span>
                            </div>
                        )
                    });
                    router.push("/my-profile");
                    return;
                }
                toast({ title: "Google Sign-In failed", description: data.msg, variant: "destructive" });
            } catch (error) {
                if (error?.response?.status === 409) {
                    toast({
                        title: "Account already exists",
                        description: "This Google account is already registered. Please sign in.",
                        variant: "destructive"
                    });
                    router.push("/login");
                    return;
                }
                toast({ title: "Google Sign-In failed", description: error?.response?.data?.msg || "Please try again", variant: "destructive" });
            }
            return;
        }

        if (pendingFormData) {
            await submitEmailRegistration(pendingFormData);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen px-4 py-4 bg-black">
            <div className="w-full max-w-md premium-card rounded-2xl p-5 sm:p-6 animate-scale-in shadow-[0_30px_70px_-40px_rgba(239,68,68,0.65)]">

                {registrationStep === 'otp' ? (
                    /* OTP Verification Step */
                    <div className="animate-fade-up">
                        <div className="text-center mb-8">
                            <ShieldIcon className={AUTH_HEADER_ICON_CLASS} />
                            <h1 className="text-2xl font-bold text-white mb-2">Verify Your Email</h1>
                            <p className="text-neutral-500 text-sm">
                                We&apos;ve sent a 6-digit code to <br />
                                <span className="text-neutral-300 font-medium">{registeredEmail}</span>
                            </p>
                        </div>

                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                            <div className="flex flex-col space-y-2">
                                <Label htmlFor="otp" className="text-neutral-300 text-sm text-center">Enter OTP Code</Label>
                                <Input
                                    id="otp"
                                    type="text"
                                    maxLength={6}
                                    placeholder="• • • • • •"
                                    className="premium-input h-14 text-center text-2xl tracking-[0.5em] text-white placeholder:text-neutral-600 font-bold"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={isVerifying || otp.length < 6}
                                className="w-full h-12 btn-gradient rounded-xl font-semibold text-base"
                            >
                                {isVerifying ? "Verifying..." : "Verify & Continue"}
                            </Button>
                        </form>

                        <div className="text-center pt-6 mt-6 border-t border-white/[0.06]">
                            <button
                                onClick={() => setRegistrationStep('form')}
                                className="text-neutral-500 hover:text-white text-sm transition-colors"
                            >
                                ← Back to Registration
                            </button>
                        </div>
                    </div>
                ) : registrationStep === "consent" ? (
                    <div className="animate-fade-up">
                        <div className="text-center mb-6">
                            <ShieldIcon className={AUTH_HEADER_ICON_CLASS} />
                            <h1 className="text-2xl font-bold text-white mb-2">Terms & Privacy</h1>
                            <p className="text-neutral-500 text-sm">
                                Review and accept to continue with {consentSource === "google" ? "Google sign-up" : "account creation"}.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-sm text-neutral-300 leading-relaxed">
                                By continuing, you agree to our{" "}
                                <button
                                    type="button"
                                    onClick={() => setIsTermsModalOpen(true)}
                                    className="text-red-400 hover:text-red-300 font-semibold"
                                >
                                    Terms & Conditions
                                </button>{" "}
                                and{" "}
                                <button
                                    type="button"
                                    onClick={() => setIsTermsModalOpen(true)}
                                    className="text-red-400 hover:text-red-300 font-semibold"
                                >
                                    Privacy Policy
                                </button>.
                            </div>

                            <label className="flex items-start gap-2.5 cursor-pointer group">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTermsAccepted((v) => !v);
                                        setTermsError(false);
                                    }}
                                    className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-all duration-200 ${termsAccepted
                                        ? "bg-red-600 border-red-600"
                                        : termsError
                                            ? "border-red-500 bg-transparent shadow-[0_0_6px_rgba(239,68,68,0.2)]"
                                            : "border-white/20 bg-transparent group-hover:border-white/40"
                                        }`}
                                >
                                    {termsAccepted && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                                </button>
                                <span className="text-xs text-neutral-400 leading-normal">
                                    I have read and accept Terms & Conditions and Privacy Policy.
                                </span>
                            </label>
                            {termsError && (
                                <p className="text-red-400 text-[10px] mt-1 ml-6 flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3" />
                                    Please accept terms to continue
                                </p>
                            )}

                            <Button
                                type="button"
                                onClick={handleConsentContinue}
                                className="w-full h-10 btn-gradient rounded-xl font-semibold text-sm"
                            >
                                Continue
                            </Button>
                            <TermsModal
                                isOpen={isTermsModalOpen}
                                onOpenChange={setIsTermsModalOpen}
                                onAccept={() => {
                                    setTermsAccepted(true);
                                    setTermsError(false);
                                }}
                            />
                        </div>

                        <div className="text-center pt-6 mt-6 border-t border-white/[0.06]">
                            <button
                                onClick={() => setRegistrationStep("form")}
                                className="text-neutral-500 hover:text-white text-sm transition-colors"
                            >
                                ← Back
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Registration Form Step */
                    <div className="animate-fade-up">
                        {/* Header */}
                        <div className="text-center mb-4">
                            <RegisterBadgeIcon className={AUTH_HEADER_ICON_CLASS} />
                            <h1 className="text-xl font-bold text-white mb-0.5">Create Account</h1>
                            <p className="text-neutral-500 text-xs">Join OneMoreGift and start winning</p>
                        </div>

                        {SHOW_GOOGLE_LOGIN && (
                            <>
                                <div className="mb-4">
                                    <div className="flex justify-center">
                                        <GoogleLogin
                                            onSuccess={handleGoogleSuccess}
                                            onError={handleGoogleError}
                                            theme="filled_black"
                                            size="large"
                                            text="signup_with"
                                            shape="pill"
                                        />
                                    </div>
                                </div>

                                <div className="relative flex items-center mb-4">
                                    <div className="flex-1 h-px bg-white/[0.06]" />
                                    <span className="px-4 text-[10px] text-neutral-600 font-medium uppercase tracking-wider">or register with email</span>
                                    <div className="flex-1 h-px bg-white/[0.06]" />
                                </div>
                            </>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                            <div className="flex flex-col space-y-1">
                                <Label htmlFor="name" className="text-neutral-300 text-xs flex items-center gap-1.5"><UserIcon className="w-3.5 h-3.5" />Username</Label>
                                <Input
                                    id="name"
                                    placeholder="Choose a username"
                                    className="premium-input h-10 text-white placeholder:text-neutral-600 text-sm"
                                    {...register("name", {
                                        required: "Username is required",
                                        pattern: {
                                            value: /^[a-zA-Z0-9_]{3,}$/,
                                            message: "Min 3 characters, letters/numbers/_ only"
                                        }
                                    })}
                                />
                                {errors.name && <span className="text-red-400 text-[10px]">{errors.name.message}</span>}
                            </div>

                            <div className="flex flex-col space-y-1">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="phone" className="text-neutral-300 text-xs flex items-center gap-1.5"><PhoneIcon className="w-3.5 h-3.5" />Phone Number</Label>
                                    <span className="text-[10px] text-neutral-500">Optional</span>
                                </div>
                                <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-2">
                                    <input
                                        value={phoneCountryCode}
                                        onChange={(e) => {
                                            const raw = e.target.value.trim();
                                            const normalized = raw === "" ? "+91" : (raw.startsWith("+") ? raw : `+${raw.replace(/[^\d]/g, "")}`);
                                            setPhoneCountryCode(normalized);
                                        }}
                                        list="phone-country-codes"
                                        inputMode="tel"
                                        placeholder="+91"
                                        className="premium-input h-10 rounded-xl px-3 bg-black text-white border border-white/[0.08] text-sm"
                                    />
                                    <datalist id="phone-country-codes">
                                        {PHONE_COUNTRY_CODES.map((code) => (
                                            <option key={code} value={code} />
                                        ))}
                                    </datalist>
                                    <Input
                                        id="phone"
                                        placeholder="10-digit phone number"
                                        className="premium-input h-10 text-white placeholder:text-neutral-600 text-sm"
                                        {...register("phone", {
                                            required: false,
                                            setValueAs: (value) => (value || "").replace(/\D/g, "").slice(0, 10),
                                            validate: (value) => {
                                                if (!value) return true;
                                                return /^[6-9]\d{9}$/.test(value) || "Must be 10 digits, starting with 6–9";
                                            }
                                        })}
                                    />
                                </div>
                                {errors.phone && <span className="text-red-400 text-[10px]">{errors.phone.message}</span>}
                            </div>

                            <div className="flex flex-col space-y-1">
                                <Label htmlFor="email" className="text-neutral-300 text-xs flex items-center gap-1.5"><EmailIcon className="w-3.5 h-3.5" />Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    className="premium-input h-10 text-white placeholder:text-neutral-600 text-sm"
                                    {...register("email", {
                                        required: "Email is required",
                                        pattern: {
                                            value: /^\S+@\S+\.\S+$/,
                                            message: "Enter a valid email"
                                        }
                                    })}
                                />
                                {errors.email && <span className="text-red-400 text-[10px]">{errors.email.message}</span>}
                            </div>

                            <div className="flex flex-col space-y-1 relative">
                                <Label htmlFor="password" className="text-neutral-300 text-xs flex items-center gap-1.5"><LockIcon className="w-3.5 h-3.5" />Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Create a strong password"
                                        className="premium-input h-10 text-white placeholder:text-neutral-600 pr-12 w-full text-sm"
                                        {...register("password", {
                                            required: "Password is required",
                                            minLength: { value: 6, message: "Password must be at least 6 characters" }
                                        })}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors duration-200 p-1 rounded-md"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {passwordValue && (
                                    <div className="space-y-1 mt-1">
                                        <div className="flex items-center justify-between text-[10px]">
                                            <span className="text-neutral-400">Password strength:</span>
                                            <span className={`font-medium ${strength.color.replace('bg-', 'text-')}`}>{strength.label}</span>
                                        </div>
                                        <div className="h-1 w-full bg-neutral-800 rounded-full overflow-hidden">
                                            <div className={`h-full ${strength.color} ${strength.width} transition-all duration-300 rounded-full`} />
                                        </div>
                                    </div>
                                )}
                                {errors.password && <span className="text-red-400 text-[10px]">{errors.password.message}</span>}
                            </div>

                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full h-10 btn-gradient rounded-xl font-semibold text-sm mt-2"
                            >
                                {isSubmitting ? "Continuing..." : "Create Account"}
                            </Button>
                        </form>

                        {/* Login Link */}
                        <div className="text-center pt-3 mt-2 border-t border-white/[0.06]">
                            <span className="text-neutral-500 text-xs">Already have an account? </span>
                            <Link className="text-red-400 hover:text-red-300 font-medium transition-colors text-xs" href="/login">
                                Sign In
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
