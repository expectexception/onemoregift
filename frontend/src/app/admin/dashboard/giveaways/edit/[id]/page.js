"use client";
import { useState, useEffect, useCallback, use } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
    AlertTriangle,
    ArrowLeft,
    Calendar,
    CalendarClock,
    Gift,
    ImagePlus,
    IndianRupee,
    LayoutDashboard,
    Lock,
    Save,
    Sparkles,
    Trophy,
    UploadCloud,
} from "lucide-react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import withAdminAuth from "../../../../../components/withAdminAuth";
import api from "@/app/utils/apiClient";
import { compressImage } from "@/app/utils/imageCompressor";
import { TimePicker } from "@/app/components/TimePicker";
import dayjs from "@/app/utils/dayjs";
import { useRouter } from "next/navigation";

function Page({ params }) {
    const slug = use(params).id;
    const router = useRouter();
    const [giveaway, setGiveaway] = useState({});
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [image, setImage] = useState("");
    const [startDate, setStartDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endDate, setEndDate] = useState("");
    const [endTime, setEndTime] = useState("");
    const [winnerCount, setWinnerCount] = useState("");
    const [maxParticipants, setMaxParticipants] = useState("");
    const [prize, setPrize] = useState("");
    const [prizeValue, setPrizeValue] = useState("");
    const [uploadProgress, setUploadProgress] = useState(null);
    const { toast } = useToast();
    const winnerTotal = Number(winnerCount || 0);
    const participantCap = Number(maxParticipants || 0);
    const nowIst = dayjs().tz("Asia/Kolkata");
    const istToday = nowIst.format("YYYY-MM-DD");
    const startAt = startDate && startTime ? dayjs.tz(`${startDate} ${startTime}`, "Asia/Kolkata") : null;
    const endAt = endDate && endTime ? dayjs.tz(`${endDate} ${endTime}`, "Asia/Kolkata") : null;
    const hasValidTimeline = startAt && endAt && endAt.isAfter(startAt);
    const hasValidStartDate = startAt && !startAt.isBefore(nowIst);
    const hasValidCounts = winnerTotal > 0 && participantCap > 0 && winnerTotal <= participantCap;
    const hasWinners = giveaway?.winners?.length > 0;
    const canUpdate = !hasWinners && hasValidTimeline && hasValidCounts && hasValidStartDate;
    const timelineLabel = startAt && endAt
        ? `${startAt.format("D MMM, h:mm A")} -> ${endAt.format("D MMM, h:mm A")} IST`
        : "Set both start and end time";

    // Fetch giveaway details
    const fetchGiveaway = useCallback(async () => {
        try {
            const { data } = await api.get(`admin/giveaway/${slug}`, {
                meta: { auth: "admin" },
            });

            const fetchedData = data.data;
            setGiveaway(fetchedData);

            // Set pre-filled data
            setTitle(fetchedData.title || "");
            setDescription(fetchedData.description || "");
            setImage(fetchedData.image || "");

            if (fetchedData.startDate) {
                try {
                    const start = dayjs.utc(fetchedData.startDate).tz("Asia/Kolkata");
                    setStartDate(start.format("YYYY-MM-DD"));
                    setStartTime(start.format("HH:mm"));
                    const end = dayjs.utc(fetchedData.endDate).tz("Asia/Kolkata");
                    setEndDate(end.format("YYYY-MM-DD"));
                    setEndTime(end.format("HH:mm"));
                } catch (err) {
                    console.error("Error converting dates:", err);
                    setStartDate(fetchedData.startDate?.slice(0, 10) || "");
                    setStartTime(fetchedData.startDate?.slice(11, 16) || "");
                    setEndDate(fetchedData.endDate?.slice(0, 10) || "");
                    setEndTime(fetchedData.endDate?.slice(11, 16) || "");
                }
            }

            setWinnerCount(fetchedData.winnerCount || "");
            setMaxParticipants(fetchedData.maxParticipants || "");
            setPrize(fetchedData.prize || "");
            setPrizeValue(fetchedData.prizeValue || "");
        } catch (error) {
            console.error("Error fetching giveaway:", error);
        }
    }, [slug]);

    // Handle image upload
    const uploadImage = async (imageFile) => {
        if (!imageFile) return;
        try {
            setUploadProgress(0);
            const compressed = await compressImage(imageFile, 1200, 1200, 0.85);
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
                setUploadProgress(null);
                toast({
                    title: "Success",
                    description: "Image updated successfully."
                });
            } else {
                setUploadProgress(null);
                toast({ title: "Upload Failed", variant: "destructive", description: data.msg });
            }
        } catch (error) {
            setUploadProgress(null);
            toast({ title: "Server Error", variant: "destructive" });
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (hasWinners) {
            toast({ title: "Locked", variant: "destructive", description: "Giveaways cannot be edited after winners are selected." });
            return;
        }
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
            const updatedData = {
                title,
                description,
                image: image || "/images/gift.png",
                startDate: `${startDate} ${startTime}`,
                endDate: `${endDate} ${endTime}`,
                winnerCount: winnerTotal,
                maxParticipants: participantCap,
                prizeValue: Number(prizeValue) || 0,
                prize,
            };

            const { data } = await api.patch(`giveaway/${slug}`, updatedData, {
                meta: { auth: "admin" },
            });

            if (!data.error) {
                toast({
                    title: "Success",
                    description: "Giveaway updated successfully."
                });
                setTimeout(() => {
                    router.push(`/admin/dashboard/giveaways/${slug}`);
                }, 700);
            } else {
                throw new Error(data.msg || "Update failed");
            }
        } catch (error) {
            toast({
                title: "Failed",
                variant: "destructive",
                description: error.message
            });
        }
    };

    useEffect(() => {
        fetchGiveaway();
    }, [fetchGiveaway]);

    return (
        <div className="min-h-screen admin-shell-bg text-white">
            <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
                <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 shadow-[0_30px_100px_-60px_rgba(220,38,38,0.7)] sm:p-6">
                    <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-red-600/20 blur-[90px]" />
                    <div className="pointer-events-none absolute bottom-0 left-1/3 h-32 w-72 rounded-full bg-amber-500/10 blur-[80px]" />
                    <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-4">
                            <button
                                type="button"
                                onClick={() => router.push("/admin/dashboard/giveaways")}
                                className="mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/[0.1] bg-black/30 text-neutral-300 transition hover:border-red-500/50 hover:text-white"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                            <div>
                               
                                <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">Edit Giveaway</h1>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-400">
                                    Fine tune campaign details, prize information, schedule and audience capacity with IST-safe validation.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:flex">
                            <div className="rounded-2xl border border-white/[0.08] bg-black/30 px-4 py-3">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">Winners</p>
                                <p className="mt-1 text-lg font-black text-white">{winnerTotal || "--"}</p>
                            </div>
                            <div className="rounded-2xl border border-white/[0.08] bg-black/30 px-4 py-3">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">Capacity</p>
                                <p className="mt-1 text-lg font-black text-white">{participantCap || "--"}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid gap-5 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.4fr)]">
                    <div className="space-y-5 xl:sticky xl:top-6 xl:self-start">
                        <Card className="overflow-hidden rounded-2xl border border-white/[0.08] bg-neutral-950/50 backdrop-blur-md shadow-2xl">
                            <CardHeader className="border-b border-white/[0.06] bg-gradient-to-r from-white/[0.045] to-transparent p-4 sm:p-5">
                                <CardTitle className="flex items-center gap-3 text-base font-black text-white">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-600/15 text-red-300">
                                        <ImagePlus className="h-5 w-5" />
                                    </span>
                                    Campaign Artwork
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-5 p-4 sm:p-5">
                                <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-white/[0.08] bg-[radial-gradient(circle_at_50%_20%,rgba(220,38,38,0.16),rgba(0,0,0,0.75)_55%)]">
                                    <Image src={image || "/images/gift.png"} fill className="object-contain p-4 transition duration-500 group-hover:scale-105" alt={title ? `${title} giveaway image preview` : "Giveaway image preview"} />
                                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                                    <label className="absolute inset-x-4 bottom-4 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/[0.1] bg-black/65 px-4 py-3 text-sm font-bold text-white backdrop-blur-md transition hover:border-red-500/50 hover:bg-red-600/20">
                                        <UploadCloud className="h-4 w-4" />
                                        Replace image
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => uploadImage(e.target.files[0])}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                                {uploadProgress !== null ? (
                                    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                                        <div className="mb-2 flex items-center justify-between text-xs font-bold text-red-200">
                                            <span>Optimizing upload</span>
                                            <span>{uploadProgress}%</span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                                            <div className="h-full rounded-full bg-gradient-to-r from-red-600 to-amber-400 transition-all" style={{ width: `${uploadProgress}%` }} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 text-xs leading-5 text-neutral-400">
                                        Use a clean 16:9 asset. Images are compressed before upload and served from your droplet.
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl border border-white/[0.08] bg-neutral-950/50 backdrop-blur-md">
                            <CardContent className="grid grid-cols-1 gap-3 p-4 sm:p-5 sm:grid-cols-2 xl:grid-cols-1">
                                <StatusPill icon={CalendarClock} label="Timeline" value={timelineLabel} tone={hasValidTimeline && hasValidStartDate ? "good" : "bad"} />
                                <StatusPill icon={Trophy} label="Winner setup" value={hasValidCounts ? `${winnerTotal} winner(s), ${participantCap} max` : "Check winner and participant counts"} tone={hasValidCounts ? "good" : "bad"} />
                                {hasWinners ? (
                                    <StatusPill icon={Lock} label="Locked" value="Winners selected, editing disabled" tone="warn" />
                                ) : null}
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="overflow-hidden rounded-2xl border border-white/[0.08] bg-neutral-950/50 backdrop-blur-md shadow-2xl">
                        <CardHeader className="border-b border-white/[0.06] bg-gradient-to-r from-white/[0.045] to-transparent p-4 sm:p-5">
                            <CardTitle className="flex flex-col gap-3 text-white sm:flex-row sm:items-center sm:justify-between">
                                <span className="flex items-center gap-3 text-lg font-black">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-300">
                                        <LayoutDashboard className="h-5 w-5" />
                                    </span>
                                    Settings
                                </span>
                                <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${canUpdate ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200" : "border-red-500/25 bg-red-500/10 text-red-200"}`}>
                                    {canUpdate ? "Ready" : "Needs attention"}
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-5 lg:p-6">
                            <div className="space-y-5">
                                <section className="space-y-3">
                                    <SectionTitle icon={Gift} title="Core details" />
                                    <div className="grid grid-cols-1 gap-4">
                                        <Field label="Title">
                                            <Input
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                className="h-10 rounded-xl border-white/[0.08] bg-black/35 text-white text-sm placeholder:text-neutral-600 focus-visible:ring-red-500/40"
                                                placeholder="Giveaway title"
                                            />
                                        </Field>
                                        <Field label="Description">
                                            <Textarea
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                className="min-h-[80px] resize-none rounded-xl border-white/[0.08] bg-black/35 text-white text-sm placeholder:text-neutral-600 focus-visible:ring-red-500/40"
                                                placeholder="Describe the rules, prize and timing"
                                            />
                                        </Field>
                                    </div>
                                </section>

                                <section className="space-y-3">
                                    <SectionTitle icon={CalendarClock} title="Schedule in IST" />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold text-neutral-500 ml-1 flex items-center gap-2">
                                                    <Calendar className="w-3 h-3 text-emerald-500" />
                                                    Start Date
                                                </Label>
                                                <div className="relative group/input">
                                                    <Input
                                                        type="date"
                                                        value={startDate}
                                                        onChange={(e) => setStartDate(e.target.value)}
                                                        min={istToday}
                                                        className="h-10 bg-white/[0.03] border-white/[0.08] text-white rounded-xl font-mono text-xs focus-visible:ring-red-500/40"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <TimePicker
                                                label="Start time"
                                                value={startTime}
                                                onChange={setStartTime}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold text-neutral-500 ml-1 flex items-center gap-2">
                                                    <Calendar className="w-3 h-3 text-red-500" />
                                                    End Date
                                                </Label>
                                                <div className="relative group/input">
                                                    <Input
                                                        type="date"
                                                        value={endDate}
                                                        onChange={(e) => setEndDate(e.target.value)}
                                                        min={startDate || istToday}
                                                        className="h-10 bg-white/[0.03] border-white/[0.08] text-white rounded-xl font-mono text-xs focus-visible:ring-red-500/40"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <TimePicker
                                                label="End time"
                                                value={endTime}
                                                onChange={setEndTime}
                                            />
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-3">
                                    <SectionTitle icon={IndianRupee} title="Prize and limits" />
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <Field label="Prize name">
                                            <Input value={prize} onChange={(e) => setPrize(e.target.value)} className="h-10 text-sm rounded-xl border-white/[0.08] bg-black/35 text-white focus-visible:ring-red-500/40" placeholder="iPhone 17" />
                                        </Field>
                                        <Field label="Prize value">
                                            <Input type="number" min="0" value={prizeValue} onChange={(e) => setPrizeValue(e.target.value)} className="h-10 text-sm rounded-xl border-white/[0.08] bg-black/35 text-white focus-visible:ring-red-500/40" placeholder="82000" />
                                        </Field>
                                        <Field label="Winner slots">
                                            <Input type="number" min="1" value={winnerCount} onChange={(e) => setWinnerCount(e.target.value)} className="h-10 text-sm rounded-xl border-white/[0.08] bg-black/35 text-white focus-visible:ring-red-500/40" />
                                        </Field>
                                        <Field label="Max participants">
                                            <Input type="number" min="1" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} className="h-10 text-sm rounded-xl border-white/[0.08] bg-black/35 text-white focus-visible:ring-red-500/40" />
                                        </Field>
                                    </div>
                                </section>

                                {(hasWinners || (winnerTotal > participantCap && participantCap > 0) || (startAt && endAt && !hasValidTimeline) || (startAt && !hasValidStartDate)) ? (
                                    <div className="space-y-2 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-200">
                                        <div className="mb-1 flex items-center gap-2 font-bold text-red-100">
                                            <AlertTriangle className="h-4 w-4" />
                                            Please fix before updating
                                        </div>
                                        {hasWinners && <p>This giveaway is locked because winners have already been selected.</p>}
                                        {winnerTotal > participantCap && participantCap > 0 && <p>Winner slots cannot exceed the participant cap.</p>}
                                        {startAt && endAt && !hasValidTimeline && <p>End date and time must be after the start.</p>}
                                        {startAt && !hasValidStartDate && <p>Start date and time cannot be in the past (IST).</p>}
                                    </div>
                                ) : null}

                                <div className="flex flex-col-reverse gap-3 border-t border-white/[0.06] pt-6 sm:flex-row sm:items-center sm:justify-between">
                                    <Button
                                        type="button"
                                        onClick={() => router.push(`/admin/dashboard/giveaways/${slug}`)}
                                        className="h-10 text-sm rounded-xl border border-white/[0.1] bg-white/[0.03] px-6 text-neutral-200 hover:bg-white/[0.07]"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={!canUpdate}
                                        className="btn-gradient h-10 rounded-xl px-8 text-sm font-black shadow-[0_18px_50px_-24px_rgba(220,38,38,0.9)] disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <Save className="mr-2 h-4 w-4" />
                                        Update Giveaway
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </div>
    );
}

const Field = ({ label, children }) => (
    <div className="space-y-2">
        <Label className="ml-1 text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">{label}</Label>
        {children}
    </div>
);

const SectionTitle = ({ icon: Icon, title }) => (
    <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.035] text-red-300">
            <Icon className="h-4 w-4" />
        </span>
        <h2 className="text-sm font-black uppercase tracking-[0.18em] text-neutral-300">{title}</h2>
    </div>
);

const StatusPill = ({ icon: Icon, label, value, tone = "good" }) => {
    const toneClass = {
        good: "border-emerald-500/20 bg-emerald-500/5 text-emerald-200",
        bad: "border-red-500/20 bg-red-500/5 text-red-200",
        warn: "border-amber-500/20 bg-amber-500/5 text-amber-200",
    }[tone];

    return (
        <div className={`rounded-2xl border p-4 ${toneClass}`}>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
                <Icon className="h-3.5 w-3.5" />
                {label}
            </div>
            <p className="text-sm font-semibold leading-5 text-white/90">{value}</p>
        </div>
    );
};

export default withAdminAuth(Page);
