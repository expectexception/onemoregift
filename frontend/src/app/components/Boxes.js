import Image from "next/image";
import gift1 from "../../../public/images/gift-1.png";
import { Button } from "@/components/ui/button";
import dayjs from "dayjs";
import { useState, useEffect } from "react";
import { HiClock, HiUsers, HiSparkles, HiArrowRight } from "react-icons/hi";
import { CheckCircle } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { useRouter } from "next/navigation";
import api from "../utils/apiClient";
import { useAuth } from "../context/AuthContext";

export default function Giveaways() {
    const router = useRouter();
    const [items, setItems] = useState([]);
    const { userAuthenticated } = useAuth();
    const loggedIn = userAuthenticated;

    const fetchItems = async () => {
        try {
            const response = await api.get(`giveaway`);
            setItems(response.data.data);
        } catch (error) {
            console.error("Error fetching giveaways:", error);
        }
    };

    useEffect(() => {
        fetchItems();
        const interval = setInterval(fetchItems, 15000); // Poll every 15 seconds
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="section-dark py-20 px-4">
            {/* Section Header */}
            <div className="max-w-7xl mx-auto mb-12 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4 border border-white/[0.06]">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-neutral-400 text-sm font-medium">Live Contests</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                    Active <span className="text-gradient">Giveaways</span>
                </h2>
                <p className="text-neutral-500 text-lg max-w-2xl mx-auto">
                    Enter our exclusive giveaways and stand a chance to win amazing prizes. New contests added daily!
                </p>
            </div>

            {/* Giveaways Grid/Carousel */}
            <div className="max-w-7xl mx-auto">
                {(!items || items.length === 0) ? (
                    <div className="glass rounded-2xl p-16 text-center border border-white/[0.06]">
                        <div className="w-20 h-20 rounded-full bg-red-600/10 flex items-center justify-center mx-auto mb-6">
                            <HiSparkles className="text-4xl text-red-500" />
                        </div>
                        <h3 className="text-2xl font-semibold text-white mb-2">No Active Giveaways</h3>
                        <p className="text-neutral-500 mb-6">Check back soon for new exciting contests!</p>
                        <button
                            className="btn-outline-premium px-6 py-3 rounded-xl"
                            onClick={() => router.push('/winners')}
                        >
                            View Past Winners
                        </button>
                    </div>
                ) : (
                    <Carousel opts={{ align: "start" }} className="w-full">
                        <CarouselContent className="-ml-4">
                            {items.map((item, index) => (
                                <CarouselItem
                                    key={index}
                                    className="pl-4 basis-[85%] sm:basis-[70%] md:basis-1/2 lg:basis-1/3"
                                >
                                    <GiveawayCard
                                        item={item}
                                        loggedIn={loggedIn}
                                        router={router}
                                        delay={index * 0.1}
                                    />
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="hidden md:flex -left-12 lg:-left-16 h-12 w-12 rounded-xl glass border-white/10 hover:border-red-600/40 text-neutral-400 hover:text-white z-10" />
                        <CarouselNext className="hidden md:flex -right-12 lg:-right-16 h-12 w-12 rounded-xl glass border-white/10 hover:border-red-600/40 text-neutral-400 hover:text-white z-10" />
                    </Carousel>
                )}
            </div>

            {/* View All Button */}
            {items && items.length > 0 && (
                <div className="text-center mt-12">
                    <button
                        className="btn-outline-premium px-8 py-3 rounded-xl inline-flex items-center gap-2 group"
                        onClick={() => router.push('/giveaway')}
                    >
                        View All Giveaways
                        <HiArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            )}
        </section>
    );
}

function GiveawayCard({ item, loggedIn, router, delay = 0 }) {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [showDialog, setShowDialog] = useState(false);

    useEffect(() => {
        const end = dayjs(item.endDate);

        const updateTimeLeft = () => {
            const now = dayjs();
            const diff = end.diff(now);

            if (diff > 0) {
                setTimeLeft({
                    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                    hours: Math.floor(diff / (1000 * 60 * 60) % 24),
                    minutes: Math.floor(diff / (1000 * 60) % 60),
                    seconds: Math.floor(diff / 1000 % 60)
                });
            } else {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            }
        };

        const timer = setInterval(updateTimeLeft, 1000);
        updateTimeLeft();
        return () => clearInterval(timer);
    }, [item.endDate]);

    const handleEnterClick = (id) => {
        if (!loggedIn) {
            setShowDialog(true);
        } else {
            router.push(`/giveaway/${id}`);
        }
    };

    const { user } = useAuth();
    const hasEnded = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

    // Check if the current user is already in the participants array
    const hasJoined = loggedIn && user && item.participants?.some(p => (p._id || p) === user._id);

    return (
        <>
            <div
                className="giveaway-card p-4 sm:p-6 h-full flex flex-col animate-fade-up border border-white/5"
                style={{ animationDelay: `${delay}s` }}
            >
                {/* Image Container */}
                <div className="relative h-40 sm:h-48 w-full mb-4 sm:mb-6 rounded-xl overflow-hidden bg-neutral-900/50 flex items-center justify-center">
                    <Image
                        src={item.image || gift1}
                        height={160}
                        width={160}
                        alt={item.title}
                        className="object-contain transform transition-transform duration-500 hover:scale-110"
                    />
                    {/* Status Badge */}
                    {hasEnded ? (
                        <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40">
                            <span className="text-red-400 text-xs font-semibold">Ended</span>
                        </div>
                    ) : (
                        <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40">
                            <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Live
                            </span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2 line-clamp-2">{item.title}</h3>

                    {/* Countdown Timer */}
                    {!hasEnded ? (
                        <div className="flex gap-2 mb-4">
                            <CountdownUnit value={timeLeft.days} label="D" />
                            <CountdownUnit value={timeLeft.hours} label="H" />
                            <CountdownUnit value={timeLeft.minutes} label="M" />
                            <CountdownUnit value={timeLeft.seconds} label="S" />
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-red-400 mb-4">
                            <HiClock className="text-lg" />
                            <span className="text-sm font-medium">Giveaway has ended</span>
                        </div>
                    )}

                    {/* Participants */}
                    <div className="flex items-center gap-2 text-neutral-500 mb-4 sm:mb-6">
                        <HiUsers className="text-lg text-red-500" />
                        <span className="text-xs sm:text-sm">{item.participantCount || 0} participants</span>
                    </div>

                    {/* Action Button */}
                    {hasJoined ? (
                        <div className="w-full py-3.5 rounded-xl font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center gap-2 cursor-default mt-auto animate-fade-up">
                            <CheckCircle className="w-5 h-5 flex-shrink-0" />
                            <span>Participated</span>
                        </div>
                    ) : (
                        <button
                            className={`w-full py-2.5 sm:py-3.5 rounded-xl text-sm sm:text-base font-semibold transition-all duration-300 mt-auto ${hasEnded
                                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                                : 'btn-gradient hover:shadow-glow-lg'
                                }`}
                            onClick={() => handleEnterClick(item._id)}
                            disabled={hasEnded}
                        >
                            {hasEnded ? "Ended" : "Enter Now"}
                        </button>
                    )}
                </div>
            </div>

            {/* Login Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="glass-dark border-white/10 rounded-2xl max-w-md mx-auto">
                    <DialogHeader className="text-center">
                        <div className="w-16 h-16 rounded-2xl bg-red-600 flex items-center justify-center mx-auto mb-4 shadow-glow">
                            <HiSparkles className="text-white text-2xl" />
                        </div>
                        <DialogTitle className="text-2xl font-bold text-white">Join the Giveaway</DialogTitle>
                        <DialogDescription className="text-neutral-400 text-base">
                            Sign in or create an account to enter this giveaway and win amazing prizes!
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-3 pt-4">
                        <button
                            className="btn-gradient w-full py-3.5 rounded-xl font-semibold"
                            onClick={() => router.push("/login")}
                        >
                            Sign In
                        </button>
                        <button
                            className="btn-outline-premium w-full py-3.5 rounded-xl font-medium"
                            onClick={() => router.push("/register")}
                        >
                            Create Account
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

function CountdownUnit({ value, label }) {
    return (
        <div className="countdown-unit flex flex-col items-center min-w-[42px]">
            <span className="text-lg font-bold text-white">{String(value).padStart(2, '0')}</span>
            <span className="text-xs text-red-400">{label}</span>
        </div>
    );
}
