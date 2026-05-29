"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Database, Trash2, RotateCcw, AlertTriangle, RefreshCw, Lock, Shield, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import api from "@/app/utils/apiClient";
import withAdminAuth from "../../../components/withAdminAuth";

function AdminSettings() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const handleClearAll = async () => {
        if (!confirm("CRITICAL: This will clear ALL participations system-wide. Are you absolutely sure?")) return;

        setLoading(true);
        try {
            const { data } = await api.post("admin/maintenance/clear-all", {}, { meta: { auth: "admin" } });
            if (!data.error) {
                toast({
                    title: "System Reset Successful",
                    description: "All entries have been cleared.",
                });
            } else {
                toast({ title: "Error", description: data.msg, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Failed", description: "Maintenance action failed.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#070707]">
            <div className="p-4 md:p-8 max-w-7xl mx-auto">
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-14 h-14 rounded-lg bg-red-600 flex items-center justify-center">
                        <Database className="text-white w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-4xl font-bold text-white tracking-tight">System Settings</h1>
                        <p className="text-neutral-500 font-medium">Platform maintenance and safety controls</p>
                    </div>
                </div>

                <div className="h-px bg-white/[0.06] mb-10" />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
                    {/* Data Maintenance Card */}
                    <Card className="border-white/[0.06] bg-white/[0.02] overflow-hidden rounded-lg">
                        <div className="absolute top-0 left-0 w-1 h-full bg-red-600 opacity-60 transition-opacity" />
                        <CardHeader className="p-8 pb-4">
                            <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-red-600/10 flex items-center justify-center">
                                    <RotateCcw className="w-5 h-5 text-red-500" />
                                </div>
                                Maintenance Mode
                            </CardTitle>
                            <CardDescription className="text-neutral-500 text-sm mt-2 leading-relaxed">
                                Irreversibly clear all participation records across the platform. Use this carefully for system resets or new season preparation.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 pt-4 space-y-8">
                            <div className="p-5 rounded-2xl bg-red-600/5 border border-red-600/10 flex gap-4">
                                <AlertTriangle className="text-red-500 w-6 h-6 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <strong className="text-red-500 text-sm font-semibold block">Caution: destructive action</strong>
                                    <p className="text-sm text-neutral-400 leading-relaxed font-medium">
                                        This action will wipe all <code className="text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">JoinedGiveaway</code> collections and reset
                                        participant lists in all events.
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="destructive"
                                className="w-full h-12 rounded-lg font-semibold text-base active:scale-[0.98] transition-all group/btn"
                                onClick={handleClearAll}
                                disabled={loading}
                            >
                                {loading ? (
                                    <RefreshCw className="animate-spin mr-3" />
                                ) : (
                                    <Trash2 className="mr-3 w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                                )}
                                Purge All Participation Data
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Security Management Card */}
                    <SecurityCard />
                </div>

                <div className="mt-20 py-8 border-t border-white/[0.06] text-center">
                    <p className="text-xs text-neutral-600 font-medium">
                        OneMoreGift admin controls for {new Date().getFullYear()}
                    </p>
                </div>
            </div>
        </div>
    );
}

function SecurityCard() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!currentPassword || !newPassword) return;

        setLoading(true);
        try {
            const { data } = await api.patch("admin/change-password", {
                currentPassword,
                newPassword
            }, { meta: { auth: "admin" } });

            if (!data.error) {
                toast({
                    title: "Security Updated",
                    description: (
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>Your administrative password has been changed.</span>
                        </div>
                    )
                });
                setCurrentPassword("");
                setNewPassword("");
            } else {
                toast({ title: "Update Failed", description: data.msg, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Request failed.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Card className="border-white/[0.06] bg-white/[0.02] overflow-hidden rounded-lg">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-600 opacity-60 transition-opacity" />
            <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600/10 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-emerald-500" />
                    </div>
                    Security & Access
                </CardTitle>
                <CardDescription className="text-neutral-500 text-sm mt-2 leading-relaxed">
                    Update your administrative credentials. Ensure you use a strong password to maintain platform security.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4">
                <form onSubmit={handleUpdate} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-neutral-500 pl-1">Current password</label>
                        <Input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="h-12 rounded-lg bg-white/[0.03] border-white/[0.08] text-white"
                        />
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-neutral-500 pl-1">New secure password</label>
                            <Input
                                type="password"
                                required
                                placeholder="Min 6 characters"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="h-12 rounded-lg bg-white/[0.03] border-white/[0.08] text-white"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={loading || !currentPassword || !newPassword}
                            className="w-full h-12 rounded-lg bg-white text-black hover:bg-neutral-200 font-semibold transition-all active:scale-[0.98]"
                        >
                            {loading ? <RefreshCw className="animate-spin" /> : "Update Credentials"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

export default withAdminAuth(AdminSettings);
