"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, MessageCircle, Sparkles, ArrowRight } from "lucide-react";
import api, { mediaUrl } from "../utils/apiClient";
import RevealOnScroll from "./RevealOnScroll";

export default function PopularMoments() {
    const router = useRouter();
    const [moments, setMoments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const fetchMoments = async () => {
            try {
                const { data } = await api.get("happy-moment/gallery", { params: { limit: 24 } });
                if (!cancelled && !data.error && Array.isArray(data.data)) {
                    const sorted = [...data.data]
                        .sort((a, b) => {
                            // Featured first, then by reactions, then recency
                            if (!!b.isFeatured !== !!a.isFeatured) return b.isFeatured ? 1 : -1;
                            const r = (b.reactions?.length || 0) - (a.reactions?.length || 0);
                            if (r !== 0) return r;
                            return new Date(b.createdAt) - new Date(a.createdAt);
                        })
                        .filter((m) => m.media && m.media.length > 0)
                        .slice(0, 6);
                    setMoments(sorted);
                }
            } catch {
                // Silent — section just won't render if it fails
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchMoments();
        return () => { cancelled = true; };
    }, []);

    // Don't render the section at all if there's nothing to show
    if (!loading && moments.length === 0) return null;

    return (
        <section className="relative bg-black py-20 sm:py-28 overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/[0.04] rounded-full blur-[160px] pointer-events-none" />

            <div className="relative max-w-6xl mx-auto px-6">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
                    <div>
                        <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase text-amber-400/80 mb-3">
                            <Sparkles className="w-4 h-4" /> Happy Moments
                        </span>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
                            Moments Our <span className="text-gradient">Winners Shared</span>
                        </h2>
                        <p className="text-neutral-400 mt-3 max-w-xl text-sm sm:text-base">
                            Real smiles from real people who received their gifts.
                        </p>
                    </div>
                    <button
                        onClick={() => router.push("/surprise-me")}
                        className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors group whitespace-nowrap"
                    >
                        View gallery
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                            <div key={n} className="aspect-[4/5] rounded-2xl bg-white/[0.03] border border-white/[0.05] animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                        {moments.map((m, i) => (
                            <RevealOnScroll key={m._id} delayMs={i * 80}>
                                <MomentCard moment={m} onClick={() => router.push("/surprise-me")} />
                            </RevealOnScroll>
                        ))}
                    </div>
                )}

                <div className="mt-10 text-center sm:hidden">
                    <button
                        onClick={() => router.push("/surprise-me")}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors"
                    >
                        View full gallery <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </section>
    );
}

function MomentCard({ moment, onClick }) {
    const [broken, setBroken] = useState(false);
    const media = moment.media?.[0];
    const isVideo = media?.type === "video";
    const src = isVideo ? media?.thumbnail : media?.url;

    return (
        <button
            onClick={onClick}
            className="group relative aspect-[4/5] w-full rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.02] text-left hover:border-amber-500/30 transition-all duration-300"
        >
            {src && !broken ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={mediaUrl(src)}
                    alt={moment.caption || "Happy moment"}
                    onError={() => setBroken(true)}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900">
                    <Sparkles className="w-10 h-10 text-amber-500/40" />
                </div>
            )}

            {isVideo && (
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
                </div>
            )}

            {moment.isFeatured && (
                <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500 text-black text-[10px] font-bold tracking-wide">
                    <Sparkles className="w-3 h-3" /> Featured
                </span>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-6 h-6 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0 overflow-hidden">
                        {moment.userId?.profilePic ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={mediaUrl(moment.userId.profilePic)} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-[10px] font-bold text-neutral-300">{(moment.userId?.name || "U")[0]}</span>
                        )}
                    </div>
                    <span className="text-xs font-semibold text-white truncate">{moment.userId?.name || "User"}</span>
                </div>
                <p className="text-xs sm:text-sm text-neutral-200 font-medium line-clamp-2 mb-2">{moment.caption}</p>
                <div className="flex items-center gap-4 text-[11px] text-neutral-300">
                    <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-red-400" /> {moment.reactions?.length || 0}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> {moment.comments?.length || 0}</span>
                </div>
            </div>
        </button>
    );
}
