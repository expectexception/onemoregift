"use client";
import Image from "next/image";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useEffect, useMemo, useState } from "react";
import api from "../utils/apiClient";
import { usePlatformStats } from "../hooks/usePlatformStats";

function TrophySvg({ className = "w-5 h-5" }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M7 4h10v2.3c0 2.8-2.2 5-5 5s-5-2.2-5-5V4Z" stroke="currentColor" strokeWidth="1.8" />
            <path d="M9.4 15.5h5.2M10.4 11.3v4.2M13.6 11.3v4.2M9.2 18.5h5.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M7 6H5.6a1.6 1.6 0 0 0 0 3.2H7M17 6h1.4a1.6 1.6 0 0 1 0 3.2H17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
    );
}

function GiftSvg({ className = "w-4 h-4" }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3.5" y="8.5" width="17" height="12" rx="2.2" stroke="currentColor" strokeWidth="1.8" />
            <path d="M12 8.5v12M3.5 12h17" stroke="currentColor" strokeWidth="1.8" />
            <path d="M8.4 6.2c.8 0 1.4.6 1.4 1.3H7c0-.7.6-1.3 1.4-1.3ZM15.6 6.2c-.8 0-1.4.6-1.4 1.3H17c0-.7-.6-1.3-1.4-1.3Z" stroke="currentColor" strokeWidth="1.5" />
        </svg>
    );
}

function getDisplayName(winner) {
    const fullName = String(winner?.fullName || "").trim();
    if (fullName) return fullName;

    const username = String(winner?.name || "").trim();
    if (!username) return "User";

    // Convert technical usernames to a readable fallback name.
    const cleaned = username
        .replace(/[._-]+/g, " ")
        .replace(/\d+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    if (!cleaned) return username;
    return cleaned
        .split(" ")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ");
}

function getInitials(name) {
    const parts = String(name || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (!parts.length) return "U";
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
}

export default function Winners() {
    const [giveaways, setGiveaways] = useState([]);
    const [loading, setLoading] = useState(true);
    const { stats } = usePlatformStats({ refreshMs: 30000 });
    const hidden = stats.statsHidden || {};
    const metricCount = ['completedGiveaways', 'giveawayWinners', 'verifiedDrawRate'].filter((k) => !hidden[k]).length;

    const fetchData = async () => {
        try {
            const { data } = await api.get("giveaway/winners/");
            setGiveaways(data.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const totalWinners = useMemo(() => giveaways.reduce((sum, g) => sum + (g.winners?.length || 0), 0), [giveaways]);

    // `giveaways` only holds draws that already have winners published, so it cannot
    // answer "how many giveaways have closed". That comes from the platform stats.
    const closedCount = Math.max(stats.completedGiveaways, giveaways.length);
    const declaredRate = closedCount > 0
        ? Math.round((giveaways.length / closedCount) * 100)
        : 100;

    return (
        <div className="min-h-screen flex flex-col bg-black">
            <div className="sticky top-0 z-50">
                <Navbar />
            </div>

            <section className="relative py-16 md:py-20 px-4 sm:px-6 overflow-hidden">
                <div className="absolute inset-0 section-gradient" />
                <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[760px] h-[260px] bg-red-600/12 blur-[110px]" />
                <div className="relative z-10 max-w-6xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/[0.08] mb-5">
                        <TrophySvg className="w-4 h-4 text-amber-300" />
                        <span className="text-neutral-300 text-xs uppercase tracking-wider">Winner Showcase</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold text-white">
                        Our <span className="text-gradient">Winners</span>
                    </h1>
                    <p className="text-neutral-400 mt-4 max-w-2xl mx-auto text-base md:text-lg">
                        Celebrating real winners and delivered prizes with transparent, structured results.
                    </p>
                    <div className={`mt-8 grid grid-cols-1 gap-3 max-w-3xl mx-auto ${metricCount === 3 ? "sm:grid-cols-3" : metricCount === 2 ? "sm:grid-cols-2" : "max-w-xs"}`}>
                        {!hidden.completedGiveaways && <Metric label="Giveaways Closed" value={closedCount} />}
                        {!hidden.giveawayWinners && <Metric label="Total Winners" value={Math.max(totalWinners, stats.giveawayWinners)} />}
                        {!hidden.verifiedDrawRate && <Metric label="Results Declared" value={`${declaredRate}%`} />}
                    </div>
                </div>
            </section>

            <section className="flex-1 py-10 px-4 sm:px-6">
                <div className="max-w-7xl mx-auto">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="premium-card rounded-2xl p-5 animate-pulse">
                                    <div className="h-40 bg-white/[0.04] rounded-xl mb-4" />
                                    <div className="h-6 bg-white/[0.04] rounded w-4/5 mb-3" />
                                    <div className="h-4 bg-white/[0.04] rounded w-2/3 mb-4" />
                                    <div className="h-20 bg-white/[0.04] rounded-xl" />
                                </div>
                            ))}
                        </div>
                    ) : giveaways.length ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5" data-testid="winners-grid">
                            {giveaways.map((giveaway, index) => (
                                <WinnerCard key={giveaway._id} giveaway={giveaway} delay={index * 0.05} />
                            ))}
                        </div>
                    ) : (
                        <div className="glass rounded-2xl p-14 text-center border border-white/[0.08]">
                            <div className="w-16 h-16 rounded-2xl bg-red-600/10 border border-red-500/20 mx-auto mb-5 flex items-center justify-center">
                                <TrophySvg className="w-8 h-8 text-red-400" />
                            </div>
                            <h3 className="text-2xl text-white font-semibold mb-2">No Winners Yet</h3>
                            <p className="text-neutral-500">Winners will appear here once giveaways are completed.</p>
                        </div>
                    )}
                </div>
            </section>

            <Footer />
        </div>
    );
}

