"use client"
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Link from "next/link";
import { useEffect } from "react";
import confetti from "canvas-confetti";
import { HiCheckCircle, HiArrowLeft, HiGift } from "react-icons/hi";

export default function ThankYou() {
    useEffect(() => {
        // Advanced Premium Fireworks Celebration
        const duration = 5000;
        const animationEnd = Date.now() + duration;
        const defaults = {
            startVelocity: 30,
            spread: 360,
            ticks: 60,
            zIndex: 9999,
            colors: ['#dc2626', '#991b1b', '#fbbf24', '#f59e0b', '#ffffff', '#10b981', '#34d399']
        };

        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        // Massive initial launch
        confetti({
            ...defaults,
            particleCount: 150,
            spread: 100,
            origin: { y: 0.6, x: 0.5 },
            startVelocity: 55
        });

        // Continuous random firework bursts
        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);

            // Left burst
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            });
            // Right burst
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            });
        }, 250);

        // Cleanup interval on unmount
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen flex flex-col bg-black">
            <div className="sticky top-0 z-50">
                <Navbar />
            </div>

            <div className="flex flex-1 items-center justify-center p-4 py-20 relative overflow-hidden">
                {/* Background ambient glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="w-full max-w-lg premium-card rounded-3xl p-8 sm:p-12 text-center animate-fade-up relative z-10 border border-white/10 shadow-2xl">
                    {/* Success Icon */}
                    <div className="relative w-24 h-24 mx-auto mb-8">
                        <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
                        <div className="relative w-full h-full bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/30 backdrop-blur-sm shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                            <HiCheckCircle className="text-emerald-400 text-6xl drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
                        </div>
                    </div>

                    <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 animate-fade-up" style={{ animationDelay: '0.1s' }}>
                        You&apos;re <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">In!</span>
                    </h1>

                    <p className="text-lg text-neutral-400 leading-relaxed mb-10 animate-fade-up" style={{ animationDelay: '0.2s' }}>
                        Your entry has been securely recorded. Keep an eye on your inbox we will notify you via email if you are selected as a winner!
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up" style={{ animationDelay: '0.3s' }}>
                        <Link
                            href="/"
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 btn-outline-premium px-8 py-4 rounded-xl font-medium transition-all hover:bg-white/5"
                        >
                            <HiArrowLeft className="text-xl" />
                            Back Home
                        </Link>
                        <Link
                            href="/giveaway"
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 btn-gradient px-8 py-4 rounded-xl font-medium transition-all hover:scale-105 shadow-glow"
                        >
                            <HiGift className="text-xl" />
                            More Giveaways
                        </Link>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
