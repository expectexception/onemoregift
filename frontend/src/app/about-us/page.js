"use client"
import { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { HiSparkles, HiLightBulb, HiEye, HiHeart, HiShieldCheck, HiGift, HiUsers, HiStar } from "react-icons/hi";
import { HiGift as HiGiftLogo } from "react-icons/hi2";
import { GiveawayMetricSvg, TrustMetricSvg, UsersMetricSvg, WinnerMetricSvg } from "../components/MetricSvgs";
import { usePlatformStats } from "../hooks/usePlatformStats";

function useCountUp(target, duration = 2000, startWhen = false) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (!startWhen) return;
        let start = null;
        const step = (timestamp) => {
            if (!start) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            setCount(Math.floor(progress * target));
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [target, duration, startWhen]);
    return count;
}


export default function AboutUs() {
    const statsRef = useRef(null);
    const [statsVisible, setStatsVisible] = useState(false);
    const { stats: platformStats } = usePlatformStats({ refreshMs: 10000 });

    // Counters the admin hid are left out rather than rendered as a zero
    const hiddenStats = platformStats.statsHidden || {};
    const visibleStats = [
        { key: "registeredUsers", icon: <UsersMetricSvg className="w-5 h-5" />, target: platformStats.registeredUsers, label: "Registered Users", color: "from-blue-400 to-cyan-400" },
        { key: "totalGiveaways", icon: <GiveawayMetricSvg className="w-5 h-5" />, target: platformStats.totalGiveaways, label: "Giveaways Hosted", color: "from-purple-400 to-fuchsia-400" },
        { key: "totalWinners", icon: <WinnerMetricSvg className="w-5 h-5" />, target: platformStats.totalWinners, label: "Gifts & Wins Delivered", color: "from-amber-400 to-orange-400" },
        { key: "totalPrizeValue", icon: <TrustMetricSvg className="w-5 h-5" />, target: platformStats.totalPrizeValue, prefix: "₹", suffix: "+", label: "Total Prize Value", color: "from-emerald-400 to-teal-400" },
    ].filter((s) => !hiddenStats[s.key]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
            { threshold: 0.3 }
        );
        if (statsRef.current) observer.observe(statsRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div className="min-h-screen flex flex-col bg-black">
            <div className="sticky top-0 z-50">
                <Navbar />
            </div>

            {/* Hero Section */}
            <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 via-black to-black" />
                <div className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="relative z-10 max-w-4xl mx-auto px-6 text-center animate-fade-up">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 mb-6 backdrop-blur-sm shadow-xl">
                        <HiHeart className="text-red-500" />
                        <span className="text-neutral-300 text-sm font-medium tracking-wide uppercase">Our Story</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                        About <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">OneMoreGift</span>
                    </h1>
                    <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed">
                        India&apos;s trusted destination for premium giveaways, where real people win real prizes, every single day.
                    </p>
                </div>
            </section>

            {/* Animated Stats Section */}
            <section ref={statsRef} className="py-14 px-4 sm:px-6 border-y border-white/5 bg-white/[0.02] backdrop-blur-sm relative z-10 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[260px] bg-red-600/10 blur-[100px]" />
                </div>
                <div className="relative max-w-6xl mx-auto">
                    <div className="text-center mb-8">
                        <h3 className="text-2xl md:text-3xl font-bold text-white">Platform Highlights</h3>
                        <p className="text-neutral-400 mt-2 text-sm md:text-base">Real numbers from our growing gifting community.</p>
                    </div>
                    <div className={`grid gap-4 ${
                        visibleStats.length >= 4 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                            : visibleStats.length === 3 ? "grid-cols-1 sm:grid-cols-3"
                                : visibleStats.length === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 max-w-xs mx-auto"
                    }`}>
                        {visibleStats.map((s) => (
                            <StatCounter key={s.key} icon={s.icon} target={s.target} prefix={s.prefix || ""} suffix={s.suffix || ""} label={s.label} color={s.color} startWhen={statsVisible} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Content Sections */}
            <section className="flex-1 py-20 px-4 sm:px-6 relative z-10 w-full">
                <div className="max-w-6xl mx-auto">
                    {/* About Cards */}
                    <div className="grid md:grid-cols-2 gap-8 mb-20">
                        <div className="premium-card rounded-3xl p-8 sm:p-12 border border-white/10 shadow-2xl bg-black/40 backdrop-blur-xl relative overflow-hidden animate-fade-up">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/10 rounded-full blur-[80px]"></div>
                            <div className="relative z-10">
                                <div className="w-16 h-16 rounded-2xl bg-red-600/10 border border-red-500/20 flex items-center justify-center mb-8 shadow-glow">
                                    <HiSparkles className="text-red-500 text-3xl" />
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-6">Who We Are</h2>
                                <p className="text-neutral-400 text-lg leading-relaxed mb-6">
                                    OneMoreGift is an online giveaway platform founded with one simple goal: make winning accessible to everyone. We partner with brands and businesses across India to bring exciting contests where participants can win products ranging from electronics to lifestyle accessories all completely free to enter.
                                </p>
                                <p className="text-neutral-400 text-lg leading-relaxed">
                                    Based in India, our team works around the clock to source new giveaways, verify sponsors, manage fair winner selection, and ensure timely prize delivery. Every giveaway on our platform is legitimate, and every winner is real.
                                </p>
                            </div>
                        </div>

                        <div className="premium-card rounded-3xl p-8 sm:p-12 border border-white/10 shadow-2xl bg-black/40 backdrop-blur-xl relative overflow-hidden animate-fade-up" style={{ animationDelay: '0.1s' }}>
                            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-[80px]"></div>
                            <div className="relative z-10">
                                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                                    <HiLightBulb className="text-amber-500 text-3xl" />
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-6">Our Mission</h2>
                                <p className="text-neutral-400 text-lg leading-relaxed mb-6">
                                    Our mission is to democratize winning. We believe that exciting opportunities shouldn&apos;t be gatekept behind paywalls or complex conditions. That&apos;s why every giveaway on OneMoreGift is free to join no hidden fees, no mandatory purchases, no strings attached.
                                </p>
                                <p className="text-neutral-400 text-lg leading-relaxed">
                                    We&apos;re committed to maintaining complete transparency in our winner selection process. Every draw is random, every winner is notified publicly, and every prize is tracked from shipment to delivery.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Vision Card */}
                    <div className="premium-card rounded-3xl p-8 sm:p-12 border border-white/10 shadow-2xl bg-gradient-to-br from-white/5 to-transparent relative overflow-hidden animate-fade-up mb-24" style={{ animationDelay: '0.2s' }}>
                        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] -translate-x-1/2 translate-y-1/2"></div>
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 sm:gap-10 relative z-10">
                            <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-red-600 border border-red-500/20 flex items-center justify-center flex-shrink-0 shadow-[0_0_40px_rgba(220,38,38,0.4)] relative">
                                <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent rounded-2xl sm:rounded-3xl"></div>
                                <HiGiftLogo className="text-white text-3xl sm:text-5xl relative z-10 drop-shadow-md" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-white mb-6">Our Vision</h2>
                                <p className="text-neutral-400 text-lg leading-relaxed mb-4">
                                    We envision OneMoreGift becoming the most recognized and trusted giveaway platform in India. Our long-term goal is to build a thriving community where thousands of participants engage daily, brands find genuine audiences, and winners share their authentic experiences.
                                </p>
                                <p className="text-neutral-400 text-lg leading-relaxed">
                                    We&apos;re also working toward launching features like Lucky Draws, VIP Membership tiers, referral reward programs, and a mobile app all designed to enhance your experience and multiply your chances of winning.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* How It Works */}
                    <div className="text-center mb-16 animate-fade-up">
                        <h2 className="text-4xl font-bold text-white mb-6">How It Works</h2>
                        <p className="text-neutral-400 text-lg max-w-2xl mx-auto">Three simple steps to start winning on OneMoreGift</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 mb-24">
                        <StepCard number="1" title="Create an Account" description="Sign up for free with your email or Google account. Fill in your profile details so we can deliver prizes to your doorstep." delay="0.1s" />
                        <StepCard number="2" title="Browse & Enter" description="Explore active giveaways and enter the ones you like with a single click. No purchase or payment is ever required." delay="0.2s" />
                        <StepCard number="3" title="Win & Receive" description="Winners are selected randomly after each giveaway ends. If you win, we notify you via email and ship the prize to your address." delay="0.3s" />
                    </div>

                    {/* Values Grid */}
                    <div className="text-center mb-16 animate-fade-up">
                        <h2 className="text-4xl font-bold text-white mb-6">Why Choose OneMoreGift?</h2>
                        <p className="text-neutral-400 text-lg max-w-2xl mx-auto">Built on trust, driven by transparency</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 mb-10">
                        <ValueCard
                            icon={<HiShieldCheck />}
                            title="100% Verified"
                            description="Every giveaway is verified by our team. We vet sponsors, confirm prizes, and ensure compliance before listing."
                            delay="0.1s"
                        />
                        <ValueCard
                            icon={<HiGift />}
                            title="Free to Enter"
                            description="No purchase necessary. No hidden fees. No subscription required. Just sign up, enter, and win."
                            delay="0.2s"
                        />
                        <ValueCard
                            icon={<HiUsers />}
                            title="Growing Community"
                            description="Join thousands of participants across India who trust OneMoreGift for legitimate, exciting giveaway contests."
                            delay="0.3s"
                        />
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}

