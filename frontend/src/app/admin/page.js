"use client";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, CheckCircle, XCircle, ShieldCheck } from "lucide-react";
import { useRouter } from 'next/navigation'
import { HiGift } from "react-icons/hi2";
import api from "../utils/apiClient";
import { useAuth } from "../context/AuthContext";

export default function AdminLoginForm() {
    const router = useRouter();
    const { toast } = useToast();
    const { refreshAdminSession } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef(null);

    // Cursor glow effect
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!containerRef.current) return;
            const { clientX, clientY } = e;
            const { left, top } = containerRef.current.getBoundingClientRect();
            containerRef.current.style.setProperty('--x', `${clientX - left}px`);
            containerRef.current.style.setProperty('--y', `${clientY - top}px`);
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

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
            toast({
                title: "Login Failed",
                variant: "destructive",
                description: "An unexpected error occurred. Please try again."
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            ref={containerRef}
            className="flex justify-center items-center min-h-screen px-4 py-12 bg-black relative overflow-hidden cursor-glow-container"
        >
            {/* Background elements */}
            <div className="absolute inset-0 section-gradient opacity-40" />
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-[120px] animate-pulse-slow" />

            <div className="w-full max-w-md premium-card rounded-3xl p-8 md:p-10 relative z-10 animate-scale-in">
                {/* Brand Header */}
                <div className="text-center mb-10">
                    <div className="w-16 h-16 rounded-2xl bg-red-600 flex items-center justify-center mx-auto mb-6 shadow-glow">
                        <ShieldCheck className="text-white text-3xl" />
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2">
                            <HiGift className="text-red-500 text-2xl" />
                            <span className="text-2xl font-bold text-white tracking-tight">
                                OneMore<span className="text-gradient">Gift</span>
                            </span>
                        </div>
                        <h1 className="text-xl font-semibold text-neutral-300 mt-2">Admin Control Center</h1>
                        <p className="text-sm text-neutral-500">Secure access for platform administrators</p>
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
                            className="premium-input h-12 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-neutral-600 rounded-xl"
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
                                className="premium-input h-12 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-neutral-600 pr-12 rounded-xl"
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
                        className="w-full h-12 btn-gradient rounded-xl font-bold text-base mt-4 shadow-lg shadow-red-600/10 hover:shadow-red-600/20 transition-all duration-300"
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
                        <p className="text-[10px] text-neutral-600 uppercase tracking-widest font-semibold flex items-center justify-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            End-to-End Encrypted Session
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
