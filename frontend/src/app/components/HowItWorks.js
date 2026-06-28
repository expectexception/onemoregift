"use client";

import { useEffect, useRef, useState } from "react";

const STEPS = [
    {
        title: "Sign Up",
        desc: "Create your free account in seconds and join the community.",
        accent: "red",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" x2="19" y1="8" y2="14" /><line x1="22" x2="16" y1="11" y2="11" /></svg>
        ),
    },
    {
        title: "Complete Tasks",
        desc: "Enter giveaways and finish simple tasks to boost your chances.",
        accent: "blue",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 11 3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
        ),
    },
    {
        title: "Gift Delivered",
        desc: "Win real prizes delivered straight to your doorstep — for free.",
        accent: "amber",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12" /><rect width="20" height="5" x="2" y="7" /><line x1="12" x2="12" y1="22" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></svg>
        ),
    },
];

const ACCENTS = {
    red: { ring: "border-red-500/30", bg: "bg-red-500/10", text: "text-red-400", glow: "shadow-[0_0_30px_-5px_rgba(239,68,68,0.5)]", num: "bg-red-500" },
    blue: { ring: "border-blue-500/30", bg: "bg-blue-500/10", text: "text-blue-400", glow: "shadow-[0_0_30px_-5px_rgba(59,130,246,0.5)]", num: "bg-blue-500" },
    amber: { ring: "border-amber-500/30", bg: "bg-amber-500/10", text: "text-amber-400", glow: "shadow-[0_0_30px_-5px_rgba(245,158,11,0.5)]", num: "bg-amber-500" },
};

export default function HowItWorks() {
    const sectionRef = useRef(null);
    const [activeStep, setActiveStep] = useState(-1);

    useEffect(() => {
        const node = sectionRef.current;
        if (!node) return undefined;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    observer.disconnect();
                    // Reveal steps one after another
                    STEPS.forEach((_, i) => {
                        setTimeout(() => setActiveStep(i), 350 + i * 600);
                    });
                }
            },
            { threshold: 0.25 }
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} className="relative bg-black py-20 sm:py-28 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/[0.04] rounded-full blur-[160px] pointer-events-none" />

            <div className="relative max-w-6xl mx-auto px-6">
                <div className="text-center mb-16">
                    <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-red-400/80 mb-3">How It Works</span>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
                        Win in <span className="text-gradient">3 Simple Steps</span>
                    </h2>
                    <p className="text-neutral-400 mt-4 max-w-xl mx-auto text-sm sm:text-base">
                        Getting your free gift has never been easier. Follow along.
                    </p>
                </div>

                <div className="relative flex flex-col md:flex-row items-stretch justify-center gap-0 md:gap-4">
                    {/* Animated progress line (desktop) */}
                    <div className="hidden md:block absolute top-[44px] left-[16%] right-[16%] h-0.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-red-500 via-blue-500 to-amber-500 transition-all [transition-duration:1800ms] ease-out"
                            style={{ width: activeStep >= STEPS.length - 1 ? "100%" : `${Math.max(0, activeStep) * 50}%` }}
                        />
                    </div>

                    {STEPS.map((step, i) => {
                        const a = ACCENTS[step.accent];
                        const revealed = i <= activeStep;
                        const isLast = i === STEPS.length - 1;
                        return (
                            <div key={step.title} className="flex flex-col md:contents items-center flex-1">
                                <div
                                    className="relative flex flex-col items-center text-center max-w-sm mx-auto w-full md:flex-1 md:mx-0"
                                    style={{
                                        opacity: revealed ? 1 : 0,
                                        transform: revealed ? "translateY(0)" : "translateY(24px)",
                                        transition: "opacity 600ms cubic-bezier(0.22,1,0.36,1), transform 600ms cubic-bezier(0.22,1,0.36,1)",
                                    }}
                                >
                                    <div className="relative mb-4 sm:mb-5">
                                        <div className={`w-[72px] h-[72px] sm:w-[88px] sm:h-[88px] rounded-2xl border ${a.ring} ${a.bg} ${a.text} flex items-center justify-center backdrop-blur-sm transition-all duration-500 ${revealed ? a.glow : ""}`}>
                                            {step.icon}
                                        </div>
                                        <div className={`absolute -top-2 -right-2 w-7 h-7 rounded-full ${a.num} text-white text-sm font-bold flex items-center justify-center shadow-lg ring-4 ring-black`}>
                                            {i + 1}
                                        </div>
                                    </div>
                                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{step.title}</h3>
                                    <p className="text-sm text-neutral-400 leading-relaxed max-w-[260px] px-4">{step.desc}</p>
                                </div>

                                {/* Mobile-only vertical connector between steps */}
                                {!isLast && (
                                    <div className="md:hidden h-10 w-px my-3 bg-gradient-to-b from-white/20 to-white/[0.04] overflow-hidden">
                                        <div
                                            className="w-full bg-gradient-to-b from-red-500 to-amber-500 transition-all duration-700 ease-out"
                                            style={{ height: i < activeStep ? "100%" : "0%" }}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
