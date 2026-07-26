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
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle } from "lucide-react";
import { TimePicker } from "@/app/components/TimePicker";
import { DatePicker } from "@/app/components/DatePicker";
import withAdminAuth from "../../../components/withAdminAuth"
import { useRouter } from "next/navigation";
import api from "@/app/utils/apiClient";
import { useAuth } from "@/app/context/AuthContext";
import { compressImage } from "@/app/utils/imageCompressor";
import dayjs from "@/app/utils/dayjs";

function AddGiveawayPage() {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [image, setImage] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setendDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [uploadProgress, setUploadProgress] = useState(null);
    const [localPreviewUrl, setLocalPreviewUrl] = useState("");
    useEffect(() => {
        // Only revoke on unmount, not on every change: avoids StrictMode double-invoke bug
        return () => {
            if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const [winnerCount, setwinnerCount] = useState("");
    const [maxParticipants, setMaxParticipants] = useState("");
    const [prize, setPrize] = useState("");
    const [prizeValue, setPrizeValue] = useState("");
    const { toast } = useToast();
    const router = useRouter();
    const { logoutAdmin } = useAuth();
    const winnerTotal = Number(winnerCount || 0);
    const participantCap = Number(maxParticipants || 0);
    const nowIst = dayjs().tz("Asia/Kolkata");
    const istToday = nowIst.format("YYYY-MM-DD");
    const startAt = startDate && startTime ? dayjs.tz(`${startDate} ${startTime}`, "Asia/Kolkata") : null;
    const endAt = endDate && endTime ? dayjs.tz(`${endDate} ${endTime}`, "Asia/Kolkata") : null;
    const hasValidTimeline = startAt && endAt && endAt.isAfter(startAt);
    const hasValidStartDate = startAt && !startAt.isBefore(nowIst);
    const hasValidCounts = winnerTotal > 0 && participantCap > 0 && winnerTotal <= participantCap;
    const canSubmit = title && description && startDate && startTime && endDate && endTime && prize && prizeValue && hasValidCounts && hasValidTimeline && hasValidStartDate;
    const uploadImage = async (imageFile) => {
        if (!imageFile) return;
        try {
            setUploadProgress(0);
            const previewUrl = URL.createObjectURL(imageFile);
            setLocalPreviewUrl(previewUrl);

            const compressed = await compressImage(imageFile, 1600, 1600, 0.85, 1.5 * 1024 * 1024);
            const form = new FormData();
            form.append("image", compressed || imageFile)
            const { data } = await api.post(`upload`, form, {
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
                setLocalPreviewUrl("");
                setUploadProgress(null);
                toast({
                    title: "Success",
                    description: (
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="text-green-500 w-5 h-5" />
                            <span>Image uploaded successfully.</span>
                        </div>
                    )
                });
            } else {
                setUploadProgress(null);
                setLocalPreviewUrl("");
                toast({
                    title: "Upload Error",
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
            setLocalPreviewUrl("");
            toast({
                title: "Server Error",
                variant: "destructive",
                description: "Image server is currently unreachable."
            });
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!hasValidStartDate) {
            toast({ title: "Invalid start time", variant: "destructive", description: "Start date and time cannot be in the past (IST)." });
            return;
        }
        if (!hasValidTimeline) {
            toast({ title: "Invalid timeline", variant: "destructive", description: "End date and time must be after the start." });
            return;
        }
        if (!hasValidCounts) {
            toast({ title: "Invalid winner setup", variant: "destructive", description: "Winner slots must be between 1 and the participant cap." });
            return;
        }
        try {
            const formdata = {
                title: title,
                description: description,
                image: image || "/images/gift.png",
                prize: prize,
                prizeValue: Number(prizeValue),
                winnerCount: winnerTotal,
                maxParticipants: participantCap,
                startDate: `${startDate} ${startTime}`,
                endDate: `${endDate} ${endTime}`,
            }
            const { data } = await api.post(`giveaway/create-giveaway`, formdata, {
                meta: { auth: "admin" },
            });
            if (data.error == false) {
                toast({
                    title: "Success",
                    description: (
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="text-green-500 w-5 h-5" />
                            <span>Giveaway created successfully.</span>
                        </div>
                    )
                });
                router.push('/admin/dashboard/giveaways');
            } else {
                toast({
                    title: "Failed",
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
                title: "Error",
                variant: "destructive",
                description: error?.response?.data?.msg || "An unexpected error occurred while saving."
            });
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-[#070707]">
            <div className="flex-col space-y-5 p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500/20 to-amber-500/5 border border-red-500/30 flex items-center justify-center shadow-[0_8px_32px_-8px_rgba(239,68,68,0.35)] shrink-0">
                            <BadgePlus className="text-red-400 w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
                                Create Giveaway
                            </h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                <p className="text-xs text-neutral-500 font-medium">
                                    Set up your giveaway details
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/admin/dashboard')}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] transition-all text-neutral-400 hover:text-white font-semibold text-xs"
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            <span>Dashboard</span>
                        </button>
                        <button
                            onClick={async () => {
                                await logoutAdmin();
                                router.push('/admin/');
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/[0.08] bg-white/[0.02] hover:bg-red-600/10 hover:border-red-600/40 transition-all text-neutral-400 hover:text-red-400 font-semibold text-xs"
                        >
                            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>

                {/* Main Form Area */}
                <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-12">

                    {/* Media & Essential Config */}
                    <div className="lg:col-span-5 space-y-6">
                        <Card className="border border-white/[0.06] bg-neutral-950/50 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl">
                            <CardHeader className="border-b border-white/[0.04] bg-white/[0.01] py-4 sm:py-5">
                                <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                                    <LucideImage className="w-4 h-4 text-red-500" />
                                    Giveaway Image
                                </CardTitle>
                                <CardDescription className="text-neutral-500 text-xs font-medium">Event promotional display</CardDescription>
                            </CardHeader>
                            <CardContent className="p-5 sm:p-6">
                                <div className="space-y-5">
                                    <div className="relative group rounded-lg overflow-hidden border border-white/[0.08] hover:border-red-600/40 transition-all aspect-video flex items-center justify-center bg-black/40">
                                        {localPreviewUrl ? (
                                            // blob: URLs must use plain <img>. Next.js <Image> cannot load them
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={localPreviewUrl}
                                                className="absolute inset-0 w-full h-full object-contain p-3"
                                                alt="Giveaway Preview"
                                            />
                                        ) : image ? (
                                            <Image
                                                src={image}
                                                fill
                                                className="object-contain p-3"
                                                alt="Giveaway Preview"
                                                unoptimized
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center gap-3 text-neutral-600 group-hover:text-red-500 transition-all duration-500">
                                                <div className="w-16 h-16 rounded-full bg-white/[0.02] flex items-center justify-center group-hover:scale-110 group-hover:bg-red-600/10 transition-all">
                                                    <Gift className="w-10 h-10 stroke-[1.5]" />
                                                </div>
                                                <span className="text-xs font-medium">Upload giveaway image</span>
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
                                                <div className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 text-xs font-semibold text-white">
                                                    Change image
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {uploadProgress !== null && (
                                        <div className="space-y-2 px-1">
                                            <div className="flex justify-between text-xs font-medium text-neutral-500">
                                                <span className="flex items-center gap-2">
                                                    <span className="flex h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />
                                                    Uploading
                                                </span>
                                                <span className="text-red-500">{uploadProgress}%</span>
                                            </div>
                                            <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-red-600 transition-all duration-300"
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                                        <Trophy className="w-4 h-4 text-amber-500" />
                                    </div>
                                    <span className="text-xs font-semibold text-neutral-500">Winner slots</span>
                                </div>
                                <Input
                                    id="winners"
                                    type="number"
                                    min="1"
                                    value={winnerCount}
                                    onChange={(e) => setwinnerCount(e.target.value)}
                                    placeholder="01"
                                    className="h-10 px-4 bg-white/[0.01] border-white/[0.08] text-white rounded-xl font-semibold text-sm placeholder:text-neutral-800 focus:bg-white/[0.03] transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    required
                                />
                            </div>
                            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                                        <Target className="w-4 h-4 text-blue-500" />
                                    </div>
                                    <span className="text-xs font-semibold text-neutral-500">Participant cap</span>
                                </div>
                                <Input
                                    id="maxp"
                                    type="number"
                                    min="1"
                                    value={maxParticipants}
                                    onChange={(e) => setMaxParticipants(e.target.value)}
                                    placeholder="1000"
                                    className="h-10 px-4 bg-white/[0.01] border-white/[0.08] text-white rounded-xl font-semibold text-sm placeholder:text-neutral-800 focus:bg-white/[0.03] transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Timeline & Details */}
                    <div className="lg:col-span-7 space-y-5">
                        <Card className="border border-white/[0.06] bg-neutral-950/50 backdrop-blur-md rounded-2xl shadow-2xl h-full">
                            <CardHeader className="border-b border-white/[0.04] bg-white/[0.01] py-4 sm:py-5">
                                <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-blue-500" />
                                    Giveaway Details
                                </CardTitle>
                                <CardDescription className="text-neutral-500 text-xs font-medium">Enter giveaway rules and timing</CardDescription>
                            </CardHeader>
                            <CardContent className="p-5 sm:p-6 space-y-5">
                                {/* Title & Description Section */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="title" className="text-xs font-semibold text-neutral-500 ml-1">Title</Label>
                                        <Input
                                            id="title"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="Free subscription giveaway"
                                            className="h-10 bg-white/[0.01] border-white/[0.08] text-white rounded-xl font-medium text-sm placeholder:text-neutral-700 focus:bg-white/[0.03] transition-all"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="desc" className="text-xs font-semibold text-neutral-500 ml-1">Description</Label>
                                        <Input
                                            id="desc"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Describe the contest rules and prize"
                                            className="h-10 bg-white/[0.01] border-white/[0.08] text-white rounded-xl font-medium text-sm placeholder:text-neutral-700 focus:bg-white/[0.03] transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Timeline Split */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <DatePicker
                                                label="Start date"
                                                value={startDate}
                                                onChange={setStartDate}
                                                min={istToday}
                                                testId="giveaway-start-date"
                                                required
                                            />
                                        <TimePicker
                                            label="Start time"
                                            value={startTime}
                                            onChange={setStartTime}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <DatePicker
                                                label="End date"
                                                value={endDate}
                                                onChange={setendDate}
                                                min={startDate || istToday}
                                                testId="giveaway-end-date"
                                                required
                                            />
                                        <TimePicker
                                            label="End time"
                                            value={endTime}
                                            onChange={setEndTime}
                                        />
                                    </div>
                                </div>

                                {/* Prize Configuration */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                                    <div className="space-y-2">
                                        <Label htmlFor="prize" className="text-xs font-semibold text-neutral-500 ml-1">Prize name</Label>
                                        <Input
                                            id="prize"
                                            value={prize}
                                            onChange={(e) => setPrize(e.target.value)}
                                            placeholder="iPhone 16 Pro Max"
                                            className="h-10 bg-white/[0.01] border-white/[0.08] text-white rounded-xl font-medium text-sm placeholder:text-neutral-700"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="prizeValue" className="text-xs font-semibold text-neutral-500 ml-1">Prize value</Label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600 font-bold">₹</span>
                                            <Input
                                                id="prizeValue"
                                                type="number"
                                                min="0"
                                                value={prizeValue}
                                                onChange={(e) => setPrizeValue(e.target.value)}
                                                placeholder="150000"
                                                className="h-10 bg-white/[0.01] border-white/[0.08] text-white rounded-xl font-medium text-sm pl-8 placeholder:text-neutral-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Submit Actions */}
                                    <div className="pt-6 flex flex-col gap-4">
                                    <Button
                                        type="submit"
                                        className="w-full h-10 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-500 active:scale-[0.98] transition-all disabled:opacity-30 disabled:grayscale"
                                        disabled={!canSubmit}
                                    >
                                        Create Giveaway
                                    </Button>
                                    {winnerTotal > participantCap && participantCap > 0 && (
                                        <p className="text-xs text-red-400 text-center">Winner slots cannot exceed the participant cap.</p>
                                    )}
                                    {startAt && endAt && !hasValidTimeline && (
                                        <p className="text-xs text-red-400 text-center">End date and time must be after the start.</p>
                                    )}
                                    {startAt && !hasValidStartDate && (
                                        <p className="text-xs text-red-400 text-center">Start date and time cannot be in the past (IST).</p>
                                    )}
                                    <div className="flex items-center justify-center gap-2 text-xs font-medium text-neutral-600">
                                        <ShieldCheck className="w-2.5 h-2.5" />
                                        Admin changes are saved securely
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </form>

                {/* Information Footer */}
                <div className="p-6 rounded-lg border border-white/5 bg-white/[0.01]">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <Info className="w-5 h-5 text-blue-500" />
                        </div>
                        <h4 className="text-sm font-semibold text-white">Helpful tips</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-2">
                            <span className="text-xs font-semibold text-neutral-500">Date and time</span>
                            <p className="text-xs text-neutral-500 leading-relaxed">Make sure the end date is after the start date.</p>
                        </div>
                        <div className="space-y-2">
                            <span className="text-xs font-semibold text-neutral-500">Selection rules</span>
                            <p className="text-xs text-neutral-500 leading-relaxed">The number of winners will be checked against the participant count.</p>
                        </div>
                        <div className="space-y-2">
                            <span className="text-xs font-semibold text-neutral-500">Visibility</span>
                            <p className="text-xs text-neutral-500 leading-relaxed">Giveaways appear on the site immediately after you create them.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default withAdminAuth(AddGiveawayPage);
