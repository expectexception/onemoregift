"use client";
import { useState, useEffect, useCallback } from "react";
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
            const message = error?.response?.data?.msg || "Maintenance action failed.";
            toast({ title: "Failed", description: message, variant: "destructive" });
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

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mt-4">
                    {/* Dynamic visibility settings */}
                    <VisibilitySettingsCard />

                    {/* Database status and metrics */}
                    <DbStatusCard />

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

function VisibilitySettingsCard() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [showUpcoming, setShowUpcoming] = useState(true);
    const [showEnded, setShowEnded] = useState(false);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const { data } = await api.get("admin/config", { meta: { auth: "admin" } });
                if (!data.error && data.config) {
                    setShowUpcoming(!!data.config.showUpcoming);
                    setShowEnded(!!data.config.showEnded);
                }
            } catch (error) {
                console.error("Failed to fetch config", error);
            } finally {
                setFetching(false);
            }
        };
        fetchConfig();
    }, []);


    const handleSave = async () => {
        setLoading(true);
        try {
            const { data } = await api.post("admin/config", {
                showUpcoming,
                showEnded
            }, { meta: { auth: "admin" } });

            if (!data.error) {
                toast({
                    title: "Settings Updated",
                    description: (
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>Giveaway visibility settings updated.</span>
                        </div>
                    )
                });
            } else {
                toast({ title: "Failed", description: data.msg, variant: "destructive" });
            }
        } catch (error) {
            const message = error?.response?.data?.msg || "Request failed.";
            toast({ title: "Error", description: message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="border-white/[0.06] bg-white/[0.02] overflow-hidden rounded-lg">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 opacity-60 transition-opacity" />
            <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center">
                        <Database className="w-5 h-5 text-blue-500" />
                    </div>
                    Visibility Controls
                </CardTitle>
                <CardDescription className="text-neutral-500 text-sm mt-2 leading-relaxed">
                    Set whether users can view upcoming or ended giveaways. Toggling these also dynamically updates homepage statistics.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-6">
                {fetching ? (
                    <div className="text-neutral-500 text-sm animate-pulse">Loading configurations...</div>
                ) : (
                    <>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                                <div>
                                    <div className="text-sm font-semibold text-white">Upcoming Giveaways</div>
                                    <div className="text-xs text-neutral-500 mt-0.5">Allow users to browse upcoming events</div>
                                </div>
                                <button
                                    onClick={() => setShowUpcoming(!showUpcoming)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                                        showUpcoming ? "bg-red-600" : "bg-neutral-800"
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            showUpcoming ? "translate-x-6" : "translate-x-1"
                                        }`}
                                    />
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                                <div>
                                    <div className="text-sm font-semibold text-white">Ended Giveaways</div>
                                    <div className="text-xs text-neutral-500 mt-0.5">Include ended events in public lists and combine statistics</div>
                                </div>
                                <button
                                    onClick={() => setShowEnded(!showEnded)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                                        showEnded ? "bg-red-600" : "bg-neutral-800"
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            showEnded ? "translate-x-6" : "translate-x-1"
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>

                        <Button
                            onClick={handleSave}
                            disabled={loading}
                            className="w-full h-12 rounded-lg bg-white text-black hover:bg-neutral-200 font-semibold transition-all active:scale-[0.98]"
                        >
                            {loading ? <RefreshCw className="animate-spin" /> : "Save Changes"}
                        </Button>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

function DbStatusCard() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);

    const fetchDbStatus = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get("admin/maintenance/db-status", { meta: { auth: "admin" } });
            if (!data.error && data.stats) {
                setStats(data.stats);
            }
        } catch (error) {
            console.error("Failed to fetch DB status", error);
            toast({ title: "Error", description: "Failed to fetch database status", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchDbStatus();
    }, [fetchDbStatus]);

    return (
        <Card className="border-white/[0.06] bg-white/[0.02] overflow-hidden rounded-lg relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600 opacity-60 transition-opacity" />
            <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl font-bold text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600/10 flex items-center justify-center">
                            <Database className="w-5 h-5 text-indigo-500" />
                        </div>
                        Database Status
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={fetchDbStatus}
                        disabled={loading}
                        className="text-neutral-400 hover:text-white hover:bg-white/5 h-8 w-8 rounded-lg"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                </CardTitle>
                <CardDescription className="text-neutral-500 text-sm mt-2 leading-relaxed">
                    Real-time counts of models and documents stored in the database.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-4">
                {loading && !stats ? (
                    <div className="text-neutral-500 text-sm animate-pulse">Loading database metrics...</div>
                ) : stats ? (
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: "Total Users", value: stats.users },
                            { label: "Total Giveaways", value: stats.giveaways },
                            { label: "Total Entries", value: stats.entries },
                            { label: "Banned Users", value: stats.bannedUsers },
                            { label: "Administrators", value: stats.admins },
                        ].map(({ label, value }) => (
                            <div key={label} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                                <div className="text-xs text-neutral-500 font-bold uppercase tracking-wider">{label}</div>
                                <div className="text-2xl font-extrabold text-white mt-1">{value}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-red-400 text-sm">Failed to load statistics.</div>
                )}
            </CardContent>
        </Card>
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
        if (newPassword.length < 6) {
            toast({ title: "Invalid Password", description: "New password must be at least 6 characters.", variant: "destructive" });
            return;
        }

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
            const message = error?.response?.data?.msg || "Request failed.";
            toast({ title: "Error", description: message, variant: "destructive" });
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
