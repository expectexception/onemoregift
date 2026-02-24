"use client";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from 'next/navigation'
import { GoogleLogin } from "@react-oauth/google";
import api from "../utils/apiClient";
import { useAuth } from "../context/AuthContext";
import SessionLoader from "./SessionLoader";

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
    const [showPassword, setShowPassword] = useState(false);
    const [forgetpass, setForgetPass] = useState(false);
    const [loginMode, setLoginMode] = useState("password");

    useEffect(() => {
        if (userAuthenticated) {
            router.replace("/");
        }
    }, [router, userAuthenticated]);

    if (loadingUser) return <SessionLoader label="Checking your account session..." />;
    if (userAuthenticated) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.post(`auth/login`, { email, password });
            if (data.error === false) {
                toast({
                    title: "Success",
                    description: (<div className="flex items-center space-x-2"><CheckCircle className="text-green-500 w-5 h-5" /><span>Login successful.</span></div>)
                });
                localStorage.setItem('token', data.token);
                await refreshUserSession();
                router.push('/');
            } else if (data.error == true) {
                toast({
                    title: "Login Failed",
                    variant: "destructive",
                    description: (<div className="flex items-center space-x-2"><XCircle className="text-white w-5 h-5" /><span>{data.msg}</span></div>)
                });
            }
        } catch (error) {
            if (error?.response?.data?.unverified) {
                toast({
                    title: "Email Not Verified",
                    description: "Switching to OTP mode to verify your account...",
                    variant: "destructive"
                });
                setLoginMode("otp");
                setForgetPass(false);
                // Call handleRequestOtp but since it's an async function and we need the latest state,
                // we can just call it directly since `email` state is already set by the user's input.
                handleRequestOtp();
            } else {
                toast({
                    title: "Login Failed",
                    description: error?.response?.data?.msg || "Please check your credentials.",
                    variant: "destructive"
                });
            }
        }
    };

    const handleResetPass = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.post(`auth/reset-pass`, { email });
            if (data.error === false) {
                toast({
                    title: "Success",
                    description: (<div className="flex items-center space-x-2"><CheckCircle className="text-green-500 w-5 h-5" /><span>Password reset link will be sent if the email exists.</span></div>)
                });
            }
        } catch (error) {
            toast({ title: "Something went wrong.", variant: "destructive" });
        }
    };

    const handleRequestOtp = async () => {
        if (!email) {
            toast({ title: "Email required", description: "Please enter your email first.", variant: "destructive" });
            return;
        }
        try {
            setOtpLoading(true);
            const { data } = await api.post(`auth/request-otp`, { email });
            if (!data.error) {
                setOtpSent(true);
                setOtp("");
                // Start 60s countdown
                setResendCountdown(60);
                const timer = setInterval(() => {
                    setResendCountdown(prev => {
                        if (prev <= 1) { clearInterval(timer); return 0; }
                        return prev - 1;
                    });
                }, 1000);
                toast({ title: "OTP Sent!", description: "Check your email inbox for the 6-digit OTP." });
            } else {
                toast({ title: "Failed", description: data.msg, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Failed", description: "Could not send OTP. Try again.", variant: "destructive" });
        } finally {
            setOtpLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.post(`auth/verify-otp`, { email, otp });
            if (!data.error) {
                localStorage.setItem('token', data.token);
                await refreshUserSession();
                toast({ title: "Success", description: "OTP login successful" });
                router.push('/');
                return;
            }
            toast({ title: "OTP failed", description: data.msg, variant: "destructive" });
        } catch (error) {
            toast({ title: "OTP failed", description: "Invalid or expired OTP", variant: "destructive" });
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const { data } = await api.post(`auth/google-signin`, { credential: credentialResponse.credential });
            if (!data.error) {
                localStorage.setItem("token", data.token);
                await refreshUserSession();
                toast({ title: "Success", description: "Google Sign-In successful." });
                router.push("/");
                return;
            }
            toast({ title: "Google Sign-In failed", description: data.msg, variant: "destructive" });
        } catch (error) {
            toast({ title: "Google Sign-In failed", description: "Please try again", variant: "destructive" });
        }
    };

    const handleGoogleError = () => {
        toast({ title: "Google Sign-In failed", variant: "destructive" });
    };

    return (
        <div className="flex justify-center items-center min-h-screen px-4 py-12 bg-black">
            <div className="w-full max-w-md premium-card rounded-2xl p-8 animate-scale-in">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-red-600 flex items-center justify-center mx-auto mb-4">
                        <span className="text-white text-2xl">👋</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
                    <p className="text-neutral-500">Sign in to continue to your account</p>
                </div>

                {/* Login Mode Toggle */}
                <div className="grid grid-cols-2 gap-2 mb-6 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                    <Button
                        type="button"
                        className={`rounded-lg transition-all ${loginMode === "password" ? "btn-gradient" : "bg-transparent text-neutral-400 hover:text-white"}`}
                        onClick={() => setLoginMode("password")}
                    >
                        Password
                    </Button>
                    <Button
                        type="button"
                        className={`rounded-lg transition-all ${loginMode === "otp" ? "btn-gradient" : "bg-transparent text-neutral-400 hover:text-white"}`}
                        onClick={() => {
                            setLoginMode("otp");
                            setForgetPass(false);
                            setOtpSent(false);
                        }}
                    >
                        OTP
                    </Button>
                </div>

                <form onSubmit={loginMode === "password" ? handleSubmit : handleVerifyOtp} className="space-y-5">
                    <div className="flex flex-col space-y-2">
                        <Label htmlFor="email" className="text-neutral-300">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="premium-input h-12 text-white placeholder:text-neutral-600"
                        />
                    </div>

                    {loginMode === "password" ? (
                        <>
                            <div className="flex flex-col space-y-2 relative">
                                <Label htmlFor="password" className="text-neutral-300">Password</Label>
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="premium-input h-12 text-white placeholder:text-neutral-600 pr-12"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-2 top-8 text-neutral-500 hover:text-white"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </Button>
                            </div>
                            <Button type="submit" className="w-full h-12 btn-gradient rounded-xl font-semibold text-base">
                                Sign In
                            </Button>
                        </>
                    ) : (
                        <>
                            {/* OTP Status Banner */}
                            {otpSent && (
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-600/10 border border-emerald-600/20 text-emerald-400 text-sm">
                                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                                    <span>OTP sent to <strong>{email}</strong>. Check your inbox.</span>
                                </div>
                            )}

                            {/* OTP Input */}
                            <div className="flex flex-col space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="otp" className="text-neutral-300">One-Time Password</Label>
                                    <button
                                        type="button"
                                        onClick={handleRequestOtp}
                                        disabled={otpLoading || resendCountdown > 0}
                                        className="text-xs text-red-400 hover:text-red-300 disabled:text-neutral-600 disabled:cursor-not-allowed transition-colors"
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
                                    autoFocus
                                    maxLength={6}
                                    placeholder="Enter 6-digit OTP"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                    required
                                    className="premium-input h-12 text-white placeholder:text-neutral-600 tracking-[0.3em] text-center text-lg font-mono focus:border-red-500/50"
                                />
                            </div>
                            {!otpSent && (
                                <Button
                                    type="button"
                                    className="w-full h-12 btn-outline-premium rounded-xl font-semibold"
                                    onClick={handleRequestOtp}
                                    disabled={otpLoading}
                                >
                                    {otpLoading ? "Sending OTP..." : "Send OTP to Email"}
                                </Button>
                            )}
                            {otpSent && (
                                <Button type="submit" className="w-full h-12 btn-gradient rounded-xl font-semibold text-base">
                                    Verify & Sign In
                                </Button>
                            )}
                        </>
                    )}

                    {/* Forgot Password */}
                    <div className="text-center">
                        <button
                            type="button"
                            className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                            onClick={() => setForgetPass(!forgetpass)}
                        >
                            Forgot Password?
                        </button>
                    </div>

                    {forgetpass && (
                        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-4">
                            <div className="flex flex-col space-y-2">
                                <Label htmlFor="reset-email" className="text-neutral-300">Reset Email</Label>
                                <Input
                                    id="reset-email"
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="premium-input h-12 text-white placeholder:text-neutral-600"
                                />
                            </div>
                            <Button type="button" className="w-full h-11 btn-outline-premium rounded-xl" onClick={handleResetPass}>
                                Send Reset Link
                            </Button>
                        </div>
                    )}

                    {/* Divider */}
                    <div className="relative flex items-center py-1">
                        <div className="flex-1 h-px bg-white/[0.06]" />
                        <span className="px-4 text-sm text-neutral-600">or continue with</span>
                        <div className="flex-1 h-px bg-white/[0.06]" />
                    </div>

                    {/* Google Login */}
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

                    {/* Register Link */}
                    <div className="text-center pt-4 border-t border-white/[0.06]">
                        <span className="text-neutral-500">Don&apos;t have an account? </span>
                        <Link className="text-red-400 hover:text-red-300 font-medium transition-colors" href="/register">
                            Create Account
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
