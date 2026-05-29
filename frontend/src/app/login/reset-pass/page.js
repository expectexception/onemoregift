"use client";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from 'next/navigation';
import api from "@/app/utils/apiClient";
import { ResetPasswordIcon } from "@/app/components/SVGIcons";

const AUTH_HEADER_ICON_CLASS = "w-[72px] h-[72px] mx-auto mb-5";

export default function ResetPass() {
    const router = useRouter();
    const { toast } = useToast();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [token, setToken] = useState("");
    const [email, setEmail] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const urlParams = new URLSearchParams(window.location.search);
            const t = urlParams.get("token");
            const e = urlParams.get("email");
            if (t && e) {
                setToken(t);
                setEmail(e);
            }
            setIsMounted(true);
        }
    }, []);

    const handleResetPass = async (e) => {
        e.preventDefault();
        if (!token || !email) {
            toast({
                title: "Invalid Reset Link",
                variant: "destructive",
                description: "Please request a fresh password reset link.",
            });
            return;
        }
        if (password.length < 6) {
            toast({
                title: "Weak Password",
                variant: "destructive",
                description: "Password must be at least 6 characters.",
            });
            return;
        }
        if (password !== confirmPassword) {
            toast({
                title: "Password Mismatch",
                variant: "destructive",
                description: (<div className="flex items-center space-x-2"><XCircle className="text-white w-5 h-5" /><span>Passwords do not match.</span></div>),
            });
            return;
        }
        try {
            setIsSubmitting(true);
            const res = await api.post(`auth/set-pass`, { email, password, token });
            const data = res.data;
            if (data.error) {
                toast({
                    title: "Password Reset Failed",
                    variant: "destructive",
                    description: (<div className="flex items-center space-x-2"><XCircle className="text-white w-5 h-5" /><span>{data.msg}</span></div>),
                });
            } else {
                setIsComplete(true);
                toast({
                    title: "Success",
                    description: (<div className="flex items-center space-x-2"><CheckCircle className="text-green-500 w-5 h-5" /><span>Password changed successfully.</span></div>),
                });
                setTimeout(() => router.push('/login'), 1200);
            }
        } catch (error) {
            toast({
                title: "Password Reset Failed",
                description: error?.response?.data?.msg || "Please request a fresh reset link and try again.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isMounted) return null;

    return (
        <div className="min-h-screen flex flex-col bg-black">
            <div className="sticky top-0 z-50">
                <Navbar />
            </div>

            <div className="flex-1 flex items-center justify-center px-4 py-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(220,38,38,0.16),transparent_32%),radial-gradient(circle_at_90%_85%,rgba(127,29,29,0.18),transparent_38%)]" />
                <div className="absolute inset-0 noise-overlay" />
                <div className="w-full max-w-md premium-card rounded-2xl p-8 animate-scale-in">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <ResetPasswordIcon className={AUTH_HEADER_ICON_CLASS} />
                        <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
                        <p className="text-neutral-500">
                            {token && email ? `Create a new password for ${email}` : "This reset link is missing required details."}
                        </p>
                    </div>

                    {isComplete ? (
                        <div className="space-y-5 text-center">
                            <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-5 text-emerald-100">
                                <CheckCircle className="mx-auto mb-3 h-8 w-8 text-emerald-400" />
                                <p className="font-semibold">Password changed successfully</p>
                                <p className="mt-2 text-sm text-emerald-200/80">Redirecting you back to sign in...</p>
                            </div>
                        </div>
                    ) : !token || !email ? (
                        <div className="space-y-5">
                            <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-5 text-red-100">
                                <div className="flex gap-3">
                                    <XCircle className="h-6 w-6 flex-shrink-0 text-red-300" />
                                    <div>
                                        <p className="font-semibold">Invalid or incomplete reset link</p>
                                        <p className="mt-1 text-sm text-red-100/75">Please request a fresh link from the login page.</p>
                                    </div>
                                </div>
                            </div>
                            <Button type="button" className="w-full h-12 btn-gradient rounded-xl" onClick={() => router.push('/login')}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
                            </Button>
                        </div>
                    ) : (
                    <form onSubmit={handleResetPass} className="space-y-5">
                        <div className="flex flex-col space-y-2 relative">
                            <Label htmlFor="password" className="text-neutral-300">New Password</Label>
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter new password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="premium-input h-12 text-white placeholder:text-neutral-600 pr-12"
                            />
                            <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-8 text-neutral-500 hover:text-white" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </Button>
                        </div>

                        <div className="flex flex-col space-y-2 relative">
                            <Label htmlFor="confirmPassword" className="text-neutral-300">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="premium-input h-12 text-white placeholder:text-neutral-600 pr-12"
                            />
                            <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-8 text-neutral-500 hover:text-white" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </Button>
                        </div>

                        <Button type="submit" disabled={isSubmitting} className="w-full h-12 btn-gradient rounded-xl font-semibold text-base">
                            {isSubmitting ? "Updating Password..." : "Reset Password"}
                        </Button>
                    </form>
                    )}
                </div>
            </div>

            <Footer />
        </div>
    );
}
