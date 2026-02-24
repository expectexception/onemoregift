import Image from "next/image";
import dayjs from "dayjs";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";
import { useRouter, usePathname } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle } from "lucide-react";
import { HiClock, HiUsers, HiGift, HiSparkles, HiCalendar, HiStar } from "react-icons/hi";
import { FaTrophy } from "react-icons/fa";
import api from "../utils/apiClient";
import { exportToCSV } from "../utils/exportUtils";
import { HiDownload } from "react-icons/hi";
import { useAuth } from "@/app/context/AuthContext";

export default function GiveawayDetails({ data }) {
    const { toast } = useToast();
    const router = useRouter();
    const path = usePathname();
    const formatStr = "DD MMM YYYY, hh:mm A";
    const {
        _id,
        title,
        description,
        image,
        prize,
        startDate,
        endDate,
        winnerCount,
        participants,
        participantCount,
        maxParticipants,
        winners
    } = data;

    const { user } = useAuth();
    const [initialWinners, setWinners] = useState(winners || []);
    const [isJoining, setIsJoining] = useState(false);
    const [hasJoined, setHasJoined] = useState(false);

    useEffect(() => {
        if (user && participants) {
            // Handle both populated objects (p._id) and unpopulated string IDs (p)
            setHasJoined(participants.some(p => (p._id || p) === user._id));
        } else {
            setHasJoined(false);
        }
    }, [user, participants]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedWinners, setSelectedWinners] = useState([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const end = dayjs(endDate);
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
    }, [endDate]);

    const hasEnded = dayjs().isAfter(endDate);

    const handleEnterClick = () => {
        const joinPath = `${path}/join`;
        router.push(joinPath);
    };

    const handleSetWinners = () => {
        setIsLoading(true);
        setTimeout(() => {
            const shuffled = [...participants].sort(() => Math.random() - 0.5);
            const selected = shuffled.slice(0, winnerCount);
            setSelectedWinners(selected);
            setIsLoading(false);
            setIsDialogOpen(true);
        }, 1000);
    };

    const handleConfirmWinners = async () => {
        let winnersIds = selectedWinners.map(winner => winner._id);
        setIsDialogOpen(false);
        try {
            let { data } = await api.post(`giveaway/winners/${_id}`, { winners: winnersIds }, {
                meta: { auth: "admin" },
            });
            if (data.error === false) {
                setWinners(selectedWinners);
                confetti();
                toast({
                    title: "Winners Set",
                    variant: "success",
                    description: (
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="text-green-500 w-5 h-5" />
                            <span>Winners set successfully!</span>
                        </div>
                    )
                });
            } else {
                toast({ title: "Error", variant: "destructive", description: "Something went wrong." });
            }
        } catch (error) {
            toast({ title: "Error", variant: "destructive", description: "Something went wrong." });
        }
    };

    const handleExportParticipants = () => {
        if (!participants || !participants.length) return;
        const exportData = participants.map(p => ({
            Name: p.name || "N/A",
            Email: p.email || "N/A",
            Phone: p.phone || "N/A",
            Address: p.address || "N/A",
            JoinedAt: p.joinedAt ? dayjs(p.joinedAt).format(formatStr) : "N/A"
        }));
        exportToCSV(exportData, `Participants_${title.replace(/\s+/g, '_')}`);
    };

    const handleExportWinners = () => {
        if (!initialWinners || !initialWinners.length) return;
        const exportData = initialWinners.map((w, idx) => ({
            Rank: idx + 1,
            Name: w.name || "N/A",
            Email: w.email || "N/A",
            Phone: w.phone || "N/A",
            Address: w.address || "N/A"
        }));
        exportToCSV(exportData, `Winners_${title.replace(/\s+/g, '_')}`);
    };

    const progressPercent = Math.min((participantCount / (maxParticipants || 1)) * 100, 100);

    return (
        <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-up">
            <div className="premium-card rounded-3xl overflow-hidden">
                {/* Image Section */}
                <div className="relative h-72 bg-neutral-900 flex items-center justify-center">
                    <Image
                        src={image || ""}
                        alt={title}
                        width={280}
                        height={280}
                        className="object-contain transform transition-transform duration-500 hover:scale-105"
                    />
                    {/* Status Badge */}
                    <div className={`absolute top-4 right-4 px-4 py-2 rounded-full ${hasEnded ? 'bg-red-500/20 border-red-500/40' : 'bg-emerald-500/20 border-emerald-500/40'} border`}>
                        <span className={`text-sm font-semibold flex items-center gap-2 ${hasEnded ? 'text-red-400' : 'text-emerald-400'}`}>
                            {!hasEnded && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                            {hasEnded ? 'Ended' : 'Live'}
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{title}</h1>
                    <p className="text-neutral-400 text-lg leading-relaxed mb-8">{description}</p>

                    {/* Countdown Timer */}
                    {!hasEnded && (
                        <div className="mb-8">
                            <div className="flex items-center gap-2 text-neutral-500 mb-3">
                                <HiClock className="text-red-500" />
                                <span className="text-sm font-medium">Time Remaining</span>
                            </div>
                            <div className="flex flex-wrap gap-2 sm:gap-3">
                                <CountdownUnit value={timeLeft.days} label="Days" />
                                <CountdownUnit value={timeLeft.hours} label="Hours" />
                                <CountdownUnit value={timeLeft.minutes} label="Min" />
                                <CountdownUnit value={timeLeft.seconds} label="Sec" />
                            </div>
                        </div>
                    )}

                    {/* Date Range */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                        <div className="p-4 rounded-xl glass">
                            <div className="flex items-center gap-2 text-red-500 mb-2">
                                <HiCalendar />
                                <span className="text-sm">Starts</span>
                            </div>
                            <p className="text-white font-medium">{startDate ? dayjs(startDate).format(formatStr) : "N/A"}</p>
                        </div>
                        <div className="p-4 rounded-xl glass">
                            <div className="flex items-center gap-2 text-red-500 mb-2">
                                <HiCalendar />
                                <span className="text-sm">Ends</span>
                            </div>
                            <p className="text-white font-medium">{endDate ? dayjs(endDate).format(formatStr) : "N/A"}</p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 text-neutral-500">
                                <HiUsers className="text-red-500" />
                                <span className="text-sm font-medium">Participants</span>
                            </div>
                            <span className="text-white font-bold">{participantCount} / {maxParticipants || "\u221E"}</span>
                        </div>
                        <div className="h-3 bg-white/[0.05] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-red-600 to-red-500 rounded-full transition-all duration-500"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                        {participantCount >= maxParticipants && (
                            <p className="mt-2 text-sm text-emerald-400 font-medium">Giveaway is full!</p>
                        )}
                    </div>

                    {/* Prize */}
                    <div className="p-4 rounded-xl bg-red-600/5 border border-red-600/10 mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                                <FaTrophy className="text-white text-xl" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-500">Prize</p>
                                <p className="text-xl font-bold text-white">{prize}</p>
                            </div>
                        </div>
                    </div>

                    {/* Participants & Winners Section */}
                    {(_id && (path.includes("/admin/dashboard/giveaways/") || hasEnded)) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-6 rounded-2xl glass border border-white/5">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-red-500 font-semibold flex items-center gap-2">
                                        <HiUsers className="text-lg" />
                                        Participants ({participantCount || 0})
                                    </h4>
                                    {path.includes("/admin") && participants?.length > 0 && (
                                        <button
                                            onClick={handleExportParticipants}
                                            className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 transition-colors bg-white/5 px-2 py-1 rounded-lg border border-white/5"
                                        >
                                            <HiDownload /> CSV
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                    <ul className="space-y-2">
                                        {participants?.length > 0 ? participants.map((user) => (
                                            <li key={user._id} className="text-sm">
                                                <Link href={path.includes("/admin") ? `/admin/dashboard/users/${user._id}` : "#"} className="text-neutral-400 hover:text-red-400 transition-colors">
                                                    {user.name}
                                                </Link>
                                            </li>
                                        )) : (
                                            <li className="text-neutral-600 text-sm italic">No participants yet</li>
                                        )}
                                    </ul>
                                </div>
                            </div>

                            {initialWinners?.length > 0 && (
                                <div className="border-t md:border-t-0 md:border-l border-white/5 pt-6 md:pt-0 md:pl-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-yellow-400 font-semibold flex items-center gap-2">
                                            <FaTrophy className="text-lg" /> Winners
                                        </h4>
                                        <div className="flex items-center gap-2">
                                            {path.includes("/admin") && (
                                                <button
                                                    onClick={handleExportWinners}
                                                    className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 transition-colors bg-white/5 px-2 py-1 rounded-lg border border-white/5"
                                                >
                                                    <HiDownload /> CSV
                                                </button>
                                            )}
                                            <span className="px-2 py-0.5 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-[10px] text-yellow-400 font-bold uppercase tracking-wider">
                                                Selected
                                            </span>
                                        </div>
                                    </div>
                                    <ul className="space-y-3">
                                        {initialWinners?.map((user, idx) => (
                                            <li key={user._id} className="flex items-center gap-3 group">
                                                <div className="w-6 h-6 rounded-full bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center text-yellow-400 text-xs font-bold">
                                                    {idx + 1}
                                                </div>
                                                <Link href={path.includes("/admin") ? `/admin/dashboard/users/${user._id}` : "#"} className="text-white font-medium hover:text-yellow-400 transition-colors">
                                                    {user.name}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Buttons */}
                    {!path.includes("/admin/dashboard/giveaways/") ? (
                        hasJoined ? (
                            <div className="w-full py-4 rounded-xl font-semibold text-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center gap-2 cursor-default animate-fade-up">
                                <CheckCircle className="w-6 h-6" />
                                Participated
                            </div>
                        ) : (
                            <button
                                className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${hasEnded || (maxParticipants && participantCount >= maxParticipants)
                                    ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                                    : 'btn-gradient hover:shadow-glow-lg'
                                    }`}
                                onClick={handleEnterClick}
                                disabled={hasEnded || isJoining || (maxParticipants && participantCount >= maxParticipants)}
                            >
                                {hasEnded ? "Giveaway Ended" : isJoining ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="animate-spin rounded-full border-t-2 border-white h-5 w-5"></span>
                                        Processing...
                                    </span>
                                ) : (participantCount >= maxParticipants ? "Limit Reached" : "Enter Now")}
                            </button>
                        )
                    ) : (
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                className="w-full sm:flex-1 py-4 rounded-xl font-semibold btn-outline-premium"
                                onClick={() => router.push(`/admin/dashboard/giveaways/edit/${data._id}`)}
                            >
                                Edit Giveaway
                            </button>
                            {initialWinners?.length === 0 && (
                                <button
                                    className="w-full sm:flex-1 py-4 rounded-xl font-semibold btn-gradient"
                                    onClick={handleSetWinners}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="animate-spin rounded-full border-t-2 border-white h-5 w-5"></span>
                                            Selecting...
                                        </span>
                                    ) : "Set Winners"}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Winners Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="glass-dark border-white/10 rounded-2xl max-w-md">
                    <DialogHeader className="text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-glow">
                            <FaTrophy className="text-white text-2xl" />
                        </div>
                        <DialogTitle className="text-2xl font-bold text-white">Selected Winners</DialogTitle>
                        <DialogDescription className="text-neutral-400">
                            Confirm these winners for the giveaway
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-3">
                        {selectedWinners.map((winner, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-red-600/5 border border-red-600/10">
                                <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-sm">
                                    {index + 1}
                                </div>
                                <span className="text-white font-medium">{winner.name}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-3">
                        <button className="flex-1 py-3 rounded-xl btn-gradient font-semibold" onClick={handleConfirmWinners}>
                            Confirm Winners
                        </button>
                        <button className="flex-1 py-3 rounded-xl btn-outline-premium font-medium" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function CountdownUnit({ value, label }) {
    return (
        <div className="countdown-unit flex flex-col items-center min-w-[50px] sm:min-w-[60px] py-2 sm:py-3">
            <span className="text-xl sm:text-2xl font-bold text-white">{String(value).padStart(2, '0')}</span>
            <span className="text-[10px] sm:text-xs text-red-400">{label}</span>
        </div>
    );
}
