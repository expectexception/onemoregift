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
const AUTH_HEADER_ICON_CLASS = "w-12 h-12 mx-auto mb-2";

export default function UserSignupForm() {
    const { toast } = useToast();
    const router = useRouter();
    const { userAuthenticated, loadingUser, refreshUserSession } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [termsError, setTermsError] = useState(false);
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

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
        if (!termsAccepted) {
            setTermsError(true);
            return;
        }
        setTermsError(false);
        try {
            const { data } = await api.post(`auth/register`, {
                ...formData,
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
                router.push("/");
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
            toast({ title: "Registration Error", description: error?.response?.data?.msg || "Something went wrong", variant: "destructive" });
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
                router.push("/");
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
        if (!termsAccepted) {
            setTermsError(true);
            toast({
                title: "Consent Required",
                description: "Please accept the Terms and Privacy Policy before continuing.",
                variant: "destructive"
            });
            return;
        }
        try {
            const { data } = await api.post(`auth/google-signin`, {
                credential: credentialResponse.credential,
                termsAccepted: true,
                privacyAccepted: true,
                policyVersion: POLICY_VERSION,
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
                router.push("/");
                return;
            }
            toast({ title: "Google Sign-In failed", description: data.msg, variant: "destructive" });
        } catch (error) {
            toast({ title: "Google Sign-In failed", description: "Please try again", variant: "destructive" });
        }
    };

    const handleGoogleError = () => {
        toast({ title: "Google Sign-In failed", description: "Could not connect to Google. Try again.", variant: "destructive" });
    };

    return (
        <div className="flex justify-center items-center min-h-screen px-4 py-4 bg-black">
            <div className="w-full max-w-md premium-card rounded-2xl p-5 sm:p-6 animate-scale-in">

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
                ) : (
                    /* Registration Form Step */
                    <div className="animate-fade-up">
                        {/* Header */}
                        <div className="text-center mb-3">
                            <RegisterBadgeIcon className={AUTH_HEADER_ICON_CLASS} />
                            <h1 className="text-xl font-bold text-white mb-0.5">Create Account</h1>
                            <p className="text-neutral-500 text-xs">Join OneMoreGift and start winning</p>
                        </div>

                        {/* Google Sign-Up — Prominent placement */}
                        <div className="mb-3">
                            <div className="flex justify-center">
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={handleGoogleError}
                                    theme="filled_black"
                                    size="large"
                                    text="signup_with"
                                    shape="pill"
                                    width="100%"
                                />
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="relative flex items-center mb-3">
                            <div className="flex-1 h-px bg-white/[0.06]" />
                            <span className="px-4 text-[10px] text-neutral-600 font-medium uppercase tracking-wider">or register with email</span>
                            <div className="flex-1 h-px bg-white/[0.06]" />
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
                            <div className="flex flex-col space-y-0.5">
                                <Label htmlFor="name" className="text-neutral-300 text-xs flex items-center gap-1.5"><UserIcon className="w-3.5 h-3.5" />Username</Label>
                                <Input
                                    id="name"
                                    placeholder="Choose a username"
                                    className="premium-input h-9 text-white placeholder:text-neutral-600 text-sm"
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

                            <div className="flex flex-col space-y-0.5">
                                <Label htmlFor="phone" className="text-neutral-300 text-xs flex items-center gap-1.5"><PhoneIcon className="w-3.5 h-3.5" />Phone Number</Label>
                                <Input
                                    id="phone"
                                    placeholder="10-digit phone number"
                                    className="premium-input h-9 text-white placeholder:text-neutral-600 text-sm"
                                    {...register("phone", {
                                        required: false,
                                        validate: (value) => {
                                            if (!value) return true;
                                            return /^[6-9]\d{9}$/.test(value) || "Must be 10 digits, starting with 6–9";
                                        }
                                    })}
                                />
                                {errors.phone && <span className="text-red-400 text-[10px]">{errors.phone.message}</span>}
                            </div>

                            <div className="flex flex-col space-y-0.5">
                                <Label htmlFor="email" className="text-neutral-300 text-xs flex items-center gap-1.5"><EmailIcon className="w-3.5 h-3.5" />Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    className="premium-input h-9 text-white placeholder:text-neutral-600 text-sm"
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

                            <div className="flex flex-col space-y-0.5 relative">
                                <Label htmlFor="password" className="text-neutral-300 text-xs flex items-center gap-1.5"><LockIcon className="w-3.5 h-3.5" />Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Create a strong password"
                                        className="premium-input h-9 text-white placeholder:text-neutral-600 pr-12 w-full text-sm"
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
                                    <div className="space-y-1 mt-0.5">
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

                            {/* Terms & Conditions Checkbox */}
                            <div className="pt-0.5">
                                <label className="flex items-start gap-2.5 cursor-pointer group">
                                    <button
                                        type="button"
                                        onClick={() => setIsTermsModalOpen(true)}
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
                                        I agree to the{" "}
                                        <button
                                            type="button"
                                            onClick={() => setIsTermsModalOpen(true)}
                                            className="text-red-400 hover:text-red-300 font-semibold transition-colors"
                                        >
                                            Terms & Conditions
                                        </button>{" "}
                                        &{" "}
                                        <Link
                                            href="/privacy-policy"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-red-400 hover:text-red-300 font-semibold transition-colors"
                                        >
                                            Privacy Policy
                                        </Link>
                                        .
                                    </span>
                                </label>
                                {termsError && (
                                    <p className="text-red-400 text-[10px] mt-1 ml-6 flex items-center gap-1">
                                        <ShieldCheck className="w-3 h-3" />
                                        Please review and accept the terms to continue
                                    </p>
                                )}
                            </div>

                            <TermsModal
                                isOpen={isTermsModalOpen}
                                onOpenChange={setIsTermsModalOpen}
                                onAccept={() => {
                                    setTermsAccepted(true);
                                    setTermsError(false);
                                }}
                            />

                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full h-10 btn-gradient rounded-xl font-semibold text-sm mt-1"
                            >
                                {isSubmitting ? "Creating Account..." : "Create Account"}
                            </Button>
                        </form>

                        {/* Login Link */}
                        <div className="text-center pt-3 mt-1 border-t border-white/[0.06]">
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
