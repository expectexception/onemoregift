"use client";

import { useEffect, useRef, useState } from "react";

const ACCENTS = {
    red: { ring: "border-red-500/30", bg: "bg-red-500/10", text: "text-red-400", glow: "shadow-[0_0_30px_-5px_rgba(239,68,68,0.5)]", num: "bg-red-500" },
    blue: { ring: "border-blue-500/30", bg: "bg-blue-500/10", text: "text-blue-400", glow: "shadow-[0_0_30px_-5px_rgba(59,130,246,0.5)]", num: "bg-blue-500" },
    amber: { ring: "border-amber-500/30", bg: "bg-amber-500/10", text: "text-amber-400", glow: "shadow-[0_0_30px_-5px_rgba(245,158,11,0.5)]", num: "bg-amber-500" },
};

// Compact reusable version of the homepage "How It Works" steps strip.
// steps: [{ title, desc, accent: 'red'|'blue'|'amber', icon: <svg/> }]
export default function ProcessSteps({ steps, note }) {
    const sectionRef = useRef(null);
    const [activeStep, setActiveStep] = useState(-1);

    useEffect(() => {
        const node = sectionRef.current;
        if (!node) return undefined;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    observer.disconnect();
                    steps.forEach((_, i) => {
                        setTimeout(() => setActiveStep(i), 250 + i * 450);
                    });
                }
            },
            { threshold: 0.2 }
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, [steps]);

    return (
        <div ref={sectionRef} className="relative max-w-4xl mx-auto mb-10">
            <div className="relative flex flex-col md:flex-row items-stretch justify-center gap-0 md:gap-4">
                {/* Animated progress line (desktop) */}
                <div className="hidden md:block absolute top-[34px] left-[16%] right-[16%] h-0.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-red-500 via-blue-500 to-amber-500 transition-all [transition-duration:1400ms] ease-out"
                        style={{ width: activeStep >= steps.length - 1 ? "100%" : `${Math.max(0, activeStep) * 50}%` }}
                    />
                </div>

                {steps.map((step, i) => {
                    const a = ACCENTS[step.accent] || ACCENTS.red;
                    const revealed = i <= activeStep;
                    const isLast = i === steps.length - 1;
                    return (
                        <div key={step.title} className="flex flex-col md:contents items-center flex-1">
                            <div
                                className="relative flex flex-col items-center text-center max-w-xs mx-auto w-full md:flex-1 md:mx-0"
                                style={{
                                    opacity: revealed ? 1 : 0,
                                    transform: revealed ? "translateY(0)" : "translateY(20px)",
                                    transition: "opacity 500ms cubic-bezier(0.22,1,0.36,1), transform 500ms cubic-bezier(0.22,1,0.36,1)",
                                }}
                            >
                                <div className="relative mb-3">
                                    <div className={`w-[64px] h-[64px] sm:w-[68px] sm:h-[68px] rounded-2xl border ${a.ring} ${a.bg} ${a.text} flex items-center justify-center backdrop-blur-sm transition-all duration-500 ${revealed ? a.glow : ""}`}>
                                        {step.icon}
                                    </div>
                                    <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full ${a.num} text-white text-xs font-bold flex items-center justify-center shadow-lg ring-4 ring-[#070708]`}>
                                        {i + 1}
                                    </div>
                                </div>
                                <h3 className="text-sm sm:text-base font-bold text-white mb-1">{step.title}</h3>
                                <p className="text-xs text-neutral-400 leading-relaxed max-w-[220px] px-2">{step.desc}</p>
                            </div>

                            {/* Mobile-only vertical connector between steps */}
                            {!isLast && (
                                <div className="md:hidden h-8 w-px my-2 bg-gradient-to-b from-white/20 to-white/[0.04] overflow-hidden">
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

            {note && (
                <div className="mt-6 flex justify-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-[11px] font-semibold text-amber-300">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                        {note}
                    </span>
                </div>
            )}
        </div>
    );
}
