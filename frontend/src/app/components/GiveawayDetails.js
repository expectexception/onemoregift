import Image from "next/image";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Shuffle, ListChecks, AlertCircle } from "lucide-react";
import { HiClock, HiCalendar } from "react-icons/hi";
import api from "../utils/apiClient";
import { exportToCSV } from "../utils/exportUtils";
import { HiDownload } from "react-icons/hi";
import { useAuth } from "@/app/context/AuthContext";
import { TrophyIcon, UserIcon } from "./SVGIcons";

dayjs.extend(utc);
dayjs.extend(timezone);

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

    // Check participation status from server
    const checkParticipationStatus = async () => {
        if (!user?._id || !_id) return;
        try {
            const { data } = await api.get(`giveaway/${_id}`);
            if (data?.giveaway?.participants) {
                const joined = data.giveaway.participants.some(p => (p._id || p) === user._id);
                setHasJoined(joined);
            }
        } catch (error) {
            console.error("Failed to check participation status", error);
        }
    };

    useEffect(() => {
        if (user && participants) {
            // Handle both populated objects (p._id) and unpopulated string IDs (p)
            const isJoined = participants.some(p => (p._id || p) === user._id);
            setHasJoined(isJoined);
        } else {
            setHasJoined(false);
        }
    }, [user, participants]);

    // Check server on component mount to ensure latest status
    useEffect(() => {
        if (user) {
            checkParticipationStatus();
        }
    }, [user?._id, _id]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedWinners, setSelectedWinners] = useState([]);
    const [winnerMode, setWinnerMode] = useState("random");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const participantTotal = Number(participantCount || participants?.length || 0);
    const winnerTotal = Number(winnerCount || 0);
    const participantCap = Number(maxParticipants || 0);
    const imageSrc = image || "/images/gift.png";

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

    const nowIst = dayjs().tz("Asia/Kolkata");
    const isAdminPath = path.includes("/admin/dashboard/giveaways/");
    const isTestEvent = data?.title?.startsWith("LIFECYCLE-TEST-") || data?.title?.startsWith("TEST-");
    const hasStarted = startDate ? !nowIst.isBefore(dayjs(startDate).tz("Asia/Kolkata")) : true;
    const hasEnded = (endDate ? !nowIst.isBefore(dayjs(endDate).tz("Asia/Kolkata")) : false) || (isAdminPath && isTestEvent);
    const canPickWinners = isAdminPath
        && hasEnded
        && initialWinners?.length === 0
        && participants?.length >= winnerTotal
        && winnerTotal > 0;

    const handleEnterClick = () => {
        const joinPath = `${path}/join`;
        router.push(joinPath);
    };

    const handleSetWinners = () => {
        if (!hasEnded) {
            toast({ title: "Giveaway still live", variant: "destructive", description: "Winners can be selected after the giveaway ends." });
            return;
        }
        if (!participants?.length) {
            toast({ title: "No participants", variant: "destructive", description: "There are no participants to select from." });
            return;
        }
        if (participants.length < winnerTotal) {
            toast({ title: "Not enough participants", variant: "destructive", description: `Need at least ${winnerTotal} participants.` });
            return;
        }
        setWinnerMode("random");
        setSelectedWinners([]);
        setIsDialogOpen(true);
    };

    const handleConfirmWinners = async () => {
        const winnersIds = selectedWinners.map(winner => winner._id);
        if (winnerMode === "manual" && winnersIds.length !== winnerTotal) {
            toast({ title: "Select winners", variant: "destructive", description: `Please select exactly ${winnerTotal} winner${winnerTotal === 1 ? "" : "s"}.` });
            return;
        }
        setIsLoading(true);
        try {
            let { data } = await api.post(`giveaway/winners/${_id}`, { mode: winnerMode, winners: winnersIds }, {
                meta: { auth: "admin" },
            });
            if (data.error === false) {
                setWinners(data.winners || selectedWinners);
                setSelectedWinners(data.winners || selectedWinners);
                setIsDialogOpen(false);
                import("canvas-confetti").then((module) => {
                    const confetti = module.default;
                    confetti();
                }).catch(err => console.error("Failed to load confetti", err));
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
                toast({ title: "Error", variant: "destructive", description: data.msg || "Something went wrong." });
            }
        } catch (error) {
            toast({ title: "Error", variant: "destructive", description: error?.response?.data?.msg || "Something went wrong." });
        } finally {
            setIsLoading(false);
        }
    };

    const toggleManualWinner = (participant) => {
        setSelectedWinners((current) => {
            const exists = current.some(winner => winner._id === participant._id);
            if (exists) {
                return current.filter(winner => winner._id !== participant._id);
            }
            if (current.length >= winnerTotal) {
                toast({ title: "Winner limit reached", description: `Only ${winnerTotal} winner${winnerTotal === 1 ? "" : "s"} can be selected.` });
                return current;
            }
            return [...current, participant];
        });
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

    const progressPercent = participantCap ? Math.min((participantTotal / participantCap) * 100, 100) : 0;

    return (
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8 animate-fade-up">
            <div className="premium-card rounded-2xl sm:rounded-3xl overflow-hidden">
                {/* Image Section */}
                <div className="relative h-48 sm:h-56 md:h-72 bg-neutral-900 flex items-center justify-center">
                    <Image
                        src={imageSrc}
                        alt={title ? `${title} giveaway image` : "Giveaway image"}
                        width={280}
                        height={280}
                        className="object-contain transform transition-transform duration-500 hover:scale-105 w-32 sm:w-40 md:w-56 h-32 sm:h-40 md:h-56"
                    />
                    {/* Status Badge */}
                    <div className={`absolute top-3 sm:top-4 right-3 sm:right-4 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm ${hasEnded ? 'bg-red-500/20 border-red-500/40' : !hasStarted ? 'bg-blue-500/20 border-blue-500/40' : 'bg-emerald-500/20 border-emerald-500/40'} border`}>
                        <span className={`font-semibold flex items-center gap-1 sm:gap-2 ${hasEnded ? 'text-red-400' : !hasStarted ? 'text-blue-300' : 'text-emerald-400'}`}>
                            {hasStarted && !hasEnded && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                            {hasEnded ? 'Ended' : !hasStarted ? 'Scheduled' : 'Live'}
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6 md:p-8">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">{title}</h1>
                    <p className="text-sm sm:text-base md:text-lg text-neutral-400 leading-relaxed mb-6 sm:mb-8">{description}</p>

                    {/* Countdown Timer */}
                    {hasStarted && !hasEnded && (
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
                                <UserIcon className="w-5 h-5" />
                                <span className="text-sm font-medium">Participants</span>
                            </div>
                            <span className="text-white font-bold">{participantTotal} / {participantCap || "\u221E"}</span>
                        </div>
                        <div className="h-3 bg-white/[0.05] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-red-600 to-red-500 rounded-full transition-all duration-500"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                        {participantCap > 0 && participantTotal >= participantCap && (
                            <p className="mt-2 text-sm text-emerald-400 font-medium">Giveaway is full!</p>
                        )}
                    </div>

                    {/* Prize */}
                    <div className="p-4 rounded-xl bg-red-600/5 border border-red-600/10 mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-red-600/10 flex items-center justify-center">
                                <TrophyIcon className="w-8 h-8" />
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
                                        <UserIcon className="w-5 h-5" />
                                        Participants ({participantTotal || 0})
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
                                            <TrophyIcon className="w-5 h-5" /> Winners
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
                                className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${!hasStarted || hasEnded || (participantCap && participantTotal >= participantCap)
                                    ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                                    : 'btn-gradient hover:shadow-glow-lg'
                                    }`}
                                onClick={handleEnterClick}
                                disabled={!hasStarted || hasEnded || isJoining || (participantCap && participantTotal >= participantCap)}
                            >
                                {!hasStarted ? "Giveaway Not Started" : hasEnded ? "Giveaway Ended" : isJoining ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="animate-spin rounded-full border-t-2 border-white h-5 w-5"></span>
                                        Processing...
                                    </span>
                                ) : (participantCap && participantTotal >= participantCap ? "Limit Reached" : "Enter Now")}
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
                                    className={`w-full sm:flex-1 py-4 rounded-xl font-semibold ${canPickWinners ? "btn-gradient" : "bg-neutral-800 text-neutral-500 cursor-not-allowed"}`}
                                    onClick={handleSetWinners}
                                    disabled={isLoading || !canPickWinners}
                                >
                                    {isLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="animate-spin rounded-full border-t-2 border-white h-5 w-5"></span>
                                            Selecting...
                                        </span>
                                    ) : hasEnded ? "Set Winners" : "Wait Until Ended"}
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
                        <div className="flex justify-center mb-4">
                            <TrophyIcon className="w-12 h-12" />
                        </div>
                        <DialogTitle className="text-2xl font-bold text-white">Selected Winners</DialogTitle>
                        <DialogDescription className="text-neutral-400">
                            Select {winnerTotal} winner{winnerTotal === 1 ? "" : "s"} from {participantTotal} participant{participantTotal === 1 ? "" : "s"}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                setWinnerMode("random");
                                setSelectedWinners([]);
                            }}
                            className={`py-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${winnerMode === "random" ? "bg-red-600 text-white border-red-500" : "bg-white/[0.03] text-neutral-400 border-white/10 hover:text-white"}`}
                        >
                            <Shuffle className="w-4 h-4" /> Random
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setWinnerMode("manual");
                                setSelectedWinners([]);
                            }}
                            className={`py-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${winnerMode === "manual" ? "bg-red-600 text-white border-red-500" : "bg-white/[0.03] text-neutral-400 border-white/10 hover:text-white"}`}
                        >
                            <ListChecks className="w-4 h-4" /> Manual
                        </button>
                    </div>
                    <div className="py-4 space-y-3">
                        {winnerMode === "random" ? (
                            <div className="p-4 rounded-xl bg-red-600/5 border border-red-600/10 flex gap-3">
                                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                                <p className="text-sm text-neutral-300 leading-relaxed">
                                    The backend will randomly draw winners from the participant list and lock this giveaway.
                                </p>
                            </div>
                        ) : (
                            <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                                {participants?.map((participant) => {
                                    const checked = selectedWinners.some(winner => winner._id === participant._id);
                                    return (
                                        <button
                                            type="button"
                                            key={participant._id}
                                            onClick={() => toggleManualWinner(participant)}
                                            className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${checked ? "bg-red-600/15 border-red-500/40" : "bg-white/[0.03] border-white/10 hover:border-white/20"}`}
                                        >
                                            <span className={`w-5 h-5 rounded border flex items-center justify-center ${checked ? "bg-red-600 border-red-500" : "border-white/20"}`}>
                                                {checked && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                            </span>
                                            <span>
                                                <span className="block text-white text-sm font-semibold">{participant.name || "Unnamed participant"}</span>
                                                <span className="block text-neutral-500 text-xs">{participant.email || participant.phone || participant._id}</span>
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        {selectedWinners.length > 0 && (
                            <div className="text-xs text-neutral-500 text-center">
                                {selectedWinners.length} / {winnerTotal} selected
                            </div>
                        )}
                    </div>
                    {winnerMode === "manual" && selectedWinners.length > 0 && (
                        <div className="space-y-2">
                            {selectedWinners.map((winner, index) => (
                                <div key={winner._id} className="flex items-center gap-3 p-3 rounded-xl bg-red-600/5 border border-red-600/10">
                                    <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-sm">
                                        {index + 1}
                                    </div>
                                    <span className="text-white font-medium">{winner.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="flex gap-3">
                        <button className="flex-1 py-3 rounded-xl btn-gradient font-semibold disabled:opacity-50" onClick={handleConfirmWinners} disabled={isLoading || (winnerMode === "manual" && selectedWinners.length !== winnerTotal)}>
                            {isLoading ? "Saving..." : "Confirm Winners"}
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