function StepCard({ number, title, description, delay }) {
    return (
        <div className="premium-card rounded-3xl p-8 text-center border border-white/5 bg-white/[0.02] backdrop-blur-md hover:bg-white/[0.04] transition-all duration-300 hover:-translate-y-2 animate-fade-up group" style={{ animationDelay: delay }}>
            <div className="w-16 h-16 rounded-full bg-red-600/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6 text-red-500 text-2xl font-black shadow-[0_0_20px_rgba(220,38,38,0.1)] group-hover:scale-110 transition-transform duration-300">
                {number}
            </div>
            <h3 className="text-xl font-bold text-white mb-4 group-hover:text-red-400 transition-colors">{title}</h3>
            <p className="text-neutral-400 text-base leading-relaxed">{description}</p>
        </div>
    );
}

function ValueCard({ icon, title, description, delay }) {
    return (
        <div className="premium-card rounded-3xl p-8 text-center border border-white/5 bg-white/[0.02] backdrop-blur-md hover:bg-white/[0.04] transition-all duration-300 hover:-translate-y-2 animate-fade-up group" style={{ animationDelay: delay }}>
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6 text-white text-3xl shadow-lg group-hover:bg-red-600/10 group-hover:text-red-500 group-hover:border-red-500/20 transition-all duration-300">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-white mb-4 group-hover:text-red-400 transition-colors">{title}</h3>
            <p className="text-neutral-400 text-base leading-relaxed">{description}</p>
        </div>
    );
}

function StatCounter({ icon, target, prefix = "", suffix = "", label, color, startWhen }) {
    const count = useCountUp(target, 1800, startWhen);
    return (
        <div className="premium-card rounded-2xl p-5 border border-white/[0.08] bg-black/45 backdrop-blur-md hover:border-white/[0.16] transition-all duration-300 group">
            <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl border border-white/[0.14] bg-gradient-to-br ${color} text-white text-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
                    {icon}
                </div>
                <span className="text-[10px] uppercase tracking-wider text-neutral-500">Live</span>
            </div>
            <div className={`text-3xl md:text-4xl font-black tabular-nums text-transparent bg-clip-text bg-gradient-to-br ${color}`}>
                {prefix}{startWhen ? count.toLocaleString() : "0"}{suffix}
            </div>
            <div className="mt-2 text-xs md:text-sm text-neutral-400 font-medium uppercase tracking-wide">{label}</div>
        </div>
    );
}
