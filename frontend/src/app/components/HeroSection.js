"use client"
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { HiSparkles, HiGift, HiUsers, HiStar, HiChevronLeft, HiChevronRight } from "react-icons/hi";
import api from "../utils/apiClient";

const heroImages = [
    "/images/giftsa.webp",
    "/images/gifts.jpg",
    "/images/gift-1.png",
    "/images/gift-2.png",
    "/images/gift-3.png",
    "/images/gift-4.png",
    "/images/gift-5.png",
    "/images/gift-6.png",
    "/images/gift-7.png",
    "/images/gift-8.png",
];

export default function HeroSection() {
    const router = useRouter();
    const sectionRef = useRef(null);
    const cursorRef = useRef(null);
    const [currentImage, setCurrentImage] = useState(0);
    const [stats, setStats] = useState({
        activeGiveaways: "50+",
        totalWinners: "10K+",
        totalPrizeValue: "₹5L+",
        verifiedLegit: "100%"
    });

    // Auto-change background images
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImage((prev) => (prev + 1) % heroImages.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Fetch live stats
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get('admin/stats');
                if (!data.error) {
                    setStats({
                        activeGiveaways: `${data.activeGiveaways}+`,
                        totalWinners: data.totalWinners > 1000 ? `${(data.totalWinners / 1000).toFixed(1)}K+` : `${data.totalWinners}+`,
                        totalPrizeValue: `₹${data.totalPrizeValue > 100000 ? (data.totalPrizeValue / 100000).toFixed(1) + 'L' : data.totalPrizeValue}+`,
                        verifiedLegit: "100%"
                    });
                }
            } catch (error) {
                console.error("Hero stats error:", error);
            }
        };
        fetchStats();
    }, []);

    // Cursor glow effect
    const handleMouseMove = useCallback((e) => {
        if (!cursorRef.current || !sectionRef.current || window.innerWidth < 768) return;
        const rect = sectionRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        cursorRef.current.style.opacity = "1";
        cursorRef.current.style.transform = `translate(${x - 200}px, ${y - 200}px)`;
    }, []);

    const handleMouseLeave = useCallback(() => {
        if (cursorRef.current) {
            cursorRef.current.style.opacity = "0";
        }
    }, []);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;
        section.addEventListener("mousemove", handleMouseMove);
        section.addEventListener("mouseleave", handleMouseLeave);
        return () => {
            section.removeEventListener("mousemove", handleMouseMove);
            section.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, [handleMouseMove, handleMouseLeave]);

    return (
        <section ref={sectionRef} className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
            {/* Background base */}
            <div className="absolute inset-0 bg-black" />

            {/* Two-layer crossfade background images */}
            {heroImages.map((img, i) => (
                <div
                    key={img}
                    className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
                    style={{
                        opacity: i === currentImage ? 0.5 : 0,
                        willChange: 'opacity',
                    }}
                >
                    <img
                        src={img}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover object-center"
                        loading={i === 0 ? "eager" : "lazy"}
                    />
                </div>
            ))}

            {/* Dark overlays for readability - adjusted for increased image opacity */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-black/70" />

            {/* Subtle red accent glows */}
            <div className="absolute top-20 left-[10%] w-72 h-72 bg-red-600/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-20 right-[10%] w-96 h-96 bg-red-700/8 rounded-full blur-[140px]" />

            {/* Grid pattern */}
            <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)`,
                    backgroundSize: '80px 80px'
                }}
            />

            {/* Cursor glow */}
            <div
                ref={cursorRef}
                className="absolute top-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none opacity-0 transition-opacity duration-300 will-change-transform z-[5]"
                style={{
                    background: 'radial-gradient(circle, rgba(220,38,38,0.15) 0%, rgba(220,38,38,0.05) 40%, transparent 70%)',
                }}
            />

            {/* Image indicator dots - Hidden on mobile to avoid overlap */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 hidden md:flex gap-2">
                {heroImages.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrentImage(i)}
                        className={`h-2 rounded-full transition-all duration-500 ${i === currentImage
                            ? "bg-red-500 w-6"
                            : "w-2 bg-white/30 hover:bg-white/50"
                            }`}
                    />
                ))}
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full glass mb-6 sm:mb-8 animate-fade-up border border-white/[0.12]">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-neutral-200 text-[10px] sm:text-xs md:text-sm font-medium tracking-wide">India&apos;s Leading Giveaway Platform</span>
                </div>

                {/* Main Heading */}
                <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold mb-4 sm:mb-6 leading-tight sm:leading-[1.1] animate-fade-up" style={{ animationDelay: '0.1s' }}>
                    <span className="text-white">Win </span>
                    <span className="text-gradient">Premium</span>
                    <br className="hidden sm:block" />
                    <span className="text-white"> Rewards Daily</span>
                </h1>

                {/* Subtitle */}
                <p className="text-sm sm:text-lg md:text-xl text-neutral-300 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-up font-medium drop-shadow-lg" style={{ animationDelay: '0.2s' }}>
                    Join exclusive giveaway contests, complete simple tasks, and stand a chance to win
                    <span className="text-red-400 font-semibold"> real prizes </span>
                    delivered straight to your doorstep.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row justify-center gap-4 mb-10 sm:mb-16 animate-fade-up px-4 sm:px-0" style={{ animationDelay: '0.3s' }}>
                    <button
                        className="w-full sm:w-auto btn-gradient px-8 sm:px-10 py-4 rounded-xl text-base sm:text-lg font-semibold transition-all duration-300 hover:scale-105 shadow-glow"
                        onClick={() => router.push('/register')}
                    >
                        <span className="flex items-center justify-center gap-2">
                            <HiGift className="text-xl" />
                            Start Winning Now
                        </span>
                    </button>
                    <button
                        className="w-full sm:w-auto btn-outline-premium px-8 sm:px-10 py-4 rounded-xl text-base sm:text-lg font-medium backdrop-blur-sm"
                        onClick={() => router.push('/giveaway')}
                    >
                        Browse Giveaways
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 max-w-3xl mx-auto animate-fade-up" style={{ animationDelay: '0.4s' }}>
                    <StatCard icon={<HiGift />} value={stats.activeGiveaways} label="Active" />
                    <StatCard icon={<HiUsers />} value={stats.totalWinners} label="Winners" />
                    <StatCard icon={<HiStar />} value={stats.totalPrizeValue} label="Prizes" />
                    <StatCard icon={<HiSparkles />} value={stats.verifiedLegit} label="Legit" />
                </div>
            </div>

            {/* Bottom gradient fade */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
        </section>
    );
}

function StatCard({ icon, value, label }) {
    return (
        <div className="glass rounded-xl p-3 sm:p-4 border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300 group">
            <div className="text-red-500 text-xl sm:text-2xl mb-1 sm:mb-2 group-hover:scale-110 transition-transform">{icon}</div>
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-0.5 sm:mb-1">{value}</div>
            <div className="text-[10px] sm:text-sm text-neutral-500 uppercase tracking-wider">{label}</div>
        </div>
    );
}
