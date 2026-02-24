"use client"
import Image from "next/image"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    LayoutDashboard,
    ChevronRight,
    Gift,
    BadgePlus,
    LogOut,
    Calendar,
    Clock,
    Trophy,
    Target,
    LucideImage,
    Sparkles,
    ShieldCheck,
    Info
} from "lucide-react";
import { Button } from "../../../../components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../../../../components/ui/card"
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle } from "lucide-react";
import { TimePicker } from "@/app/components/TimePicker";
import withAdminAuth from "../../../components/withAdminAuth"
import { useRouter } from "next/navigation";
import api from "@/app/utils/apiClient";
import { useAuth } from "@/app/context/AuthContext";

function AddGiveawayPage() {
    let [title, setTitle] = useState("");
    let [description, setDescription] = useState("");
    let [image, setImage] = useState("");
    let [startDate, setStartDate] = useState("");
    let [endDate, setendDate] = useState("");
    let [startTime, setStartTime] = useState("");
    let [endTime, setEndTime] = useState("");
    let [uploadProgress, setUploadProgress] = useState(null);
    let [winnerCount, setwinnerCount] = useState("");
    let [maxParticipants, setMaxParticipants] = useState("");
    let [prize, setPrize] = useState("");
    let [prizeValue, setPrizeValue] = useState("");
    const { toast } = useToast();
    const router = useRouter();
    const { logoutAdmin } = useAuth();
    const containerRef = useRef(null);

    // Cursor glow effect
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!containerRef.current) return;
            const { clientX, clientY } = e;
            const { left, top } = containerRef.current.getBoundingClientRect();
            containerRef.current.style.setProperty('--x', `${clientX - left}px`);
            containerRef.current.style.setProperty('--y', `${clientY - top}px`);
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    let uploadImage = async (image) => {
        try {
            setUploadProgress(0);
            let form = new FormData();
            form.append("image", image)
            let { data } = await api.post(`upload`, form, {
                meta: { auth: "admin" },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(percent);
                    }
                }
            })
            if (data.error == false) {
                setImage(data.url)
                setUploadProgress(null);
                toast({
                    title: "Success",
                    description: (
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="text-green-500 w-5 h-5" />
                            <span>Vault upload completed successfully.</span>
                        </div>
                    )
                });
            } else {
                setUploadProgress(null);
                toast({
                    title: "Security Breach",
                    variant: "destructive",
                    description: (
                        <div className="flex items-center space-x-2">
                            <XCircle className="text-white w-5 h-5" />
                            <span>{data.msg}</span>
                        </div>
                    )
                });
            }
        } catch (error) {
            setUploadProgress(null);
            toast({
                title: "Critcal Failure",
                variant: "destructive",
                description: "Image processing server is currently unreachable."
            });
        }
    }

    let handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let formdata = {
                title: title,
                description: description,
                image: image,
                prize: prize,
                prizeValue: Number(prizeValue),
                winnerCount: winnerCount,
                maxParticipants: maxParticipants,
                startDate: `${startDate} ${startTime}`,
                endDate: `${endDate} ${endTime}`,
            }
            const { data } = await api.post(`giveaway/create-giveaway`, formdata, {
                meta: { auth: "admin" },
            });
            if (data.error == false) {
                toast({
                    title: "Mission Successful",
                    description: (
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="text-green-500 w-5 h-5" />
                            <span>Giveaway event has been initialized.</span>
                        </div>
                    )
                });
                router.push('/admin/dashboard/giveaways');
            } else {
                toast({
                    title: "System Rejection",
                    variant: "destructive",
                    description: (
                        <div className="flex items-center space-x-2">
                            <XCircle className="text-white w-5 h-5" />
                            <span>{data.msg}</span>
                        </div>
                    )
                });
            }
        } catch (error) {
            toast({
                title: "Error Detected",
                variant: "destructive",
                description: "An unexpected error occurred during transmission."
            });
        }
    };

    return (
        <div ref={containerRef} className="flex flex-col min-h-screen bg-black relative overflow-hidden cursor-glow-container">
            {/* Background elements */}
            <div className="absolute inset-0 section-gradient opacity-40 pointer-events-none" />
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/5 rounded-full blur-[120px] pointer-events-none animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />

            <div className="flex-col space-y-8 p-6 md:p-10 relative z-10 overflow-y-auto max-h-screen custom-scrollbar">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-slide-down">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-xl shadow-red-900/20 border border-red-500/20 group">
                            <BadgePlus className="text-white w-7 h-7 group-hover:scale-110 transition-transform" />
                        </div>
                        <div>
                            <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-white uppercase italic">
                                Initialize <span className="text-gradient">Giveaway</span>
                            </h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest">
                                    Event Creation Protocol Active
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/admin/dashboard')}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-300 text-neutral-400 hover:text-white font-bold text-xs uppercase tracking-widest"
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            <span>Dashboard</span>
                        </button>
                        <button
                            onClick={async () => {
                                await logoutAdmin();
                                router.push('/admin/');
                            }}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-red-600/10 hover:border-red-600/40 transition-all duration-300 text-neutral-400 hover:text-red-400 font-bold text-xs uppercase tracking-widest group"
                        >
                            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            <span>Terminate</span>
                        </button>
                    </div>
                </div>

                {/* Main Form Area */}
                <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-12 animate-fade-in" style={{ animationDelay: '0.1s' }}>

                    {/* Media & Essential Config */}
                    <div className="lg:col-span-5 space-y-6">
                        <Card className="border border-white/[0.06] bg-white/[0.02] rounded-3xl overflow-hidden shadow-2xl hover:bg-white/[0.04] transition-all duration-500 group">
                            <CardHeader className="border-b border-white/[0.04] bg-white/[0.01] py-6 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-red-600/[0.02] to-red-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                <CardTitle className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-widest">
                                    <LucideImage className="w-4 h-4 text-red-500" />
                                    Visual Identity
                                </CardTitle>
                                <CardDescription className="text-neutral-500 text-[10px] uppercase font-bold tracking-tighter">Event Promotional Display</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="space-y-6">
                                    <div className="relative group rounded-2xl overflow-hidden border border-white/[0.08] hover:border-red-600/40 hover:shadow-[0_0_20px_rgba(220,38,38,0.1)] transition-all aspect-video flex items-center justify-center bg-black/40 shadow-inner group-hover:bg-black/60">
                                        {image ? (
                                            <Image
                                                src={image}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-700"
                                                alt="Giveaway Preview"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center gap-3 text-neutral-600 group-hover:text-red-500 transition-all duration-500">
                                                <div className="w-16 h-16 rounded-full bg-white/[0.02] flex items-center justify-center group-hover:scale-110 group-hover:bg-red-600/10 transition-all">
                                                    <Gift className="w-10 h-10 stroke-[1.5]" />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Deploy Media Asset</span>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => uploadImage(e.target.files[0])}
                                            className="absolute inset-0 opacity-0 cursor-pointer z-20"
                                        />
                                        {image && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                <div className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest">
                                                    Swap Media Content
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {uploadProgress !== null && (
                                        <div className="space-y-2 px-1">
                                            <div className="flex justify-between text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                                                <span className="flex items-center gap-2">
                                                    <span className="flex h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />
                                                    Syncing to Cloud
                                                </span>
                                                <span className="text-red-500">{uploadProgress}%</span>
                                            </div>
                                            <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-red-600 to-orange-600 shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-all duration-300"
                                                    style={{ width: `${uploadProgress}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/[0.04] flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                        </div>
                                        <p className="text-[10px] text-neutral-500 font-medium leading-relaxed">
                                            High-definition 16:9 images are recommended for optimal cross-platform presentation. Current limit is <span className="text-white">5MB</span> per asset.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Event Metadata (Secondary) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                            <div className="premium-card p-6 md:p-8 rounded-[2rem] border border-white/[0.06] bg-white/[0.02] space-y-4 hover:bg-white/[0.04] transition-all duration-300">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                                        <Trophy className="w-4 h-4 text-amber-500" />
                                    </div>
                                    <span className="text-[10px] md:text-xs font-black text-neutral-600 uppercase tracking-widest">Winner Slots</span>
                                </div>
                                <Input
                                    id="winners"
                                    type="number"
                                    min="1"
                                    value={winnerCount}
                                    onChange={(e) => setwinnerCount(e.target.value)}
                                    placeholder="01"
                                    className="premium-input h-14 px-5 bg-white/[0.01] border-white/[0.08] text-white rounded-2xl font-bold text-xl placeholder:text-neutral-800 focus:bg-white/[0.03] transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    required
                                />
                            </div>
                            <div className="premium-card p-6 md:p-8 rounded-[2rem] border border-white/[0.06] bg-white/[0.02] space-y-4 hover:bg-white/[0.04] transition-all duration-300">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                                        <Target className="w-4 h-4 text-blue-500" />
                                    </div>
                                    <span className="text-[10px] md:text-xs font-black text-neutral-600 uppercase tracking-widest">Participant Cap</span>
                                </div>
                                <Input
                                    id="maxp"
                                    type="number"
                                    min="1"
                                    value={maxParticipants}
                                    onChange={(e) => setMaxParticipants(e.target.value)}
                                    placeholder="1000"
                                    className="premium-input h-14 px-5 bg-white/[0.01] border-white/[0.08] text-white rounded-2xl font-bold text-xl placeholder:text-neutral-800 focus:bg-white/[0.03] transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Timeline & Details */}
                    <div className="lg:col-span-7 space-y-6">
                        <Card className="border border-white/[0.06] bg-white/[0.02] rounded-3xl shadow-2xl hover:bg-white/[0.04] transition-all duration-500 h-full">
                            <CardHeader className="border-b border-white/[0.04] bg-white/[0.01] py-7">
                                <CardTitle className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-[0.2em]">
                                    <Sparkles className="w-4 h-4 text-blue-500" />
                                    Deployment Matrix
                                </CardTitle>
                                <CardDescription className="text-neutral-500 text-[10px] uppercase font-bold tracking-tighter">Core Event Parameters & Synchronization</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 space-y-8">
                                {/* Title & Description Section */}
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="title" className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] ml-1">Event Directive</Label>
                                        <Input
                                            id="title"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="E.G. EXTREME GAMING SETUP GIVEAWAY"
                                            className="premium-input h-14 bg-white/[0.01] border-white/[0.08] text-white rounded-2xl font-bold placeholder:text-neutral-800 focus:bg-white/[0.03] transition-all"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="desc" className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] ml-1">Contextual Brief</Label>
                                        <Input
                                            id="desc"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="DEFINE THE CORE MISSION OF THIS CONTEST"
                                            className="premium-input h-14 bg-white/[0.01] border-white/[0.08] text-white rounded-2xl font-bold placeholder:text-neutral-800 focus:bg-white/[0.03] transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Timeline Split */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                                <Calendar className="w-3 h-3 text-emerald-500" />
                                                Start Date
                                            </Label>
                                            <div className="relative group/input">
                                                <Input
                                                    type="date"
                                                    value={startDate}
                                                    onChange={(e) => setStartDate(e.target.value)}
                                                    className="premium-input h-12 bg-white/[0.03] border-white/[0.08] text-white rounded-xl font-mono text-xs uppercase"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <TimePicker
                                            label="Start Chronology"
                                            value={startTime}
                                            onChange={setStartTime}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                                <Calendar className="w-3 h-3 text-red-500" />
                                                End Date
                                            </Label>
                                            <div className="relative group/input">
                                                <Input
                                                    type="date"
                                                    value={endDate}
                                                    onChange={(e) => setendDate(e.target.value)}
                                                    className="premium-input h-12 bg-white/[0.03] border-white/[0.08] text-white rounded-xl font-mono text-xs uppercase"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <TimePicker
                                            label="Termination Date"
                                            value={endTime}
                                            onChange={setEndTime}
                                        />
                                    </div>
                                </div>

                                {/* Prize Configuration */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="prize" className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] ml-1">Asset Designation</Label>
                                        <Input
                                            id="prize"
                                            value={prize}
                                            onChange={(e) => setPrize(e.target.value)}
                                            placeholder="IPHONE 16 PRO MAX"
                                            className="premium-input h-12 bg-white/[0.01] border-white/[0.08] text-white rounded-xl font-black placeholder:text-neutral-800"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="prizeValue" className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] ml-1">Market Valuation</Label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600 font-bold">₹</span>
                                            <Input
                                                id="prizeValue"
                                                type="number"
                                                min="0"
                                                value={prizeValue}
                                                onChange={(e) => setPrizeValue(e.target.value)}
                                                placeholder="150000"
                                                className="premium-input h-12 bg-white/[0.01] border-white/[0.08] text-white rounded-xl font-black pl-8 placeholder:text-neutral-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Submit Actions */}
                                <div className="pt-6 flex flex-col gap-4">
                                    <Button
                                        type="submit"
                                        className="w-full h-16 btn-gradient rounded-2xl font-black text-sm uppercase tracking-[0.3em] italic shadow-2xl shadow-red-900/20 active:scale-[0.98] transition-all disabled:opacity-30 disabled:grayscale"
                                        disabled={!title || !description || !startDate || !startTime || !endDate || !endTime || !prize || !prizeValue || !winnerCount || !image}
                                    >
                                        Initiate Deployment
                                    </Button>
                                    <div className="flex items-center justify-center gap-2 text-[8px] font-bold text-neutral-700 uppercase tracking-widest">
                                        <ShieldCheck className="w-2.5 h-2.5" />
                                        Encryption Level: High-Security Verified
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </form>

                {/* Information Footer */}
                <div className="p-8 rounded-[2rem] border border-white/5 bg-white/[0.01] animate-fade-in" style={{ animationDelay: '0.3s' }}>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <Info className="w-5 h-5 text-blue-500" />
                        </div>
                        <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Administrative Guidance</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-2">
                            <span className="text-[9px] font-black text-neutral-600 uppercase tracking-tighter">Timeline Integrity</span>
                            <p className="text-[10px] text-neutral-500 leading-relaxed uppercase italic">Ensure the termination date is strictly chronologically subsequent to the initiation timestamp to prevent system data conflicts.</p>
                        </div>
                        <div className="space-y-2">
                            <span className="text-[9px] font-black text-neutral-600 uppercase tracking-tighter">Asset Security</span>
                            <p className="text-[10px] text-neutral-500 leading-relaxed uppercase italic">Verification of winner count against maximum participants is auto-validated during selection protocol phase.</p>
                        </div>
                        <div className="space-y-2">
                            <span className="text-[9px] font-black text-neutral-600 uppercase tracking-tighter">Public Visibility</span>
                            <p className="text-[10px] text-neutral-500 leading-relaxed uppercase italic">Immediate propagation to all user terminals occurs post-deployment activation. Recheck all identity assets before submission.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default withAdminAuth(AddGiveawayPage);




