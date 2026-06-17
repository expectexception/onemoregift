"use client"
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CheckIcon, TrophyIcon, VerificationIcon, UsersIcon } from "./SVGIcons";
import RevealOnScroll from "./RevealOnScroll";
import { formatCompactNumber, formatIndianCurrency, usePlatformStats } from "../hooks/usePlatformStats";

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
    const { stats, loading: statsLoading } = usePlatformStats({ refreshMs: 10000 });

    // Auto-change background images
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImage((prev) => (prev + 1) % heroImages.length);
        }, 5000);
        return () => clearInterval(interval);
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
                    className="absolute inset-0 transition-opacity duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{
                        opacity: i === currentImage ? 0.5 : 0,
                        willChange: 'opacity',
                    }}
                >
                    <Image
                        src={img}
                        alt=""
                        fill
                        sizes="100vw"
                        className="absolute inset-0 h-full w-full object-cover object-center"
                        priority={i === 0}
                    />
                </div>
            ))}

            {/* Dark overlays for readability - adjusted for increased image opacity */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-black/70" />

            {/* Subtle red accent glows */}
            <div className="absolute top-20 left-[10%] w-72 h-72 bg-red-600/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-20 right-[10%] w-96 h-96 bg-red-700/8 rounded-full blur-[140px]" />

            {/* Cursor glow */}
            <div
                ref={cursorRef}
                className="absolute top-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none opacity-0 transition-opacity duration-300 will-change-transform z-[5]"
                style={{
                    background: 'radial-gradient(circle, rgba(220,38,38,0.15) 0%, rgba(220,38,38,0.05) 40%, transparent 70%)',
                }}
            />

            {/* Image indicator dots - keep lower and only on larger screens to avoid overlap */}
            <div className="absolute bottom-3 lg:bottom-5 left-1/2 -translate-x-1/2 z-20 hidden lg:flex gap-2">
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
            <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-10 sm:pt-14 lg:pt-16 pb-14 lg:pb-20">
                {/* Main Heading */}
                <RevealOnScroll delayMs={60}>
                    <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold mb-4 sm:mb-6 leading-tight sm:leading-[1.1]">
                        <span className="text-white">Win </span>
                        <span className="text-gradient">Free</span>
                        <br className="hidden sm:block" />
                        <span className="text-white"> Rewards Daily</span>
                    </h1>
                </RevealOnScroll>

                {/* Subtitle */}
                <RevealOnScroll delayMs={140}>
                    <p className="text-sm sm:text-lg md:text-xl text-neutral-300 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed font-medium drop-shadow-lg">
                        Join exclusive giveaway contests, complete simple tasks, and stand a chance to win
                        <span className="text-red-400 font-semibold"> real prizes </span>
                        delivered straight to your doorstep.
                    </p>
                </RevealOnScroll>

                {/* CTA Buttons */}
                <RevealOnScroll delayMs={210}>
                    <div className="flex flex-col sm:flex-row justify-center gap-4 mb-10 sm:mb-16 px-4 sm:px-0">
                        <button
                            className="w-full sm:w-auto btn-gradient px-8 sm:px-10 py-4 rounded-xl text-base sm:text-lg font-semibold transition-all duration-300 hover:scale-105 shadow-glow"
                            onClick={() => router.push('/register')}
                        >
                            <span className="flex items-center justify-center gap-2">
                                <CheckIcon className="w-5 h-5" />
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
                </RevealOnScroll>

                {/* Stats */}
                <RevealOnScroll delayMs={290}>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 max-w-3xl mx-auto">
                        <StatCard Icon={CheckIcon} value={statsLoading ? "..." : formatCompactNumber(stats.activeGiveaways)} label="Active" />
                        <StatCard Icon={TrophyIcon} value={statsLoading ? "..." : formatCompactNumber(stats.totalWinners)} label="Winners" />
                        <StatCard Icon={VerificationIcon} value={statsLoading ? "..." : formatIndianCurrency(stats.totalPrizeValue)} label="Prizes" />
                        <StatCard Icon={UsersIcon} value={statsLoading ? "..." : formatCompactNumber(stats.registeredUsers)} label="Users" />
                    </div>
                </RevealOnScroll>

                {/* Steps */}
                <RevealOnScroll delayMs={360}>
                    <div className="mt-12 sm:mt-16 bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 sm:p-8 backdrop-blur-sm max-w-4xl mx-auto">
                        <div className="flex flex-col md:flex-row items-center justify-center gap-6 sm:gap-10">
                            <div className="flex flex-col items-center group">
                                <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-3 group-hover:scale-110 group-hover:bg-red-500/20 transition-all duration-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
                                </div>
                                <span className="text-neutral-200 font-bold text-sm tracking-wide">1. Sign Up</span>
                            </div>
                            
                            <div className="hidden md:flex w-16 items-center justify-center">
                                <div className="w-full h-px bg-gradient-to-r from-red-500/20 via-red-500/50 to-red-500/20"></div>
                            </div>
                            <div className="md:hidden h-8 w-px bg-gradient-to-b from-red-500/20 via-red-500/50 to-red-500/20"></div>

                            <div className="flex flex-col items-center group">
                                <div className="w-14 h-14 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all duration-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                                </div>
                                <span className="text-neutral-200 font-bold text-sm tracking-wide">2. Complete Tasks</span>
                            </div>

                            <div className="hidden md:flex w-16 items-center justify-center">
                                <div className="w-full h-px bg-gradient-to-r from-blue-500/20 via-blue-500/50 to-amber-500/20"></div>
                            </div>
                            <div className="md:hidden h-8 w-px bg-gradient-to-b from-blue-500/20 via-blue-500/50 to-amber-500/20"></div>

                            <div className="flex flex-col items-center group">
                                <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all duration-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect width="20" height="5" x="2" y="7"/><line x1="12" x2="12" y1="22" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
                                </div>
                                <span className="text-neutral-200 font-bold text-sm tracking-wide">3. Gift Delivered</span>
                            </div>
                        </div>
                    </div>
                </RevealOnScroll>
            </div>

            {/* Bottom gradient fade */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
        </section>
    );
}

function StatCard({ Icon, value, label }) {
    return (
        <div className="glass rounded-xl p-3 sm:p-4 border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300 group">
            <div className="mb-1 sm:mb-2 group-hover:scale-110 transition-transform">
                <Icon className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-0.5 sm:mb-1">{value}</div>
            <div className="text-[10px] sm:text-sm text-neutral-500 uppercase tracking-wider">{label}</div>
        </div>
    );
}
