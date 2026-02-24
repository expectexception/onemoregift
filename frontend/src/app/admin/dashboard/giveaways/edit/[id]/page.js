"use client";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, BadgePlus, LayoutDashboard, Gift } from "lucide-react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import withAdminAuth from "../../../../../components/withAdminAuth";
import api from "@/app/utils/apiClient";

function Page({ params }) {
    const { id: slug } = params;
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
    let [uploadProgress, setUploadProgress] = useState(null);
    const { toast } = useToast();

    // Fetch giveaway details
    const fetchGiveaway = async () => {
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
                }
            }

            setWinnerCount(fetchedData.winnerCount || "");
            setMaxParticipants(fetchedData.maxParticipants || "");
            setPrize(fetchedData.prize || "");
        } catch (error) {
            console.error("Error fetching giveaway:", error);
        }
    };

    // Handle image upload
    let uploadImage = async (imageFile) => {
        if (!imageFile) return;
        try {
            setUploadProgress(0);
            let form = new FormData();
            form.append("image", imageFile)
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
        try {
            const updatedData = {
                title,
                description,
                image,
                startDate: `${startDate} ${startTime}`,
                endDate: `${endDate} ${endTime}`,
                winnerCount,
                maxParticipants,
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
    }, []);

    return (
        <div className="min-h-screen bg-black">
            <div className="flex-col space-y-8 p-4 md:p-8 bg-black min-h-screen">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Edit Giveaway</h1>
                        <p className="text-sm text-neutral-500 mt-1">Editing: <span className="text-red-400 font-semibold">{title || 'Loading...'}</span></p>
                    </div>
                </div>

                <div className="h-px bg-white/[0.06]" />

                <div className="grid gap-8 grid-cols-1 lg:grid-cols-12 items-start">
                    {/* Media card */}
                    <Card className="lg:col-span-12 xl:col-span-5 border border-white/[0.06] bg-white/[0.02] rounded-3xl overflow-hidden shadow-2xl">
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
                                <div className="relative group rounded-2xl overflow-hidden border-2 border-dashed border-white/[0.08] hover:border-red-600/30 transition-all aspect-video flex items-center justify-center bg-black/40">
                                    {image ? (
                                        <Image src={image} fill className="object-cover" alt="Preview" />
                                    ) : (
                                        <div className="text-neutral-600 font-medium">No image available</div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => uploadImage(e.target.files[0])}
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <p className="text-white text-sm font-bold">Change Image</p>
                                    </div>
                                </div>
                                {uploadProgress !== null && (
                                    <div className="space-y-2">
                                        <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                                            <div className="h-full bg-red-600 transition-all" style={{ width: `${uploadProgress}%` }} />
                                        </div>
                                        <p className="text-[10px] text-neutral-500 text-center font-bold uppercase tracking-widest">Uploading {uploadProgress}%</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Form card */}
                    <Card className="lg:col-span-12 xl:col-span-7 border border-white/[0.06] bg-white/[0.02] rounded-3xl shadow-2xl">
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
                                        <Label className="text-neutral-400 text-xs font-semibold uppercase tracking-wider ml-1">Title</Label>
                                        <Input
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="premium-input h-12 bg-white/[0.03] border-white/[0.08] text-white rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-neutral-400 text-xs font-semibold uppercase tracking-wider ml-1">Description</Label>
                                        <Input
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="premium-input h-12 bg-white/[0.03] border-white/[0.08] text-white rounded-xl"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-neutral-400 text-xs font-semibold uppercase tracking-wider ml-1">Start Date & Time</Label>
                                            <div className="flex gap-2">
                                                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="premium-input bg-white/[0.03] border-white/[0.08] text-white rounded-xl" />
                                                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="premium-input bg-white/[0.03] border-white/[0.08] text-white rounded-xl w-32" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-neutral-400 text-xs font-semibold uppercase tracking-wider ml-1">End Date & Time</Label>
                                            <div className="flex gap-2">
                                                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="premium-input bg-white/[0.03] border-white/[0.08] text-white rounded-xl" />
                                                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="premium-input bg-white/[0.03] border-white/[0.08] text-white rounded-xl w-32" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-neutral-400 text-xs font-semibold uppercase tracking-wider ml-1">Prize Name</Label>
                                            <Input value={prize} onChange={(e) => setPrize(e.target.value)} className="premium-input h-12 bg-white/[0.03] border-white/[0.08] text-white rounded-xl" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-neutral-400 text-xs font-semibold uppercase tracking-wider ml-1">Winners / Max Participants</Label>
                                            <div className="flex gap-2">
                                                <Input type="number" value={winnerCount} onChange={(e) => setWinnerCount(e.target.value)} className="premium-input h-12 bg-white/[0.03] border-white/[0.08] text-white rounded-xl" />
                                                <Input type="number" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} className="premium-input h-12 bg-white/[0.03] border-white/[0.08] text-white rounded-xl" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <Button type="submit" className="w-full h-12 btn-gradient rounded-xl font-bold text-base mt-6 shadow-xl shadow-red-600/10">
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
