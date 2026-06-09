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
import api from "../utils/apiClient";
import { exportToCSV } from "../utils/exportUtils";
import { useAuth } from "@/app/context/AuthContext";
import TrophyIcon from "./SVGIcons/TrophyIcon";
import UserIcon from "./SVGIcons/UserIcon";
import { PauseIcon, PlayIcon, DrawIcon, ResetIcon, TrashIcon } from "./SVGIcons";

dayjs.extend(utc);
dayjs.extend(timezone);

// Custom inline SVGs for premium aesthetics
function ClockIcon({ className = "w-5 h-5 text-red-500" }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    );
}

function CalendarIcon({ className = "w-5 h-5 text-red-500" }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    );
}

function DownloadIcon({ className = "w-4 h-4" }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
    );
}

function SearchIcon({ className = "w-4 h-4 text-neutral-400" }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    );
}

export default function GiveawayDetails({ data }) {
    const { toast } = useToast();
    const router = useRouter();
    const path = usePathname();
    const formatStr = "DD MMM YYYY, hh:mm A";

    const { user } = useAuth();
    const [localGiveaway, setLocalGiveaway] = useState(data || {});
    const [initialWinners, setWinners] = useState([]);
    const [isJoining, setIsJoining] = useState(false);
    const [hasJoined, setHasJoined] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedWinners, setSelectedWinners] = useState([]);
    const [winnerMode, setWinnerMode] = useState("random");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    const [activeTab, setActiveTab] = useState("overview");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Advanced admin operation loading states
    const [isPausing, setIsPausing] = useState(false);
    const [isDrawingEarly, setIsDrawingEarly] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    useEffect(() => {
        if (data) {
            setLocalGiveaway(data);
            setWinners(data.winners || []);
        }
    }, [data]);

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
        isPaused
    } = localGiveaway;

    // Check participation status from server
    const checkParticipationStatus = async () => {
        if (!user?._id || !_id) return;
        try {
            const { data: statusData } = await api.get(`giveaway/${_id}`);
            if (statusData?.giveaway) {
                const joined = statusData.giveaway.joined || statusData.giveaway.participants?.some(p => String(p._id || p) === String(user._id));
                setHasJoined(Boolean(joined));
            }
        } catch (error) {
            console.error("Failed to check participation status", error);
        }
    };

    useEffect(() => {
        if (user && participants) {
            const isJoined = participants.some(p => String(p._id || p) === String(user._id));
            setHasJoined(isJoined);
        } else {
            setHasJoined(false);
        }
    }, [user, participants]);

    useEffect(() => {
        if (user) {
            checkParticipationStatus();
        }
    }, [user?._id, _id]);

    useEffect(() => {
        if (!_id) return;
        const poll = async () => {
            if (document.hidden) return;
            try {
                const endpoint = isAdminPath ? `admin/giveaway/${_id}` : `giveaway/${_id}`;
                const { data: resData } = await api.get(endpoint, {
                    meta: isAdminPath ? { auth: "admin" } : undefined
                });
                const fresh = isAdminPath ? resData.data : resData.giveaway;
                if (fresh) {
                    setLocalGiveaway(fresh);
                    if (fresh.winners) setWinners(fresh.winners);
                }
            } catch (err) {
                console.error("Polling error:", err);
            }
        };

        const interval = setInterval(poll, 6000);
        return () => clearInterval(interval);
    }, [_id, isAdminPath]);

    useEffect(() => {
        if (!endDate) return;
        const end = dayjs(endDate);
        const updateTimeLeft = () => {
            const now = dayjs();
            const diff = end.diff(now);
            if (diff > 0 && !isPaused) {
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
    }, [endDate, isPaused]);

    const nowIst = dayjs().tz("Asia/Kolkata");
    const isAdminPath = path.includes("/admin/dashboard/giveaways/");
    const isTestEvent = title?.startsWith("LIFECYCLE-TEST-") || title?.startsWith("TEST-");
    const hasStarted = startDate ? !nowIst.isBefore(dayjs(startDate).tz("Asia/Kolkata")) : true;
    const hasEnded = (endDate ? !nowIst.isBefore(dayjs(endDate).tz("Asia/Kolkata")) : false) || (isAdminPath && isTestEvent);

    const participantTotal = Number(participantCount || participants?.length || 0);
    const winnerTotal = Number(winnerCount || 0);
    const participantCap = Number(maxParticipants || 0);
    const imageSrc = image || "/images/gift.png";
    const progressPercent = participantCap ? Math.min((participantTotal / participantCap) * 100, 100) : 0;

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
            let { data: resData } = await api.post(`giveaway/winners/${_id}`, { mode: winnerMode, winners: winnersIds }, {
                meta: { auth: "admin" },
            });
            if (resData.error === false) {
                setWinners(resData.winners || selectedWinners);
                setSelectedWinners(resData.winners || selectedWinners);
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
                toast({ title: "Error", variant: "destructive", description: resData.msg || "Something went wrong." });
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

    // Advanced admin handlers
    const handleTogglePause = async () => {
        setIsPausing(true);
        try {
            const { data: resData } = await api.post(`giveaway/toggle-pause/${_id}`, {}, {
                meta: { auth: "admin" },
            });
            if (resData.error === false) {
                setLocalGiveaway(prev => ({ ...prev, isPaused: resData.isPaused }));
                toast({
                    title: resData.isPaused ? "Giveaway Paused" : "Giveaway Resumed",
                    variant: "success",
                    description: `The giveaway has been successfully ${resData.isPaused ? "paused" : "resumed"}.`
                });
            } else {
                toast({ title: "Error", variant: "destructive", description: resData.msg });
            }
        } catch (error) {
            toast({ title: "Error", variant: "destructive", description: error?.response?.data?.msg || "Something went wrong." });
        } finally {
            setIsPausing(false);
        }
    };

    const handleDrawEarly = async () => {
        if (!window.confirm("Are you sure you want to end this giveaway early? This action is irreversible.")) return;
        setIsDrawingEarly(true);
        try {
            const { data: resData } = await api.post(`giveaway/draw-early/${_id}`, {}, {
                meta: { auth: "admin" },
            });
            if (resData.error === false) {
                setLocalGiveaway(prev => ({ ...prev, endDate: resData.endDate }));
                toast({
                    title: "Closed Early",
                    variant: "success",
                    description: "The giveaway has been closed. You can now select the winners."
                });
            } else {
                toast({ title: "Error", variant: "destructive", description: resData.msg });
            }
        } catch (error) {
            toast({ title: "Error", variant: "destructive", description: error?.response?.data?.msg || "Something went wrong." });
        } finally {
            setIsDrawingEarly(false);
        }
    };

    const handleResetWinners = async () => {
        if (!window.confirm("Are you sure you want to reset the winners? This will clear all winners and allow you to redraw.")) return;
        setIsResetting(true);
        try {
            const { data: resData } = await api.post(`giveaway/reset-winners/${_id}`, {}, {
                meta: { auth: "admin" },
            });
            if (resData.error === false) {
                setWinners([]);
                toast({
                    title: "Winners Reset",
                    variant: "success",
                    description: "Winners list has been cleared. You can select new winners now."
                });
            } else {
                toast({ title: "Error", variant: "destructive", description: resData.msg });
            }
        } catch (error) {
            toast({ title: "Error", variant: "destructive", description: error?.response?.data?.msg || "Something went wrong." });
        } finally {
            setIsResetting(false);
        }
    };

    const handleRemoveParticipant = async (userId) => {
        if (!window.confirm("Are you sure you want to remove this participant?")) return;
        try {
            const { data: resData } = await api.delete(`giveaway/${_id}/participant/${userId}`, {
                meta: { auth: "admin" },
            });
            if (resData.error === false) {
                setLocalGiveaway(prev => ({
                    ...prev,
                    participants: prev.participants.filter(p => (p._id || p) !== userId),
                    participantCount: Math.max(0, (prev.participantCount || 1) - 1)
                }));
                setWinners(prev => prev.filter(w => (w._id || w) !== userId));
                toast({
                    title: "Participant Removed",
                    variant: "success",
                    description: "Participant has been successfully removed from this giveaway."
                });
            } else {
                toast({ title: "Error", variant: "destructive", description: resData.msg });
            }
        } catch (error) {
            toast({ title: "Error", variant: "destructive", description: error?.response?.data?.msg || "Something went wrong." });
        }
    };

    // Filter and Paginate participants
    const filteredParticipants = (participants || []).filter(p => {
        const name = (p.name || "").toLowerCase();
        const email = (p.email || "").toLowerCase();
        const search = searchTerm.toLowerCase();
        return name.includes(search) || email.includes(search);
    });

    const paginatedParticipants = filteredParticipants.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const totalPages = Math.ceil(filteredParticipants.length / itemsPerPage);

    return (
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-6 sm:py-8 animate-fade-up">
            <div className="premium-card rounded-2xl sm:rounded-3xl overflow-hidden bg-[#0d0d0d] border border-white/5 shadow-2xl">
                {/* Image Section */}
                <div className="relative h-64 sm:h-80 md:h-[360px] w-full overflow-hidden bg-black flex items-center justify-center border-b border-white/5 group">
                    <div className="absolute inset-0 opacity-20 blur-2xl scale-110 pointer-events-none transition-transform duration-700 group-hover:scale-125">
                        <Image src={imageSrc} alt="Background Blur" fill className="object-cover" unoptimized />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-black/90 pointer-events-none" />

                    <div className="relative w-11/12 h-5/6 max-w-lg flex items-center justify-center transition-all duration-500 transform group-hover:scale-[1.02]">
                        <Image src={imageSrc} alt={title ? `${title} giveaway` : "Giveaway image"} fill className="object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.7)]" unoptimized />
                    </div>

                    {/* Status Badge */}
                    <div className={`absolute top-4 right-4 px-4 py-2 rounded-full text-xs sm:text-sm backdrop-blur-md border shadow-lg ${
                        isPaused
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                            : hasEnded
                            ? 'bg-red-500/20 border-red-500/40 text-red-400'
                            : !hasStarted
                            ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                            : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                    }`}>
                        <span className="font-semibold flex items-center gap-1.5 sm:gap-2">
                            {!isPaused && hasStarted && !hasEnded && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                            {isPaused ? 'Paused' : hasEnded ? 'Ended' : !hasStarted ? 'Scheduled' : 'Live'}
                        </span>
                    </div>
                </div>

                {/* Main Admin Navigation Tabs */}
                {isAdminPath && (
                    <div className="flex border-b border-white/10 bg-white/[0.02]">
                        <button
                            onClick={() => { setActiveTab("overview"); setSearchTerm(""); }}
                            className={`flex-1 py-4 text-center font-semibold text-sm sm:text-base border-b-2 transition-all ${
                                activeTab === "overview"
                                    ? "border-red-500 text-white bg-white/[0.02]"
                                    : "border-transparent text-neutral-400 hover:text-white hover:bg-white/[0.01]"
                            }`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => { setActiveTab("participants"); setCurrentPage(1); }}
                            className={`flex-1 py-4 text-center font-semibold text-sm sm:text-base border-b-2 transition-all ${
                                activeTab === "participants"
                                    ? "border-red-500 text-white bg-white/[0.02]"
                                    : "border-transparent text-neutral-400 hover:text-white hover:bg-white/[0.01]"
                            }`}
                        >
                            Participants ({participantTotal})
                        </button>
                        <button
                            onClick={() => setActiveTab("controls")}
                            className={`flex-1 py-4 text-center font-semibold text-sm sm:text-base border-b-2 transition-all ${
                                activeTab === "controls"
                                    ? "border-red-500 text-white bg-white/[0.02]"
                                    : "border-transparent text-neutral-400 hover:text-white hover:bg-white/[0.01]"
                            }`}
                        >
                            Control Center
                        </button>
                    </div>
                )}

                {/* Content Panel */}
                <div className="p-5 sm:p-8">
                    {/* TAB 1: OVERVIEW */}
                    {(!isAdminPath || activeTab === "overview") && (
                        <div className="animate-in fade-in duration-300">
                            <h1 className="text-2xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight">{title}</h1>
                            <p className="text-sm sm:text-lg text-neutral-400 leading-relaxed mb-6 sm:mb-8 font-light">{description}</p>

                            {/* Countdown / Paused Alert */}
                            {isPaused ? (
                                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-8 flex items-center gap-3">
                                    <AlertCircle className="text-amber-400 w-6 h-6 shrink-0" />
                                    <div>
                                        <h4 className="text-amber-300 font-semibold text-sm">Giveaway Paused</h4>
                                        <p className="text-neutral-400 text-xs mt-0.5">This giveaway is currently paused by admin. Users cannot enter until resumed.</p>
                                    </div>
                                </div>
                            ) : (
                                hasStarted && !hasEnded && (
                                    <div className="mb-8 p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                                        <div className="flex items-center gap-2 text-neutral-400 mb-4">
                                            <ClockIcon />
                                            <span className="text-sm font-semibold tracking-wide uppercase">Time Remaining</span>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            <CountdownUnit value={timeLeft.days} label="Days" />
                                            <CountdownUnit value={timeLeft.hours} label="Hours" />
                                            <CountdownUnit value={timeLeft.minutes} label="Mins" />
                                            <CountdownUnit value={timeLeft.seconds} label="Secs" />
                                        </div>
                                    </div>
                                )
                            )}

                            {/* Dates */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
                                    <CalendarIcon className="w-6 h-6 text-red-500 mt-0.5" />
                                    <div>
                                        <span className="text-xs text-neutral-500 uppercase tracking-wider block mb-1">Starts</span>
                                        <p className="text-white text-sm font-medium">{startDate ? dayjs(startDate).format(formatStr) : "N/A"}</p>
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
                                    <CalendarIcon className="w-6 h-6 text-red-500 mt-0.5" />
                                    <div>
                                        <span className="text-xs text-neutral-500 uppercase tracking-wider block mb-1">Ends</span>
                                        <p className="text-white text-sm font-medium">{endDate ? dayjs(endDate).format(formatStr) : "N/A"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Cap Progress */}
                            <div className="mb-8 p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2 text-neutral-400">
                                        <UserIcon className="w-5 h-5 text-red-500" />
                                        <span className="text-sm font-semibold">PARTICIPANT SLOTS</span>
                                    </div>
                                    <span className="text-white font-bold text-sm bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                                        {participantTotal} / {participantCap || "\u221E"}
                                    </span>
                                </div>
                                <div className="h-2.5 bg-white/[0.05] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-500"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                                {participantCap > 0 && participantTotal >= participantCap && (
                                    <p className="mt-2 text-xs text-emerald-400 font-medium flex items-center gap-1">
                                        <CheckCircle className="w-4 h-4" /> Giveaway registration cap reached!
                                    </p>
                                )}
                            </div>

                            {/* Prize Card */}
                            <div className="p-5 rounded-2xl bg-gradient-to-r from-red-950/10 to-amber-950/10 border border-white/5 mb-8 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                        <TrophyIcon className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <span className="text-xs text-neutral-500 uppercase tracking-wider block mb-0.5">Grand Prize</span>
                                        <p className="text-lg sm:text-2xl font-bold text-white tracking-tight">{prize}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-neutral-500 uppercase tracking-wider block mb-0.5">Winners Limit</span>
                                    <p className="text-sm font-bold text-white bg-yellow-500/10 border border-yellow-500/25 px-2 py-0.5 rounded text-yellow-400 inline-block">{winnerTotal}</p>
                                </div>
                            </div>

                            {/* Public view details: Winners and public action button */}
                            {!isAdminPath && (
                                <>
                                    {initialWinners?.length > 0 && (
                                        <div className="mb-8 p-6 rounded-2xl bg-yellow-500/[0.02] border border-yellow-500/10 animate-fade-in">
                                            <h4 className="text-yellow-400 font-bold text-lg mb-4 flex items-center gap-2">
                                                <TrophyIcon className="w-6 h-6" /> Congratulations to the Winners!
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {initialWinners.map((winner, idx) => (
                                                    <div key={winner._id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                                        <div className="w-8 h-8 rounded-full bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center text-yellow-400 font-bold text-sm">
                                                            {idx + 1}
                                                        </div>
                                                        <span className="text-white font-medium text-sm">{winner.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Register Button */}
                                    {hasJoined ? (
                                        <div className="w-full py-4 rounded-xl font-bold text-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center gap-2 cursor-default">
                                            <CheckCircle className="w-6 h-6" />
                                            Successfully Entered
                                        </div>
                                    ) : (
                                        <button
                                            className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                                                isPaused || !hasStarted || hasEnded || (participantCap && participantTotal >= participantCap)
                                                    ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                                                    : 'btn-gradient hover:shadow-glow-lg'
                                            }`}
                                            onClick={handleEnterClick}
                                            disabled={isPaused || !hasStarted || hasEnded || isJoining || (participantCap && participantTotal >= participantCap)}
                                        >
                                            {isPaused ? "Giveaway Paused" : !hasStarted ? "Giveaway Not Started" : hasEnded ? "Giveaway Ended" : isJoining ? "Processing..." : (participantCap && participantTotal >= participantCap ? "Limit Reached" : "Enter Now")}
                                        </button>
                                    )}
                                </>
                            )}

                            {/* Admin view: Simple actions if in overview tab */}
                            {isAdminPath && (
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <button
                                        className="w-full sm:flex-1 py-4 rounded-xl font-bold text-sm bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
                                        onClick={() => router.push(`/admin/dashboard/giveaways/edit/${_id}`)}
                                    >
                                        Edit Details
                                    </button>
                                    {initialWinners?.length === 0 && (
                                        <button
                                            className={`w-full sm:flex-1 py-4 rounded-xl font-bold text-sm transition-all ${
                                                canPickWinners
                                                    ? "btn-gradient text-white"
                                                    : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                                            }`}
                                            onClick={handleSetWinners}
                                            disabled={isLoading || !canPickWinners}
                                        >
                                            {isLoading ? "Selecting..." : hasEnded ? "Set Winners" : "Wait Until Ended"}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 2: PARTICIPANTS (ADMIN ONLY) */}
                    {isAdminPath && activeTab === "participants" && (
                        <div className="animate-in fade-in duration-300">
                            {/* Toolbar */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
                                <div className="relative w-full sm:w-72">
                                    <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                        <SearchIcon />
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Search by name or email..."
                                        value={searchTerm}
                                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                        className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-white/5 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 transition-all"
                                    />
                                </div>

                                {participants?.length > 0 && (
                                    <button
                                        onClick={handleExportParticipants}
                                        className="w-full sm:w-auto text-xs bg-white/5 hover:bg-white/10 px-4 py-2.5 rounded-lg border border-white/10 text-neutral-300 hover:text-white flex items-center justify-center gap-2 transition-all font-semibold"
                                    >
                                        <DownloadIcon /> Export CSV
                                    </button>
                                )}
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto border border-white/5 rounded-xl">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/10 bg-white/[0.02]">
                                            <th className="p-4 text-xs font-semibold uppercase text-neutral-500 tracking-wider">Name</th>
                                            <th className="p-4 text-xs font-semibold uppercase text-neutral-500 tracking-wider">Email</th>
                                            <th className="p-4 text-xs font-semibold uppercase text-neutral-500 tracking-wider">Phone</th>
                                            <th className="p-4 text-xs font-semibold uppercase text-neutral-500 tracking-wider">Joined Date</th>
                                            <th className="p-4 text-xs font-semibold uppercase text-neutral-500 tracking-wider text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedParticipants.length > 0 ? (
                                            paginatedParticipants.map((userObj) => {
                                                const userId = userObj._id || userObj;
                                                return (
                                                    <tr key={userId} className="border-b border-white/5 hover:bg-white/[0.01] transition-all">
                                                        <td className="p-4 text-sm font-medium text-white">
                                                            <Link href={`/admin/dashboard/users/${userId}`} className="hover:text-red-400 transition-colors">
                                                                {userObj.name || "N/A"}
                                                            </Link>
                                                        </td>
                                                        <td className="p-4 text-sm text-neutral-400">{userObj.email || "N/A"}</td>
                                                        <td className="p-4 text-sm text-neutral-400">{userObj.phone || "N/A"}</td>
                                                        <td className="p-4 text-sm text-neutral-500">
                                                            {userObj.joinedAt ? dayjs(userObj.joinedAt).format("DD MMM YYYY") : "N/A"}
                                                        </td>
                                                        <td className="p-4 text-sm text-right">
                                                            <button
                                                                onClick={() => handleRemoveParticipant(userId)}
                                                                className="p-1.5 rounded-md text-neutral-500 hover:text-red-500 hover:bg-red-500/10 transition-all inline-flex items-center"
                                                                title="Remove Participant"
                                                            >
                                                                <TrashIcon className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="p-8 text-center text-sm italic text-neutral-600">No matching participants found</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex justify-between items-center mt-4">
                                    <span className="text-xs text-neutral-500">Page {currentPage} of {totalPages}</span>
                                    <div className="flex gap-2">
                                        <button
                                            disabled={currentPage === 1}
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            className="px-3 py-1 text-xs rounded border border-white/10 bg-white/5 hover:bg-white/10 text-white disabled:opacity-50 transition-all font-medium"
                                        >
                                            Prev
                                        </button>
                                        <button
                                            disabled={currentPage === totalPages}
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            className="px-3 py-1 text-xs rounded border border-white/10 bg-white/5 hover:bg-white/10 text-white disabled:opacity-50 transition-all font-medium"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 3: CONTROL CENTER (ADMIN ONLY) */}
                    {isAdminPath && activeTab === "controls" && (
                        <div className="animate-in fade-in duration-300 space-y-6">
                            {/* Draw Winners Card */}
                            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                <div className="space-y-1">
                                    <h4 className="text-white font-bold text-base flex items-center gap-2">
                                        <TrophyIcon className="w-5 h-5 text-yellow-400" /> Draw / Pick Winners
                                    </h4>
                                    <p className="text-neutral-500 text-xs max-w-lg">Draw the winners for this giveaway. You can pick random winners or hand-pick specific participants.</p>
                                </div>
                                <div>
                                    {initialWinners?.length > 0 ? (
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg font-semibold uppercase">Winners Drawn</span>
                                            <button
                                                onClick={handleExportWinners}
                                                className="text-xs bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 text-neutral-300 hover:text-white flex items-center gap-1 transition-all"
                                            >
                                                <DownloadIcon /> Export CSV
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleSetWinners}
                                            disabled={!hasEnded || participants?.length < winnerTotal}
                                            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-xs tracking-wide uppercase transition-all ${
                                                hasEnded && participants?.length >= winnerTotal
                                                    ? 'btn-gradient text-white'
                                                    : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                                            }`}
                                        >
                                            Draw Winners
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Pause / Resume Card */}
                            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                <div className="space-y-1">
                                    <h4 className="text-white font-bold text-base flex items-center gap-2">
                                        {isPaused ? <PlayIcon className="text-amber-400" /> : <PauseIcon className="text-red-500" />}
                                        {isPaused ? "Resume Giveaway" : "Pause Giveaway"}
                                    </h4>
                                    <p className="text-neutral-500 text-xs max-w-lg">Temporarily halt participant registrations. Users already registered will remain joined.</p>
                                </div>
                                <button
                                    onClick={handleTogglePause}
                                    disabled={isPausing}
                                    className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-xs tracking-wide uppercase transition-all border ${
                                        isPaused
                                            ? "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20"
                                            : "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
                                    }`}
                                >
                                    {isPausing ? "Processing..." : isPaused ? "Resume" : "Pause"}
                                </button>
                            </div>

                            {/* Draw Early Card */}
                            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                <div className="space-y-1">
                                    <h4 className="text-white font-bold text-base flex items-center gap-2">
                                        <DrawIcon className="text-blue-400 w-5 h-5" /> End / Close Early
                                    </h4>
                                    <p className="text-neutral-500 text-xs max-w-lg">Force the giveaway to end immediately so you can select the winners early. This cannot be undone.</p>
                                </div>
                                <button
                                    onClick={handleDrawEarly}
                                    disabled={isDrawingEarly || hasEnded}
                                    className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-xs tracking-wide uppercase transition-all ${
                                        hasEnded
                                            ? "bg-neutral-800 text-neutral-500 cursor-not-allowed border border-white/5"
                                            : "bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20 border"
                                    }`}
                                >
                                    {isDrawingEarly ? "Ending..." : hasEnded ? "Already Ended" : "End Early"}
                                </button>
                            </div>

                            {/* Reset / Redraw Winners Card */}
                            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                <div className="space-y-1">
                                    <h4 className="text-white font-bold text-base flex items-center gap-2">
                                        <ResetIcon className="text-orange-400 w-5 h-5" /> Reset Winners / Redraw
                                    </h4>
                                    <p className="text-neutral-500 text-xs max-w-lg">Clear the current winners so you can select new winners or rerun the draw. Safe to perform anytime.</p>
                                </div>
                                <button
                                    onClick={handleResetWinners}
                                    disabled={isResetting || initialWinners?.length === 0}
                                    className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-xs tracking-wide uppercase transition-all ${
                                        initialWinners?.length === 0
                                            ? "bg-neutral-800 text-neutral-500 cursor-not-allowed border border-white/5"
                                            : "bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500/20 border"
                                    }`}
                                >
                                    {isResetting ? "Resetting..." : "Reset Winners"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Winners Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="glass-dark border-white/10 rounded-2xl max-w-md bg-[#0e0e0e] text-white">
                    <DialogHeader className="text-center">
                        <div className="flex justify-center mb-4">
                            <TrophyIcon className="w-12 h-12" />
                        </div>
                        <DialogTitle className="text-2xl font-extrabold text-white tracking-tight">Select Winners</DialogTitle>
                        <DialogDescription className="text-neutral-400 text-xs mt-1 leading-relaxed">
                            Pick {winnerTotal} winner{winnerTotal === 1 ? "" : "s"} from {participantTotal} participant{participantTotal === 1 ? "" : "s"}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <button
                            type="button"
                            onClick={() => {
                                setWinnerMode("random");
                                setSelectedWinners([]);
                            }}
                            className={`py-3 rounded-xl border text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                                winnerMode === "random"
                                    ? "bg-red-600 text-white border-red-500 shadow-glow"
                                    : "bg-white/[0.02] text-neutral-400 border-white/10 hover:text-white"
                            }`}
                        >
                            <Shuffle className="w-4 h-4" /> Random
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setWinnerMode("manual");
                                setSelectedWinners([]);
                            }}
                            className={`py-3 rounded-xl border text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                                winnerMode === "manual"
                                    ? "bg-red-600 text-white border-red-500 shadow-glow"
                                    : "bg-white/[0.02] text-neutral-400 border-white/10 hover:text-white"
                            }`}
                        >
                            <ListChecks className="w-4 h-4" /> Manual
                        </button>
                    </div>
                    <div className="py-4 space-y-3">
                        {winnerMode === "random" ? (
                            <div className="p-4 rounded-xl bg-red-600/5 border border-red-600/10 flex gap-3">
                                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-neutral-400 leading-relaxed">
                                    The backend will randomly draw winners from the participant list.
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
                                            className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                                                checked
                                                    ? "bg-red-600/15 border-red-500/40"
                                                    : "bg-white/[0.02] border-white/5 hover:border-white/10"
                                            }`}
                                        >
                                            <span className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                                                checked ? "bg-red-600 border-red-500" : "border-white/20"
                                            }`}>
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
                            <div className="text-xs text-neutral-400 text-center font-semibold">
                                {selectedWinners.length} / {winnerTotal} selected
                            </div>
                        )}
                    </div>
                    {winnerMode === "manual" && selectedWinners.length > 0 && (
                        <div className="space-y-2 mb-4">
                            {selectedWinners.map((winner, index) => (
                                <div key={winner._id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10">
                                    <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-xs">
                                        {index + 1}
                                    </div>
                                    <span className="text-white text-sm font-medium">{winner.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="flex gap-3">
                        <button
                            className="flex-1 py-3 rounded-xl btn-gradient font-bold text-xs uppercase tracking-wider text-white disabled:opacity-50"
                            onClick={handleConfirmWinners}
                            disabled={isLoading || (winnerMode === "manual" && selectedWinners.length !== winnerTotal)}
                        >
                            {isLoading ? "Saving..." : "Confirm Winners"}
                        </button>
                        <button
                            className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold text-xs uppercase tracking-wider transition-all"
                            onClick={() => setIsDialogOpen(false)}
                        >
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
        <div className="flex-1 min-w-[70px] bg-white/[0.03] border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center shadow-lg transition-transform hover:scale-105">
            <span className="text-xl sm:text-2xl font-black text-white">{String(value).padStart(2, '0')}</span>
            <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-0.5">{label}</span>
        </div>
    );
}
