// pages/dashboard.js
"use client"
import {
    Gift,
    LogOut,
    Users,
    ShieldOff,
    Chrome,
    UserCheck,
    TrendingUp,
    ChevronRight,
    Database,
    Activity,
    ShieldCheck,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../../../components/ui/card"
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import withAdminAuth from "../../components/withAdminAuth"
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import api from "@/app/utils/apiClient";

function DashboardPage() {
    let [data, setData] = useState({});
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { logoutAdmin } = useAuth();
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

    let getData = async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`admin/`, {
                meta: { auth: "admin" },
            });
            setData(data);
        } catch (error) {
            console.error("Dashboard data fetch failed:", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        getData()
    }, [])

    const StatCard = ({ icon: Icon, label, value, color, subtext, gradient }) => (
        <Card className="relative overflow-hidden border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-500 group">
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-[0.05] transition-opacity duration-500`} />
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/[0.02] rounded-full blur-2xl group-hover:bg-white/[0.05] transition-colors duration-500" />

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.15em]">{label}</CardTitle>
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shadow-lg shadow-black/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
            </CardHeader>
            <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-white mb-1 tracking-tight group-hover:text-gradient transition-all duration-300">
                    {loading ? (
                        <div className="h-9 w-20 bg-white/[0.06] rounded-lg animate-pulse" />
                    ) : (
                        value ?? 0
                    )}
                </div>
                {subtext && <p className="text-[11px] text-neutral-500 font-medium flex items-center gap-1.5 font-mono">
                    <span className="w-1 h-1 rounded-full bg-emerald-500/50" />
                    {subtext}
                </p>}
            </CardContent>
        </Card>
    );

    const QuickLink = ({ label, href, icon: Icon, delay }) => (
        <button
            onClick={() => router.push(href)}
            style={{ animationDelay: delay }}
            className="flex items-center justify-between w-full p-4 rounded-2xl border border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/[0.12] hover:shadow-2xl hover:shadow-black transition-all duration-300 group animate-fade-in relative overflow-hidden"
        >
            <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-red-600/[0.02] to-red-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

            <div className="flex items-center gap-4 relative z-10">
                <div className="w-11 h-11 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center group-hover:bg-red-600 group-hover:border-red-500 transition-all duration-300 shadow-inner">
                    <Icon className="w-5 h-5 text-neutral-400 group-hover:text-white group-hover:scale-110 transition-all" />
                </div>
                <div className="flex flex-col items-start px-1">
                    <span className="text-sm text-neutral-300 font-bold group-hover:text-white transition-colors tracking-wide underline-offset-4 group-hover:underline decoration-red-500/30">{label}</span>
                    <span className="text-[10px] text-neutral-600 uppercase tracking-tighter group-hover:text-neutral-400 transition-colors">Action Required</span>
                </div>
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.03] border border-white/[0.06] group-hover:bg-white/[0.08] group-hover:border-white/[0.12] transition-all relative z-10">
                <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-red-400 group-hover:translate-x-0.5 transition-all" />
            </div>
        </button>
    );

    const activeUsers = (data.users ?? 0) - (data.blockedUsers ?? 0);
    const blockRate = data.users > 0 ? ((data.blockedUsers / data.users) * 100).toFixed(1) : "0";
    const googleAuthRate = data.users > 0 ? ((data.googleUsers / data.users) * 100).toFixed(1) : "0";

    return (
        <div ref={containerRef} className="flex flex-col min-h-screen bg-black relative overflow-hidden cursor-glow-container">
            {/* Background elements */}
            <div className="absolute inset-0 section-gradient opacity-40 pointer-events-none" />
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/5 rounded-full blur-[120px] pointer-events-none animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />

            <div className="flex-col space-y-8 p-6 md:p-10 relative z-10 overflow-y-auto max-h-screen">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-slide-down">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-xl shadow-red-900/20 border border-red-500/20">
                            <ShieldCheck className="text-white w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-white uppercase italic">
                                Admin <span className="text-gradient">Control</span>
                            </h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest">
                                    System Online • {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={async () => {
                            await logoutAdmin();
                            router.push('/admin/');
                        }}
                        className="self-start md:self-center flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-red-600/10 hover:border-red-600/40 transition-all duration-300 text-neutral-400 hover:text-red-400 font-bold text-xs uppercase tracking-widest group"
                    >
                        <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span>Terminate Session</span>
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <div className="flex items-center gap-3 mb-6">
                        <Activity className="w-4 h-4 text-red-500" />
                        <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em]">
                            Global Telemetry
                        </h3>
                        <div className="flex-1 h-px bg-white/[0.06]" />
                    </div>
                    <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                        <StatCard
                            icon={Users}
                            label="Total Users"
                            value={data.users}
                            color="bg-blue-600"
                            gradient="from-blue-600/30 to-cyan-600/10"
                            subtext="Live Directory"
                        />
                        <StatCard
                            icon={Gift}
                            label="Giveaways"
                            value={data.giveaways}
                            color="bg-purple-600"
                            gradient="from-purple-600/30 to-pink-600/10"
                            subtext="Active Pools"
                        />
                        <StatCard
                            icon={ShieldOff}
                            label="Blocked"
                            value={data.blockedUsers}
                            color="bg-red-600"
                            gradient="from-red-600/30 to-orange-600/10"
                            subtext="Restricted Area"
                        />
                        <StatCard
                            icon={Chrome}
                            label="Google Auth"
                            value={data.googleUsers}
                            color="bg-amber-600"
                            gradient="from-amber-600/30 to-yellow-600/10"
                            subtext="Externally Verified"
                        />
                        <StatCard
                            icon={TrendingUp}
                            label="7D Growth"
                            value={data.recentUsers}
                            color="bg-emerald-600"
                            gradient="from-emerald-600/30 to-teal-600/10"
                            subtext="New Arrivals"
                        />
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="grid gap-8 lg:grid-cols-12 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    {/* Navigation Container */}
                    <div className="lg:col-span-12 xl:col-span-8 space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Database className="w-4 h-4 text-red-500" />
                            <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em]">
                                Command Center
                            </h3>
                            <div className="flex-1 h-px bg-white/[0.06]" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <QuickLink label="User Directory" href="/admin/dashboard/users" icon={Users} delay="0.1s" />
                            <QuickLink label="Giveaway Engine" href="/admin/dashboard/giveaways" icon={Gift} delay="0.2s" />
                            <QuickLink label="Winner Selection" href="/admin/dashboard/winners" icon={UserCheck} delay="0.3s" />
                            <QuickLink label="Draft Giveaway" href="/admin/dashboard/add" icon={TrendingUp} delay="0.4s" />
                            <QuickLink label="Global Config" href="/admin/dashboard/settings" icon={Database} delay="0.5s" />
                        </div>
                    </div>

                    {/* Analytics & Performance */}
                    <div className="lg:col-span-12 xl:col-span-4 space-y-6 flex flex-col">
                        <div className="flex items-center gap-3 mb-2">
                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                            <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em]">
                                Analytics Hub
                            </h3>
                            <div className="flex-1 h-px bg-white/[0.06]" />
                        </div>

                        <div className="flex-1 space-y-4">
                            {/* Platform Health */}
                            <div className="premium-card rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5 space-y-5 hover:bg-white/[0.02] transition-colors duration-500">
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-extrabold text-neutral-500 uppercase tracking-tighter">Engagement Velocity</span>
                                            <span className="text-xs font-black text-white">{loading ? "—" : activeUsers} Active</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/[0.04] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                                style={{ width: `${loading ? 0 : data.users > 0 ? ((activeUsers / data.users) * 100) : 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] flex flex-col gap-0.5">
                                            <span className="text-[8px] font-bold text-neutral-600 uppercase">Block Ratio</span>
                                            <span className="text-md font-black text-red-500">{loading ? "—" : `${blockRate}%`}</span>
                                        </div>
                                        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] flex flex-col gap-0.5">
                                            <span className="text-[8px] font-bold text-neutral-600 uppercase">Mesh Auth</span>
                                            <span className="text-md font-black text-amber-500">{loading ? "—" : `${googleAuthRate}%`}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
                                    <div>
                                        <span className="text-[8px] font-bold text-neutral-600 uppercase block mb-0.5">Entry Activity</span>
                                        <span className="text-xs font-black text-emerald-400 flex items-center gap-1">
                                            <TrendingUp className="w-3 h-3" />
                                            +{data.recentParticipations ?? 0} Joins (7D)
                                        </span>
                                    </div>
                                    <div className="w-10 h-10 rounded-full border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                                    </div>
                                </div>
                            </div>

                            {/* Top Performing Events */}
                            <div className="premium-card rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5 hover:bg-white/[0.02] transition-colors duration-500">
                                <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-4">Top Performing Contests</h4>
                                <div className="space-y-3">
                                    {loading ? (
                                        [1, 2, 3].map(i => <div key={i} className="h-10 w-full bg-white/[0.03] rounded-xl animate-pulse" />)
                                    ) : (
                                        data.topGiveaways?.length > 0 ? (
                                            data.topGiveaways.map((g, idx) => (
                                                <div
                                                    key={g._id}
                                                    onClick={() => router.push(`/admin/dashboard/giveaways/${g._id}`)}
                                                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] hover:border-white/[0.1] transition-all cursor-pointer group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-black text-neutral-700">#{idx + 1}</span>
                                                        <span className="text-xs font-bold text-neutral-300 group-hover:text-white truncate max-w-[120px]">{g.title}</span>
                                                    </div>
                                                    <span className="text-[10px] font-black bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">
                                                        {g.participantCount} Joins
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-[10px] text-neutral-600 italic">No entry data synced yet</p>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
export default withAdminAuth(DashboardPage);
