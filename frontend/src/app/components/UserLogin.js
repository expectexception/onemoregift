"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GoogleLogin } from "@react-oauth/google";
import { Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import api from "../utils/apiClient";
import { EmailIcon, LockIcon, ResetPasswordIcon } from "./SVGIcons";
import FormFieldWithIcon from "./FormFieldWithIcon";
import { useAuth } from "../context/AuthContext";
import SessionLoader from "./SessionLoader";

const MailSparkIcon = ({ className = "w-6 h-6" }) => (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <rect x="7" y="12" width="34" height="25" rx="6" fill="url(#mailSparkGradient)" />
        <path d="M10 17.5 22.2 27a3 3 0 0 0 3.6 0L38 17.5" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M35 7v7M31.5 10.5h7M12 39l-4 4M39 36l3 3" stroke="#fecaca" strokeWidth="2.5" strokeLinecap="round" />
        <defs>
            <linearGradient id="mailSparkGradient" x1="7" x2="41" y1="12" y2="37" gradientUnits="userSpaceOnUse">
                <stop stopColor="#ef4444" />
                <stop offset="1" stopColor="#991b1b" />
            </linearGradient>
        </defs>
    </svg>
);

const ShieldOtpIcon = ({ className = "w-6 h-6" }) => (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path d="M24 5 39 11v11c0 10.5-6.2 17-15 21-8.8-4-15-10.5-15-21V11L24 5Z" fill="#dc2626" />
        <path d="M18 25h12M18 31h12M18 19h.01M24 19h.01M30 19h.01" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
);

const AUTH_HEADER_ICON_CLASS = "w-[72px] h-[72px] mx-auto mb-5";
const POLICY_VERSION = "2026-05-28";
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
const ENABLE_GOOGLE_LOGIN = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN === "true";
const SHOW_GOOGLE_LOGIN = ENABLE_GOOGLE_LOGIN && Boolean(GOOGLE_CLIENT_ID);

export default function UserLoginForm() {
    const router = useRouter();
    const { toast } = useToast();
    const { userAuthenticated, loadingUser, refreshUserSession } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [resendCountdown, setResendCountdown] = useState(0);
    const [resetCountdown, setResetCountdown] = useState(0);
    const [resetLoading, setResetLoading] = useState(false);
    const [resetSent, setResetSent] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loginMode, setLoginMode] = useState("password");
    const [screen, setScreen] = useState("signin");

    useEffect(() => {
        if (userAuthenticated) {
            router.replace("/");
        }
    }, [router, userAuthenticated]);

    useEffect(() => {
        if (resendCountdown <= 0) return undefined;
        const timer = setTimeout(() => setResendCountdown((value) => value - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendCountdown]);

    useEffect(() => {
        if (resetCountdown <= 0) return undefined;
        const timer = setTimeout(() => setResetCountdown((value) => value - 1), 1000);
        return () => clearTimeout(timer);
    }, [resetCountdown]);

    if (loadingUser) return <SessionLoader label="Checking your account session..." />;
    if (userAuthenticated) return null;

    const showSuccessToast = (title, description) => {
        toast({
            title,
            description: (
                <div className="flex items-center space-x-2">
                    <CheckCircle className="text-green-500 w-5 h-5" />
                    <span>{description}</span>
                </div>
            ),
        });
    };

    const showErrorToast = (title, description) => {
        toast({
            title,
            variant: "destructive",
            description: (
                <div className="flex items-center space-x-2">
                    <XCircle className="text-white w-5 h-5" />
                    <span>{description}</span>
                </div>
            ),
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.post("auth/login", { loginId: email, password });
            if (data.error === false) {
                showSuccessToast("Signed in", "Welcome back.");
                localStorage.setItem("token", data.token);
                await refreshUserSession();
                router.push("/");
                return;
            }

            showErrorToast("Login Failed", data.msg || "Please check your credentials.");
        } catch (error) {
            if (error?.response?.data?.unverified) {
                toast({
                    title: "Email Not Verified",
                    description: "We are sending a verification OTP to your email.",
                    variant: "destructive",
                });
                setLoginMode("otp");
                setScreen("signin");
                await handleRequestOtp();
                return;
            }

            showErrorToast("Login Failed", error?.response?.data?.msg || "Please check your credentials.");
        }
    };

    const handleRequestOtp = async () => {
        if (!email) {
            showErrorToast("Email required", "Please enter your email first.");
            return false;
        }

        try {
            setOtpLoading(true);
            const { data } = await api.post("auth/request-otp", { email });
            if (!data.error) {
                setOtpSent(true);
                setOtp("");
                setResendCountdown(Math.ceil((data.expiresInSeconds || 60) / 5));
                showSuccessToast("OTP sent", data.msg || "Check your email inbox for the 6-digit OTP.");
                return true;
            }

            showErrorToast("OTP failed", data.msg || "Could not send OTP.");
            return false;
        } catch (error) {
            showErrorToast("OTP failed", error?.response?.data?.msg || "Could not send OTP. Try again.");
            return false;
        } finally {
            setOtpLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.post("auth/verify-otp", { email, otp });
            if (!data.error) {
                localStorage.setItem("token", data.token);
                await refreshUserSession();
                showSuccessToast("Signed in", "OTP verified successfully.");
                router.push("/");
                return;
            }
            showErrorToast("OTP failed", data.msg || "Invalid OTP.");
        } catch (error) {
            showErrorToast("OTP failed", error?.response?.data?.msg || "Invalid or expired OTP.");
        }
    };

    const handleResetPass = async (e) => {
        e.preventDefault();
        if (!email) {
            showErrorToast("Email required", "Enter your registered email to receive the reset link.");
            return;
        }

        try {
            setResetLoading(true);
            const { data } = await api.post("auth/reset-pass", { email });
            if (!data.error) {
                setResetSent(true);
                setResetCountdown(60);
                showSuccessToast("Reset link requested", data.msg || "If the email exists, a reset link has been sent.");
                return;
            }

            showErrorToast("Reset failed", data.msg || "Could not request a reset link.");
        } catch (error) {
            showErrorToast("Reset failed", error?.response?.data?.msg || "Could not request a reset link. Try again.");
        } finally {
            setResetLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const { data } = await api.post("auth/google-signin", {
                credential: credentialResponse?.credential,
                termsAccepted: true,
                privacyAccepted: true,
                policyVersion: POLICY_VERSION,
                mode: "login",
            });
            if (!data.error) {
                localStorage.setItem("token", data.token);
                await refreshUserSession();
                showSuccessToast("Signed in", "Google Sign-In successful.");
                router.push("/");
                return;
            }
            showErrorToast("Google Sign-In failed", data.msg || "Please try again.");
        } catch (error) {
            showErrorToast("Google Sign-In failed", error?.response?.data?.msg || "Please try again.");
        }
    };

    const handleGoogleError = () => {
        showErrorToast("Google Sign-In failed", "Could not connect to Google. Try again.");
    };

    const resetSigninState = () => {
        setScreen("signin");
        setResetSent(false);
    };

    return (
        <div className="flex justify-center items-center min-h-screen px-4 py-4 bg-black relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(220,38,38,0.16),transparent_32%),radial-gradient(circle_at_90%_85%,rgba(127,29,29,0.18),transparent_38%)]" />
            <div className="absolute inset-0 noise-overlay" />

            <div className="relative w-full max-w-md premium-card rounded-2xl p-5 sm:p-6 animate-scale-in shadow-[0_30px_70px_-40px_rgba(239,68,68,0.65)]">
                <div className="text-center mb-3">
                    {screen === "reset" ? <ResetPasswordIcon className={AUTH_HEADER_ICON_CLASS} /> : loginMode === "otp" ? <ShieldOtpIcon className={AUTH_HEADER_ICON_CLASS} /> : <MailSparkIcon className={AUTH_HEADER_ICON_CLASS} />}
                    <h1 className="text-xl font-bold text-white mb-0.5">
                        {screen === "reset" ? "Send Reset Link" : "Welcome Back"}
                    </h1>
                    <p className="text-neutral-500 text-xs">
                        {screen === "reset"
                            ? "We will email a secure password reset link if the account exists."
                            : "Sign in with your password or a one-time email code."}
                    </p>
                </div>

                {screen === "reset" ? (
                    <form onSubmit={handleResetPass} className="space-y-2.5">
                        {resetSent && (
                            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-xs text-emerald-200">
                                <div className="flex gap-2">
                                    <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                                    <div>
                                        <p className="font-semibold text-emerald-100">Request received</p>
                                        <p className="mt-0.5 text-emerald-200/80">
                                            Check <strong>{email}</strong> and spam. Link expires in 1 hour.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col space-y-0.5">
                            <Label htmlFor="reset-email" className="text-neutral-300 text-xs flex items-center gap-1.5"><EmailIcon className="w-4 h-4" />Email</Label>
                            <Input
                                id="reset-email"
                                type="email"
                                placeholder="Enter your registered email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="premium-input h-10 text-white placeholder:text-neutral-600 text-sm"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-10 btn-gradient rounded-xl font-semibold text-sm"
                            disabled={resetLoading || resetCountdown > 0}
                        >
                            {resetLoading ? "Sending reset link..." : resetCountdown > 0 ? `Resend in ${resetCountdown}s` : resetSent ? "Send Reset Link Again" : "Send Reset Link"}
                        </Button>

                        <Button
                            type="button"
                            className="w-full h-10 btn-outline-premium rounded-xl text-sm"
                            onClick={resetSigninState}
                        >
                            Back to Sign In
                        </Button>
                    </form>
                ) : (
                    <form onSubmit={loginMode === "password" ? handleSubmit : handleVerifyOtp} className="space-y-2.5">
                        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                            <Button
                                type="button"
                                className={`rounded-lg transition-all h-9 text-xs ${loginMode === "password" ? "btn-gradient" : "bg-transparent text-neutral-400 hover:text-white"}`}
                                onClick={() => setLoginMode("password")}
                            >
                                Password
                            </Button>
                            <Button
                                type="button"
                                className={`rounded-lg transition-all h-9 text-xs ${loginMode === "otp" ? "btn-gradient" : "bg-transparent text-neutral-400 hover:text-white"}`}
                                onClick={() => {
                                    setLoginMode("otp");
                                    setOtpSent(false);
                                }}
                            >
                                OTP Email
                            </Button>
                        </div>

                        <div className="flex flex-col space-y-0.5">
                            <Label htmlFor="email" className="text-neutral-300 text-xs flex items-center gap-1.5"><EmailIcon className="w-4 h-4" />Email or Username</Label>
                            <Input
                                id="email"
                                type="text"
                                placeholder="Enter email or username"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="premium-input h-10 text-white placeholder:text-neutral-600 text-sm"
                            />
                        </div>

                        {loginMode === "password" ? (
                            <>
                                <div className="flex flex-col space-y-0.5">
                                    <Label htmlFor="password" className="text-neutral-300 text-xs flex items-center gap-1.5"><LockIcon className="w-4 h-4" />Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Enter your password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="premium-input h-10 text-white placeholder:text-neutral-600 pr-12 text-sm"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white h-8 w-8"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                </div>

                                <Button type="submit" className="w-full h-10 btn-gradient rounded-xl font-semibold text-sm">
                                    Sign In
                                </Button>
                            </>
                        ) : (
                            <>
                                {otpSent && (
                                    <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-600/10 border border-emerald-600/20 text-emerald-300 text-xs">
                                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                                        <span>OTP sent to <strong>{email}</strong>. Check inbox/spam folder.</span>
                                    </div>
                                )}

                                <div className="flex flex-col space-y-0.5">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="otp" className="text-neutral-300 text-xs">One-Time Password</Label>
                                        <button
                                            type="button"
                                            onClick={handleRequestOtp}
                                            disabled={otpLoading || resendCountdown > 0}
                                            className="text-[10px] text-red-400 hover:text-red-300 disabled:text-neutral-600 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {otpLoading
                                                ? "Sending..."
                                                : resendCountdown > 0
                                                    ? `Resend in ${resendCountdown}s`
                                                    : otpSent ? "Resend OTP" : "Send OTP"}
                                        </button>
                                    </div>
                                    <Input
                                        id="otp"
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={6}
                                        placeholder="Enter 6-digit OTP"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                        required={otpSent}
                                        className="premium-input h-10 text-white placeholder:text-neutral-600 tracking-[0.3em] text-center text-sm font-mono focus:border-red-500/50"
                                    />
                                </div>

                                {!otpSent ? (
                                    <Button
                                        type="button"
                                        className="w-full h-10 btn-outline-premium rounded-xl font-semibold text-sm"
                                        onClick={handleRequestOtp}
                                        disabled={otpLoading}
                                    >
                                        {otpLoading ? "Sending OTP..." : "Send OTP to Email"}
                                    </Button>
                                ) : (
                                    <Button type="submit" className="w-full h-10 btn-gradient rounded-xl font-semibold text-sm">
                                        Verify & Sign In
                                    </Button>
                                )}
                            </>
                        )}

                        <button
                            type="button"
                            className="w-full rounded-xl border border-red-500/20 bg-red-500/5 p-2.5 text-left transition hover:border-red-500/40 hover:bg-red-500/10"
                            onClick={() => setScreen("reset")}
                        >
                            <div className="flex items-center gap-2.5">
                                <ResetPasswordIcon className="w-7 h-7 flex-shrink-0" />
                                <div>
                                    <p className="text-xs font-semibold text-white">Forgot password?</p>
                                    <p className="text-[10px] text-neutral-500">Send a secure reset link to your email.</p>
                                </div>
                            </div>
                        </button>

                        {SHOW_GOOGLE_LOGIN && (
                            <>
                                <div className="relative flex items-center py-0.5">
                                    <div className="flex-1 h-px bg-white/[0.06]" />
                                    <span className="px-4 text-[10px] text-neutral-600">or continue with</span>
                                    <div className="flex-1 h-px bg-white/[0.06]" />
                                </div>

                                <div className="flex justify-center">
                                    <GoogleLogin
                                        onSuccess={handleGoogleSuccess}
                                        onError={handleGoogleError}
                                        theme="filled_black"
                                        size="large"
                                        text="signin_with"
                                        shape="pill"
                                    />
                                </div>
                            </>
                        )}

                        <div className="text-center pt-2.5 border-t border-white/[0.06]">
                            <span className="text-neutral-500 text-xs">Don&apos;t have an account? </span>
                            <Link className="text-red-400 hover:text-red-300 font-medium transition-colors text-xs" href="/register">
                                Create Account
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
