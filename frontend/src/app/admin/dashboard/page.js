"use client";

import {
    Activity,
    ArrowRight,
    BarChart3,
    Chrome,
    Database,
    Gift,
    LogOut,
    ShieldOff,
    TrendingUp,
    UserCheck,
    Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { useEffect, useMemo, useState } from "react";
import withAdminAuth from "../../components/withAdminAuth";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import api from "@/app/utils/apiClient";

function DashboardPage() {
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { logoutAdmin } = useAuth();

    useEffect(() => {
        let mounted = true;

        async function getData() {
            try {
                setLoading(true);
                const { data } = await api.get("admin/", {
                    meta: { auth: "admin" },
                });
                if (mounted) setData(data);
            } catch (error) {
                console.error("Dashboard data fetch failed:", error);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        getData();
        return () => {
            mounted = false;
        };
    }, []);

    const metrics = useMemo(() => {
        const totalUsers = data.users ?? 0;
        const blockedUsers = data.blockedUsers ?? 0;
        const activeUsers = Math.max(totalUsers - blockedUsers, 0);
        return {
            activeUsers,
            blockRate: totalUsers > 0 ? ((blockedUsers / totalUsers) * 100).toFixed(1) : "0",
            googleAuthRate: totalUsers > 0 ? (((data.googleUsers ?? 0) / totalUsers) * 100).toFixed(1) : "0",
            activePercent: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 100,
        };
    }, [data]);

    const statCards = [
        { label: "Total Users", value: data.users, detail: "Registered accounts", icon: Users, tone: "text-sky-300 bg-sky-500/10 border-sky-400/20" },
        { label: "Giveaways", value: data.giveaways, detail: "Created campaigns", icon: Gift, tone: "text-violet-300 bg-violet-500/10 border-violet-400/20" },
        { label: "Blocked Users", value: data.blockedUsers, detail: "Restricted accounts", icon: ShieldOff, tone: "text-rose-300 bg-rose-500/10 border-rose-400/20" },
        { label: "Google Auth", value: data.googleUsers, detail: "External sign-ins", icon: Chrome, tone: "text-amber-300 bg-amber-500/10 border-amber-400/20" },
        { label: "7 Day Growth", value: data.recentUsers, detail: "New users", icon: TrendingUp, tone: "text-emerald-300 bg-emerald-500/10 border-emerald-400/20" },
    ];

    const quickLinks = [
        { label: "Users", detail: "Review accounts and access", href: "/admin/dashboard/users", icon: Users },
        { label: "Giveaways", detail: "Manage active campaigns", href: "/admin/dashboard/giveaways", icon: Gift },
        { label: "Winners", detail: "Review winner selections", href: "/admin/dashboard/winners", icon: UserCheck },
        { label: "Add Giveaway", detail: "Create a new campaign", href: "/admin/dashboard/add", icon: TrendingUp },
        { label: "Settings", detail: "Platform configuration", href: "/admin/dashboard/settings", icon: Database },
    ];

    return (
        <div className="min-h-screen bg-[#070707] text-white">
            <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 xl:px-10">
                <header className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10">
                            <Activity className="h-6 w-6 text-red-300" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
                                Admin Dashboard
                            </h1>
                            <p className="mt-1 text-sm text-neutral-400">
                                Platform overview for {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={async () => {
                            await logoutAdmin();
                            router.push("/admin/");
                        }}
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-4 text-sm font-medium text-neutral-200 transition-colors hover:border-red-400/40 hover:bg-red-500/10 hover:text-white md:w-auto"
                    >
                        <LogOut className="h-4 w-4" />
                        Logout
                    </button>
                </header>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    {statCards.map(({ label, value, detail, icon: Icon, tone }) => (
                        <Card key={label} className="rounded-lg border-white/10 bg-[#111111] shadow-none">
                            <CardHeader className="flex flex-row items-start justify-between gap-3 p-5 pb-3">
                                <div>
                                    <CardTitle className="text-sm font-medium text-neutral-400">{label}</CardTitle>
                                    <p className="mt-1 text-xs text-neutral-500">{detail}</p>
                                </div>
                                <div className={`flex h-10 w-10 items-center justify-center rounded-md border ${tone}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                            </CardHeader>
                            <CardContent className="p-5 pt-0">
                                {loading ? (
                                    <div className="h-9 w-20 animate-pulse rounded-md bg-white/10" />
                                ) : (
                                    <div className="text-3xl font-semibold tabular-nums text-white">{value ?? 0}</div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </section>

                <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
                                <p className="text-sm text-neutral-500">Common admin workflows</p>
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                            {quickLinks.map(({ label, detail, href, icon: Icon }) => (
                                <button
                                    key={label}
                                    onClick={() => router.push(href)}
                                    className="flex min-h-[88px] items-center justify-between gap-4 rounded-lg border border-white/10 bg-[#111111] p-4 text-left transition-colors hover:border-white/20 hover:bg-[#171717]"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-neutral-300">
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-white">{label}</p>
                                            <p className="mt-1 line-clamp-2 text-xs text-neutral-500">{detail}</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="h-4 w-4 shrink-0 text-neutral-500" />
                                </button>
                            ))}
                        </div>
                    </div>

                    <aside className="space-y-4">
                        <Card className="rounded-lg border-white/10 bg-[#111111] shadow-none">
                            <CardHeader className="p-5 pb-3">
                                <CardTitle className="flex items-center gap-2 text-base font-semibold text-white">
                                    <BarChart3 className="h-4 w-4 text-emerald-300" />
                                    Account Health
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-5 p-5 pt-0">
                                <div>
                                    <div className="mb-2 flex items-center justify-between text-sm">
                                        <span className="text-neutral-400">Active users</span>
                                        <span className="font-medium text-white">{loading ? "..." : `${metrics.activeUsers} active`}</span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                                        <div
                                            className="h-full rounded-full bg-emerald-400 transition-all"
                                            style={{ width: `${loading ? 0 : metrics.activePercent}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-md border border-white/10 bg-black/20 p-3">
                                        <p className="text-xs text-neutral-500">Block Rate</p>
                                        <p className="mt-1 text-xl font-semibold text-rose-300">{loading ? "..." : `${metrics.blockRate}%`}</p>
                                    </div>
                                    <div className="rounded-md border border-white/10 bg-black/20 p-3">
                                        <p className="text-xs text-neutral-500">Google Auth</p>
                                        <p className="mt-1 text-xl font-semibold text-amber-300">{loading ? "..." : `${metrics.googleAuthRate}%`}</p>
                                    </div>
                                </div>

                                <div className="rounded-md border border-white/10 bg-black/20 p-3">
                                    <p className="text-xs text-neutral-500">Participation, last 7 days</p>
                                    <p className="mt-1 flex items-center gap-2 text-sm font-medium text-emerald-300">
                                        <TrendingUp className="h-4 w-4" />
                                        +{data.recentParticipations ?? 0} joins
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-lg border-white/10 bg-[#111111] shadow-none">
                            <CardHeader className="p-5 pb-3">
                                <CardTitle className="text-base font-semibold text-white">Top Giveaways</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 p-5 pt-0">
                                {loading ? (
                                    [1, 2, 3].map((item) => <div key={item} className="h-11 animate-pulse rounded-md bg-white/10" />)
                                ) : data.topGiveaways?.length > 0 ? (
                                    data.topGiveaways.map((giveaway, index) => (
                                        <button
                                            key={giveaway._id}
                                            onClick={() => router.push(`/admin/dashboard/giveaways/${giveaway._id}`)}
                                            className="flex w-full items-center justify-between gap-3 rounded-md border border-white/10 bg-black/20 px-3 py-2 text-left hover:bg-white/[0.04]"
                                        >
                                            <span className="min-w-0 truncate text-sm text-neutral-200">
                                                {index + 1}. {giveaway.title}
                                            </span>
                                            <span className="shrink-0 rounded bg-sky-500/10 px-2 py-1 text-xs font-medium text-sky-300">
                                                {giveaway.participantCount} joins
                                            </span>
                                        </button>
                                    ))
                                ) : (
                                    <p className="text-sm text-neutral-500">No giveaway activity yet.</p>
                                )}
                            </CardContent>
                        </Card>
                    </aside>
                </section>
            </div>
        </div>
    );
}

export default withAdminAuth(DashboardPage);