function Metric({ label, value }) {
    return (
        <div className="premium-card rounded-xl px-4 py-3 border border-white/[0.08] bg-black/40">
            <p className="text-white text-lg font-bold">{value}</p>
            <p className="text-neutral-400 text-xs uppercase tracking-wide">{label}</p>
        </div>
    );
}

function WinnerCard({ giveaway, delay }) {
    return (
        <article className="premium-card rounded-2xl overflow-hidden border border-white/[0.08] bg-black/45 animate-fade-up" style={{ animationDelay: `${delay}s` }}>
            <div className="relative h-40 bg-black/60 border-b border-white/[0.06]">
                <Image
                    src={giveaway.image || "/images/gift.png"}
                    alt={giveaway.title || "Giveaway"}
                    fill
                    className="object-cover opacity-75"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute top-3 right-3 w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-lg">
                    <TrophySvg className="w-5 h-5" />
                </div>
                <div className="absolute left-4 bottom-4 right-4">
                    <h3 className="text-white text-xl font-bold leading-tight line-clamp-2">{giveaway.title}</h3>
                </div>
            </div>

            <div className="p-5 space-y-4">
                <p className="text-neutral-400 text-sm line-clamp-2">{giveaway.description}</p>

                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 flex items-center gap-2">
                    <GiftSvg className="w-4 h-4 text-red-400" />
                    <span className="text-white text-sm font-medium truncate">{giveaway.prize}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400 uppercase tracking-wide">Winners</span>
                    <span className="text-amber-300 font-semibold">{giveaway.winners?.length || 0}</span>
                </div>

                <div className="space-y-3" data-testid={`winners-list-${giveaway._id}`}>
                    {giveaway.winners?.map((winner, index) => (
                        (() => {
                            const displayName = getDisplayName(winner);
                            const username = String(winner?.name || "").trim();
                            const avatar = String(winner?.avatar || "").trim();

                            return (
                                <div
                                    key={`${winner._id || winner.name}-${index}`}
                                    className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5 sm:p-4 flex items-center gap-3 sm:gap-4"
                                    data-testid="winner-item"
                                >
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-neutral-800 border border-white/[0.10] flex-shrink-0 shadow-[0_0_0_3px_rgba(255,255,255,0.02)]">
                                        {avatar ? (
                                            <Image src={avatar} alt={displayName} width={56} height={56} className="w-full h-full object-cover" unoptimized />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-700 text-white text-sm sm:text-base font-bold flex items-center justify-center">
                                                {getInitials(displayName)}
                                            </div>
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="text-white text-base sm:text-lg font-semibold leading-tight truncate" data-testid="winner-name" title={displayName}>
                                            {displayName}
                                        </p>
                                        {username ? (
                                            <p className="text-neutral-400 text-xs sm:text-sm truncate mt-0.5" title={`@${username}`}>
                                                @{username}
                                            </p>
                                        ) : null}
                                    </div>
                                </div>
                            );
                        })()
                    ))}
                </div>
            </div>
        </article>
    );
}

