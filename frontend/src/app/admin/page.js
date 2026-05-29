"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { useRouter } from 'next/navigation'
import { HiGift } from "react-icons/hi2";
import api from "../utils/apiClient";
import { useAuth } from "../context/AuthContext";

function AdminShieldMark() {
    return (
        <svg viewBox="0 0 64 64" className="w-9 h-9" fill="none" aria-hidden="true">
            <defs>
                <linearGradient id="shieldGrad" x1="10" y1="8" x2="54" y2="56" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#ffffff" />
                    <stop offset="1" stopColor="#fecaca" />
                </linearGradient>
            </defs>
            <path d="M32 6L52 14V30C52 42 44.7 52.8 32 58C19.3 52.8 12 42 12 30V14L32 6Z" fill="url(#shieldGrad)" fillOpacity="0.18" stroke="url(#shieldGrad)" strokeWidth="2" />
            <path d="M24 31L29 36L40 25" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function GiftWordmark() {
    return (
        <svg viewBox="0 0 180 24" className="h-6 w-auto" fill="none" aria-label="OneMoreGift">
            <text x="0" y="17" fill="#ffffff" fontSize="16" fontWeight="800" fontFamily="system-ui, sans-serif">OneMore</text>
            <text x="82" y="17" fill="#ef4444" fontSize="16" fontWeight="800" fontFamily="system-ui, sans-serif">Gift</text>
        </svg>
    );
}

export default function AdminLoginForm() {
    const router = useRouter();
    const { toast } = useToast();
    const { refreshAdminSession } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post(`admin/login`, {
                email: email,
                password: password
            });

            if (data.error === false) {
                toast({
                    title: "Success",
                    description: (
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="text-green-500 w-5 h-5" />
                            <span>Login successful. Welcome back!</span>
                        </div>
                    )
                });
                localStorage.setItem('atoken', data.authtoken);
                await refreshAdminSession();
                router.push('/admin/dashboard');
            } else {
                toast({
                    title: "Login Failed",
                    variant: "destructive",
                    description: (
                        <div className="flex items-center space-x-2">
                            <XCircle className="text-white w-5 h-5" />
                            <span>{data.msg}</span>
                        </div>
                    )
                });
            }
        } catch (error) {
            const errorMsg = error.response?.data?.msg || "An unexpected error occurred. Please try again.";
            toast({
                title: "Login Failed",
                variant: "destructive",
                description: (
                    <div className="flex items-center space-x-2">
                        <XCircle className="text-white w-5 h-5" />
                        <span>{errorMsg}</span>
                    </div>
                )
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#070707] px-4 py-10">
            <div className="w-full max-w-md rounded-lg border border-white/[0.08] bg-[#111111] p-6 shadow-2xl md:p-8">
                {/* Brand Header */}
                <div className="text-center mb-10">
                    <div className="w-16 h-16 rounded-lg bg-red-600 flex items-center justify-center mx-auto mb-6">
                        <AdminShieldMark />
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2 rounded-lg px-3 py-2 bg-white/[0.03] border border-white/[0.06]">
                            <HiGift className="text-red-500 text-2xl" />
                            <GiftWordmark />
                        </div>
                        <h1 className="text-xl font-semibold text-neutral-300 mt-2">Admin Login</h1>
                        <p className="text-sm text-neutral-500">Sign in to manage the platform</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-neutral-300 text-sm font-medium ml-1">Admin Email</Label>
                            <Input
                                id="email"
                            type="email"
                            placeholder="admin@onemoregift.in"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                                className="h-12 rounded-lg border-white/[0.08] bg-white/[0.03] text-white placeholder:text-neutral-600"
                        />
                    </div>

                    <div className="space-y-2 relative">
                        <div className="flex justify-between items-center ml-1">
                            <Label htmlFor="password" className="text-neutral-300 text-sm font-medium">Security Password</Label>
                        </div>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-12 rounded-lg border-white/[0.08] bg-white/[0.03] pr-12 text-white placeholder:text-neutral-600"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </Button>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 rounded-lg bg-red-600 text-base font-semibold text-white hover:bg-red-500 mt-4"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Authenticating...
                            </span>
                        ) : "Access Dashboard"}
                    </Button>

                    {/* Security Note */}
                    <div className="pt-6 border-t border-white/[0.06] text-center">
                        <p className="text-xs text-neutral-500 font-medium flex items-center justify-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Secure Admin Session
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
