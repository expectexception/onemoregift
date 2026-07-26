"use client"

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Link from "next/link";
import { useEffect } from "react";
import { ArrowLeft, Gift, MailCheck, ShieldCheck, Sparkles, TicketCheck } from "lucide-react";

export default function ThankYou() {
    useEffect(() => {
        let interval;
        import("canvas-confetti").then((module) => {
            const confetti = module.default;
            const duration = 4200;
            const animationEnd = Date.now() + duration;
            const colors = ["#dc2626", "#ef4444", "#fbbf24", "#ffffff", "#737373"];

            confetti({
                particleCount: 110,
                spread: 85,
                startVelocity: 46,
                origin: { x: 0.5, y: 0.58 },
                colors,
                zIndex: 9999,
            });

            interval = setInterval(() => {
                const timeLeft = animationEnd - Date.now();
                if (timeLeft <= 0) {
                    clearInterval(interval);
                    return;
                }

                confetti({
                    particleCount: Math.max(18, 42 * (timeLeft / duration)),
                    spread: 60,
                    startVelocity: 34,
                    origin: { x: Math.random() * 0.18 + 0.18, y: Math.random() * 0.25 + 0.08 },
                    colors,
                    zIndex: 9999,
                });
                confetti({
                    particleCount: Math.max(18, 42 * (timeLeft / duration)),
                    spread: 60,
                    startVelocity: 34,
                    origin: { x: Math.random() * 0.18 + 0.64, y: Math.random() * 0.25 + 0.08 },
                    colors,
                    zIndex: 9999,
                });
            }, 360);
        }).catch(err => console.error("Failed to load confetti", err));

        return () => {
            if (interval) clearInterval(interval);
        };
    }, []);

    return (
        <div className="min-h-screen flex flex-col bg-black text-white">
            <div className="sticky top-0 z-50">
                <Navbar />
            </div>

            <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute left-1/2 top-1/2 h-[620px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600/10 blur-[130px]" />
                    <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-red-600/15 blur-[100px]" />
                    <div className="absolute -right-24 bottom-12 h-80 w-80 rounded-full bg-neutral-900/10 blur-[110px]" />
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(circle_at_center,black,transparent_72%)]" />
                </div>

                <section className="relative z-10 w-full max-w-5xl">
                    <div className="grid items-center gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                        <div className="relative mx-auto flex aspect-square w-full max-w-[360px] items-center justify-center sm:max-w-[420px]">
                            <div className="absolute h-52 w-52 rounded-full bg-red-500/10 blur-3xl" />

                            <svg className="relative h-full w-full drop-shadow-[0_30px_80px_rgba(220,38,38,0.22)]" viewBox="0 0 420 420" role="img" aria-label="Entry confirmed ticket animation">
                                <defs>
                                    <linearGradient id="ticketGlow" x1="92" y1="84" x2="328" y2="336" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="#ef4444" />
                                        <stop offset="0.45" stopColor="#f8fafc" />
                                        <stop offset="1" stopColor="#dc2626" />
                                    </linearGradient>
                                    <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
                                        <feGaussianBlur stdDeviation="8" result="blur" />
                                        <feMerge>
                                            <feMergeNode in="blur" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                </defs>
                                <circle cx="210" cy="210" r="152" fill="rgba(255,255,255,0.025)" stroke="rgba(255,255,255,0.1)" />
                                <path className="ticket-pop" d="M116 160c0-19 15-34 34-34h120c19 0 34 15 34 34v28c-18 4-31 20-31 39s13 35 31 39v28c0 19-15 34-34 34H150c-19 0-34-15-34-34v-28c18-4 31-20 31-39s-13-35-31-39v-28Z" fill="rgba(10,10,10,0.92)" stroke="url(#ticketGlow)" strokeWidth="3" />
                                <path className="check-draw" d="M174 222l28 28 58-70" fill="none" stroke="#ef4444" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>

                        <div className="premium-card relative overflow-hidden rounded-[2rem] border border-white/[0.09] p-6 text-center shadow-[0_35px_110px_-60px_rgba(220,38,38,0.45)] sm:p-9 lg:text-left">
                            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-red-600/10 blur-[80px]" />
                            <div className="pointer-events-none absolute -bottom-20 left-4 h-48 w-48 rounded-full bg-red-600/10 blur-[70px]" />

                            <div className="relative">
                                <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-red-400 lg:mx-0">
                                    <TicketCheck className="h-4 w-4" />
                                    Entry secured
                                </div>

                                <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                                    You&apos;re officially{" "}
                                    <span className="bg-gradient-to-r from-red-500 via-rose-400 to-white bg-clip-text text-transparent">
                                        in.
                                    </span>
                                </h1>

                                <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-neutral-300 sm:text-lg lg:mx-0">
                                    Your giveaway entry has been sealed, timestamped, and added to the draw pool. If you are selected, we will notify you by email with the next steps.
                                </p>

                                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                                    <ConfirmationStat icon={ShieldCheck} label="Verified" value="Secure entry" />
                                    <ConfirmationStat icon={MailCheck} label="Email" value="Winner notice" />
                                    <ConfirmationStat icon={Sparkles} label="Draw" value="Fair selection" />
                                </div>

                                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                    <Link
                                        href="/"
                                        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/[0.12] bg-white/[0.035] px-6 py-3 text-sm font-bold text-neutral-100 transition hover:border-white/25 hover:bg-white/[0.07] sm:w-auto"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                        Back Home
                                    </Link>
                                    <Link
                                        href="/giveaway"
                                        className="btn-gradient inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-black shadow-[0_18px_55px_-26px_rgba(220,38,38,0.95)] transition hover:scale-[1.02] sm:w-auto"
                                    >
                                        <Gift className="h-4 w-4" />
                                        More Giveaways
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />

            <style jsx>{`
                .ticket-pop {
                    transform-origin: center;
                    animation: ticketPop 760ms cubic-bezier(0.16, 1, 0.3, 1) both;
                }
                .check-draw {
                    stroke-dasharray: 140;
                    stroke-dashoffset: 140;
                    animation: drawCheck 820ms 420ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                @keyframes ticketPop {
                    from { opacity: 0; transform: scale(0.84) rotate(-4deg); }
                    to { opacity: 1; transform: scale(1) rotate(0deg); }
                }
                @keyframes drawCheck {
                    to { stroke-dashoffset: 0; }
                }
            `}</style>
        </div>
    );
}

const ConfirmationStat = ({ icon: Icon, label, value }) => (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4 text-left">
        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
            <Icon className="h-4 w-4" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-500">{label}</p>
        <p className="mt-1 text-sm font-bold text-white">{value}</p>
    </div>
);
