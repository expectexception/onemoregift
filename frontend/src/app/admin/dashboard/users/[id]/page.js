"use client";
import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Shield,
    Gift,
    Trophy,
    ArrowLeft,
    RefreshCw,
    Lock,
    CheckCircle,
    AlertCircle
} from "lucide-react";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import api from "@/app/utils/apiClient";
import withAdminAuth from "../../../../components/withAdminAuth";

const UserProfilePage = () => {
    const pathname = usePathname();
    const router = useRouter();
    const { toast } = useToast();
    const userId = pathname.split('/').pop();

    const [user, setUser] = useState(null);
    const [joinedGiveaway, setJoinedGiveaway] = useState(0);
    const [won, setWon] = useState(0);
    const [loading, setLoading] = useState(true);

    // Password reset state
    const [newPassword, setNewPassword] = useState("");
    const [resetLoading, setResetLoading] = useState(false);

    const fetchUser = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`admin/users/${userId}`, {
                meta: { auth: "admin" },
            });
            if (!data.error) {
                setUser(data.data);
                setWon(data.wonGiveaways);
                setJoinedGiveaway(data.joinedGiveaways);
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch user profile", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast, userId]);

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        if (!newPassword || newPassword.length < 6) {
            toast({ title: "Invalid Password", description: "Password must be at least 6 characters.", variant: "destructive" });
            return;
        }

        setResetLoading(true);
        try {
            const { data } = await api.patch(`admin/users/${userId}`, {
                name: user.name,
                email: user.email,
                phone: user.phone,
                password: newPassword
            }, {
                meta: { auth: "admin" }
            });

            if (!data.error) {
                toast({
                    title: "Password Reset Successful",
                    description: (
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>Password for {user.name} has been updated.</span>
                        </div>
                    )
                });
                setNewPassword("");
            } else {
                toast({ title: "Update Failed", description: data.msg, variant: "destructive" });
            }
        } catch (error) {
            const message = error?.response?.data?.msg || "Failed to update password";
            toast({ title: "Error", description: message, variant: "destructive" });
        } finally {
            setResetLoading(false);
        }
    };

    useEffect(() => {
        if (userId) fetchUser();
    }, [userId, fetchUser]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-red-600 animate-spin" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
                <AlertCircle className="w-12 h-12 text-neutral-700" />
                <p className="text-neutral-500">User not found</p>
                <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#070707] p-4 md:p-8">
            <div className="max-w-[1400px] mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">Back to Users</span>
                    </button>
                    <div className={`px-4 py-1.5 rounded-full text-xs font-semibold border ${user.blocked
                        ? "bg-red-500/10 text-red-500 border-red-500/20"
                        : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        }`}>
                        {user.blocked ? "Account Blocked" : "Account Active"}
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* Left Column: Profile Card */}
                    <div className="xl:col-span-5 space-y-6 min-w-0">
                        <Card className="border-white/[0.06] bg-white/[0.02] overflow-hidden rounded-lg">
                            <div className="h-24 bg-gradient-to-r from-red-600/20 to-neutral-900" />
                            <CardContent className="relative px-6 pb-8">
                                <div className="-mt-12 flex justify-center sm:justify-start">
                                    <div className="w-24 h-24 rounded-xl bg-neutral-900 border-4 border-black flex items-center justify-center overflow-hidden shadow-2xl">
                                        {user.avatar ? (
                                            <Image src={user.avatar || "/images/user.png"} alt={user.name || "User"} width={96} height={96} className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-10 h-10 text-neutral-500" />
                                        )}
                                    </div>
                                </div>
                                <div className="mt-6 text-center sm:text-left min-w-0">
                                    <h2 className="text-2xl font-bold text-white mb-1 break-words">{user.name}</h2>
                                    <p className="text-neutral-500 text-sm mb-6 break-all">{user.email}</p>

                                    <div className="space-y-4">
                                        <ProfileInfo icon={Mail} label="Email Address" value={user.email} />
                                        <ProfileInfo icon={Phone} label="Phone Number" value={user.phone || "Not set"} />
                                        <ProfileInfo icon={MapPin} label="Location" value={user.address || "No address provided"} />
                                        <ProfileInfo icon={Calendar} label="Member Since" value={new Date(user.createdAt).toLocaleDateString()} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Stats Card */}
                        <div className="grid grid-cols-2 gap-4">
                            <StatBox icon={Gift} label="Joined" value={joinedGiveaway} color="text-red-500" />
                            <StatBox icon={Trophy} label="Wins" value={won} color="text-amber-500" />
                        </div>
                    </div>

                    {/* Right Column: Actions & Details */}
                    <div className="xl:col-span-7 space-y-8 min-w-0">
                        {/* Security Management */}
                        <Card className="border-white/[0.06] bg-white/[0.02] rounded-lg">
                            <CardHeader>
                                <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                                    <Lock className="w-5 h-5 text-red-500" />
                                    Security Management
                                </CardTitle>
                                <CardDescription className="text-neutral-500">
                                    Administratively reset user access credentials
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handlePasswordReset} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-neutral-500">Set new password</label>
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <Input
                                                type="password"
                                                placeholder="Enter secure password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="h-12 rounded-lg bg-white/[0.03] border-white/[0.08] text-white placeholder:text-neutral-600"
                                            />
                                            <Button
                                                type="submit"
                                                disabled={resetLoading}
                                                className="px-6 rounded-lg h-12 font-semibold whitespace-nowrap bg-red-600 text-white hover:bg-red-500 sm:min-w-[170px]"
                                            >
                                                {resetLoading ? <RefreshCw className="animate-spin" /> : "Reset Access"}
                                            </Button>
                                        </div>
                                        <p className="text-[10px] text-neutral-600 mt-2">
                                            * Minimum 6 characters. User will need to login with these new credentials immediately.
                                        </p>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Additional Info / Activity Placeholder */}
                        <Card className="border-white/[0.06] bg-white/[0.02] border-dashed opacity-60 rounded-lg">
                            <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-4">
                                    <Shield className="w-8 h-8 text-neutral-700" />
                                </div>
                                <h3 className="text-neutral-400 font-bold mb-1">User Activity Logs</h3>
                                <p className="text-neutral-600 text-sm max-w-xs">Detailed participation history and security logs will be available here in the next update.</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProfileInfo = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3 text-left">
        <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-neutral-500" />
        </div>
        <div className="overflow-hidden min-w-0">
            <p className="text-xs font-semibold text-neutral-500">{label}</p>
            <p className="text-neutral-300 text-sm break-words">{value}</p>
        </div>
    </div>
);

const StatBox = ({ icon: Icon, label, value, color }) => (
    <div className="border border-white/[0.06] bg-white/[0.02] p-5 rounded-lg flex flex-col items-center text-center hover:bg-white/[0.04] transition-all">
        <Icon className={`w-6 h-6 ${color} mb-3 group-hover:scale-110 transition-transform`} />
        <span className="text-2xl font-semibold text-white">{value}</span>
        <span className="text-xs font-semibold text-neutral-500 mt-1">{label}</span>
    </div>
);

export default withAdminAuth(UserProfilePage);
