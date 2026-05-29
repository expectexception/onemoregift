"use client";
import { useState, useEffect, useCallback, use } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BadgePlus, LayoutDashboard } from "lucide-react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import withAdminAuth from "../../../../../components/withAdminAuth";
import api from "@/app/utils/apiClient";
import { compressImage } from "@/app/utils/imageCompressor";

function Page({ params }) {
    const slug = use(params).id;
    const [giveaway, setGiveaway] = useState({});
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [image, setImage] = useState("");
    const [startDate, setStartDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endDate, setEndDate] = useState("");
    const [endTime, setEndTime] = useState("");
    const [winnerCount, setWinnerCount] = useState("");
    let [maxParticipants, setMaxParticipants] = useState("");
    const [prize, setPrize] = useState("");
    const [prizeValue, setPrizeValue] = useState("");
    let [uploadProgress, setUploadProgress] = useState(null);
    const { toast } = useToast();
    const winnerTotal = Number(winnerCount || 0);
    const participantCap = Number(maxParticipants || 0);
    const startAt = startDate && startTime ? new Date(`${startDate}T${startTime}`) : null;
    const endAt = endDate && endTime ? new Date(`${endDate}T${endTime}`) : null;
    const hasValidTimeline = startAt && endAt && endAt > startAt;
    const hasValidCounts = winnerTotal > 0 && participantCap > 0 && winnerTotal <= participantCap;
    const hasWinners = giveaway?.winners?.length > 0;

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
                    const dayjsModule = await import("dayjs");
                    const utcModule = await import("dayjs/plugin/utc");
                    const timezoneModule = await import("dayjs/plugin/timezone");
                    const dayjs = dayjsModule.default || dayjsModule;
                    const utc = utcModule.default || utcModule;
                    const timezone = timezoneModule.default || timezoneModule;
                    dayjs.extend(utc);
                    dayjs.extend(timezone);

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
    let uploadImage = async (imageFile) => {
        if (!imageFile) return;
        try {
            setUploadProgress(0);
            const compressed = await compressImage(imageFile, 1200, 1200, 0.85);
            let form = new FormData();
            form.append("image", compressed || imageFile)
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
        <div className="min-h-screen bg-[#070707]">
            <div className="flex-col space-y-8 p-4 md:p-8 min-h-screen">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Edit Giveaway</h1>
                        <p className="text-sm text-neutral-500 mt-1">Editing <span className="text-red-400 font-semibold">{title || "Loading..."}</span></p>
                    </div>
                </div>

                <div className="h-px bg-white/[0.06]" />

                <div className="grid gap-8 grid-cols-1 lg:grid-cols-12 items-start">
                    {/* Media card */}
                    <Card className="lg:col-span-12 xl:col-span-5 border border-white/[0.06] bg-white/[0.02] rounded-lg overflow-hidden shadow-2xl">
                        <CardHeader className="border-b border-white/[0.04] bg-white/[0.01] py-6">
                            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-red-600/10 flex items-center justify-center">
                                    <BadgePlus className="w-4 h-4 text-red-500" />
                                </div>
                                Image
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="space-y-6">
                                <div className="relative group rounded-lg overflow-hidden border border-dashed border-white/[0.08] hover:border-red-600/30 transition-all aspect-video flex items-center justify-center bg-black/40">
                                    <Image src={image || "/images/gift.png"} fill className="object-contain p-3" alt={title ? `${title} giveaway image preview` : "Giveaway image preview"} />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => uploadImage(e.target.files[0])}
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <p className="text-white text-sm font-semibold">Change image</p>
                                    </div>
                                </div>
                                {uploadProgress !== null && (
                                    <div className="space-y-2">
                                        <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                                            <div className="h-full bg-red-600 transition-all" style={{ width: `${uploadProgress}%` }} />
                                        </div>
                                        <p className="text-xs text-neutral-500 text-center font-medium">Uploading {uploadProgress}%</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Form card */}
                    <Card className="lg:col-span-12 xl:col-span-7 border border-white/[0.06] bg-white/[0.02] rounded-lg shadow-2xl">
                        <CardHeader className="border-b border-white/[0.04] bg-white/[0.01] py-6">
                            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center">
                                    <LayoutDashboard className="w-4 h-4 text-blue-500" />
                                </div>
                                Settings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-neutral-400 text-xs font-semibold ml-1">Title</Label>
                                        <Input
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="h-12 bg-white/[0.03] border-white/[0.08] text-white rounded-lg"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-neutral-400 text-xs font-semibold ml-1">Description</Label>
                                        <Input
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="h-12 bg-white/[0.03] border-white/[0.08] text-white rounded-lg"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-neutral-400 text-xs font-semibold ml-1">Start date and time</Label>
                                            <div className="flex gap-2">
                                                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-white/[0.03] border-white/[0.08] text-white rounded-lg" />
                                                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="bg-white/[0.03] border-white/[0.08] text-white rounded-lg w-32" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-neutral-400 text-xs font-semibold ml-1">End date and time</Label>
                                            <div className="flex gap-2">
                                                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-white/[0.03] border-white/[0.08] text-white rounded-lg" />
                                                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="bg-white/[0.03] border-white/[0.08] text-white rounded-lg w-32" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-neutral-400 text-xs font-semibold ml-1">Prize name</Label>
                                            <Input value={prize} onChange={(e) => setPrize(e.target.value)} className="h-12 bg-white/[0.03] border-white/[0.08] text-white rounded-lg" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-neutral-400 text-xs font-semibold ml-1">Prize value</Label>
                                            <Input type="number" min="0" value={prizeValue} onChange={(e) => setPrizeValue(e.target.value)} className="h-12 bg-white/[0.03] border-white/[0.08] text-white rounded-lg" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-neutral-400 text-xs font-semibold ml-1">Winners / max participants</Label>
                                            <div className="flex gap-2">
                                                <Input type="number" min="1" value={winnerCount} onChange={(e) => setWinnerCount(e.target.value)} className="h-12 bg-white/[0.03] border-white/[0.08] text-white rounded-lg" />
                                                <Input type="number" min="1" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} className="h-12 bg-white/[0.03] border-white/[0.08] text-white rounded-lg" />
                                            </div>
                                        </div>
                                    </div>
                                    {hasWinners && (
                                        <p className="text-xs text-yellow-400">This giveaway is locked because winners have already been selected.</p>
                                    )}
                                    {winnerTotal > participantCap && participantCap > 0 && (
                                        <p className="text-xs text-red-400">Winner slots cannot exceed the participant cap.</p>
                                    )}
                                    {startAt && endAt && !hasValidTimeline && (
                                        <p className="text-xs text-red-400">End date and time must be after the start.</p>
                                    )}
                                </div>
                                <Button type="submit" disabled={hasWinners || !hasValidTimeline || !hasValidCounts} className="w-full h-12 rounded-lg bg-red-600 text-base font-semibold text-white hover:bg-red-500 mt-6 disabled:opacity-40">
                                    Update Giveaway
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default withAdminAuth(Page);
