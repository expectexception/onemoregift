"use client";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from 'next/navigation';
import api from "@/app/utils/apiClient";
import { HiLockClosed } from "react-icons/hi";

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
        if (password !== confirmPassword) {
            toast({
                title: "Password Mismatch",
                variant: "destructive",
                description: (<div className="flex items-center space-x-2"><XCircle className="text-white w-5 h-5" /><span>Passwords do not match.</span></div>),
            });
            return;
        }
        try {
            const res = await api.post(`auth/set-pass`, { email, password, token });
            const data = res.data;
            if (data.error) {
                toast({
                    title: "Password Reset Failed",
                    variant: "destructive",
                    description: (<div className="flex items-center space-x-2"><XCircle className="text-white w-5 h-5" /><span>{data.msg}</span></div>),
                });
            } else {
                toast({
                    title: "Success",
                    description: (<div className="flex items-center space-x-2"><CheckCircle className="text-green-500 w-5 h-5" /><span>Password changed successfully.</span></div>),
                });
                router.push('/login');
            }
        } catch (error) {
            toast({ title: "Password Reset Failed", variant: "destructive" });
        }
    };

    if (!isMounted) return null;

    return (
        <div className="min-h-screen flex flex-col bg-black">
            <div className="sticky top-0 z-50">
                <Navbar />
            </div>

            <div className="flex-1 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md premium-card rounded-2xl p-8 animate-scale-in">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-red-600 flex items-center justify-center mx-auto mb-4">
                            <HiLockClosed className="text-white text-2xl" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
                        <p className="text-neutral-500">Create a new password for your account</p>
                    </div>

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

                        <Button type="submit" className="w-full h-12 btn-gradient rounded-xl font-semibold text-base">
                            Reset Password
                        </Button>
                    </form>
                </div>
            </div>

            <Footer />
        </div>
    );
}
