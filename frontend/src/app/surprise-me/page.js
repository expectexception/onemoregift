"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/app/utils/apiClient";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { useAuth } from "@/app/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/app/components/ConfirmDialog";
import { EmptyGalleryIllustration, EmptyTimelineIllustration } from "@/app/components/SVGIcons";
import {
    Gift, Calendar, User, FileText, Phone, Sparkles, Upload,
    History, Info, Smile, Heart, Share2, AlertTriangle, Plus, Clock, Lock, Flag, X, ImageOff
} from "lucide-react";

const OCCASIONS = [
    { value: "birthday", label: "🎂 Birthday" },
    { value: "anniversary", label: "💑 Anniversary" },
    { value: "wedding", label: "💍 Wedding" },
    { value: "graduation", label: "🎓 Graduation" },
    { value: "achievement", label: "🏆 Achievement" },
    { value: "festival", label: "✨ Festival" },
    { value: "custom", label: "🎈 Custom Occasion" },
];

const STATUS_COLORS = {
    draft: "bg-neutral-800 text-neutral-400 border-neutral-700",
    submitted: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    under_review: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    verification_pending: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    approved: "bg-green-500/10 text-green-400 border-green-500/20",
    rejected: "bg-red-500/10 text-red-400 border-red-500/20",
    gift_assigned: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const MomentMediaPreview = ({ media, isFeatured, onClick }) => {
    const videoRef = useRef(null);
    const [errored, setErrored] = useState(false);
    const isVideo = media.type === 'video' || media.url?.endsWith('.mp4') || media.url?.includes('/video/');

    const handleMouseEnter = () => {
        if (videoRef.current) {
            videoRef.current.play().catch(() => {});
        }
    };

    const handleMouseLeave = () => {
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }
    };

    return (
        <div 
            className="relative aspect-video bg-neutral-900 overflow-hidden shrink-0 cursor-pointer group"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
        >
            {errored ? (
                <div className="w-full h-full flex items-center justify-center text-neutral-600">
                    <ImageOff className="w-6 h-6" />
                </div>
            ) : isVideo ? (
                <div className="w-full h-full relative">
                    <video
                        ref={videoRef}
                        src={media.url}
                        className="w-full h-full object-cover"
                        muted
                        loop
                        playsInline
                        onError={() => setErrored(true)}
                    />
                    <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-bold text-white uppercase tracking-wider flex items-center gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> Video
                    </div>
                </div>
            ) : (
                <img src={media.url} alt="" onError={() => setErrored(true)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            )}
            {isFeatured && (
                <span className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Featured
                </span>
            )}
        </div>
    );
};

export default function JoyHubPage() {
    const router = useRouter();
    const { user, userAuthenticated, loadingUser } = useAuth();
    const { toast } = useToast();
    const { confirm, ConfirmDialog } = useConfirm();

    // Tabs
    const [activeTab, setActiveTab] = useState("surprise"); // "surprise" or "moments"
    const [surpriseSubTab, setSurpriseSubTab] = useState("apply"); // "apply" or "history"
    const [momentsSubTab, setMomentsSubTab] = useState("gallery"); // "gallery" or "share"

    // Report modal (replaces window.prompt for reporting a moment)
    const [reportTarget, setReportTarget] = useState(null);
    const [reportReason, setReportReason] = useState("");
    const [submittingReport, setSubmittingReport] = useState(false);

    // Error / Success States
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    // SURPRISE FORM
    const [surpriseForm, setSurpriseForm] = useState({
        eventName: "",
        eventType: "birthday",
        eventDate: "",
        description: "",
        recipientName: "",
        recipientContact: "",
    });
    const [surpriseFiles, setSurpriseFiles] = useState([]);
    const [uploadingSurpriseDocs, setUploadingSurpriseDocs] = useState(false);
    const [submittingSurprise, setSubmittingSurprise] = useState(false);

    // SURPRISE HISTORY
    const [requests, setRequests] = useState([]);
    const [loadingRequests, setLoadingRequests] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [cancellingId, setCancellingId] = useState(null);

    // HAPPY MOMENTS
    const [moments, setMoments] = useState([]);
    const [loadingGallery, setLoadingGallery] = useState(false);
    const [momentForm, setMomentForm] = useState({
        caption: "",
        description: "",
    });
    const [momentMedia, setMomentMedia] = useState([]);
    const [momentProofs, setMomentProofs] = useState([]);
    const [uploadingMomentMedia, setUploadingMomentMedia] = useState(false);
    const [uploadingMomentProofs, setUploadingMomentProofs] = useState(false);
    const [submittingMoment, setSubmittingMoment] = useState(false);
    const [config, setConfig] = useState({ requireSurpriseProof: true, requireMomentProof: true });

    // FULL VIEW MODAL STATE
    const [selectedMoment, setSelectedMoment] = useState(null);
    const [newCommentText, setNewCommentText] = useState("");
    const [submittingComment, setSubmittingComment] = useState(false);
    const [activeMediaIndex, setActiveMediaIndex] = useState(0);
    const [modalClosing, setModalClosing] = useState(false);
    const [reportModalClosing, setReportModalClosing] = useState(false);
    const [mediaLoaded, setMediaLoaded] = useState({});
    const [mediaErrored, setMediaErrored] = useState({});
    const [justLikedId, setJustLikedId] = useState(null);

    // API CALLS
    const fetchRequests = useCallback(async () => {
        if (!userAuthenticated) return;
        setLoadingRequests(true);
        try {
            const { data } = await api.get("surprise/my-requests", { meta: { auth: "user" } });
            if (!data.error) {
                setRequests(data.data || []);
            }
        } catch (_) {}
        setLoadingRequests(false);
    }, [userAuthenticated]);

    const fetchGallery = useCallback(async () => {
        setLoadingGallery(true);
        try {
            const { data } = await api.get("happy-moment/gallery");
            if (!data.error) {
                setMoments(data.data || []);
            }
        } catch (_) {}
        setLoadingGallery(false);
    }, []);

    useEffect(() => {
        if (activeTab === "surprise" && surpriseSubTab === "history") {
            fetchRequests();
        } else if (activeTab === "moments" && momentsSubTab === "gallery") {
            fetchGallery();
        }
    }, [activeTab, surpriseSubTab, momentsSubTab, fetchRequests, fetchGallery]);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const { data } = await api.get("config");
                if (!data.error && data.config) {
                    setConfig({
                        requireSurpriseProof: data.config.requireSurpriseProof ?? true,
                        requireMomentProof: data.config.requireMomentProof ?? true,
                    });
                }
            } catch (_) {}
        };
        fetchConfig();
    }, []);

    useEffect(() => {
        if (selectedMoment || reportTarget || selectedRequest) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [selectedMoment, reportTarget, selectedRequest]);

    // SURPRISE UPLOAD
    const handleSurpriseFileChange = async (e) => {
        if (!e.target.files?.length) return;
        setUploadingSurpriseDocs(true);
        setError("");
        const formData = new FormData();
        Array.from(e.target.files).forEach(file => {
            formData.append("images", file);
        });

        try {
            const { data } = await api.post("upload/user-multiple", formData, {
                headers: { "Content-Type": "multipart/form-data" },
                meta: { auth: "user" }
            });
            if (!data.error) {
                setSurpriseFiles(prev => [...prev, ...data.urls]);
            } else {
                setError(data.msg || "Upload failed");
            }
        } catch (err) {
            setError(err?.response?.data?.msg || "Failed to upload files");
        }
        setUploadingSurpriseDocs(false);
    };

    const handleSurpriseSubmit = async (e) => {
        e.preventDefault();
        if (!surpriseForm.eventName || !surpriseForm.eventDate || !surpriseForm.recipientName) {
            setError("Please fill all required fields");
            return;
        }

        if (config.requireSurpriseProof && surpriseFiles.length === 0) {
            setError("Please upload at least one document proof");
            return;
        }

        setSubmittingSurprise(true);
        setError("");
        try {
            const payload = {
                ...surpriseForm,
                documents: surpriseFiles,
            };
            const { data } = await api.post("surprise", payload, { meta: { auth: "user" } });
            if (!data.error) {
                setSuccessMsg("Surprise request submitted successfully!");
                setSurpriseForm({
                    eventName: "",
                    eventType: "birthday",
                    eventDate: "",
                    description: "",
                    recipientName: "",
                    recipientContact: "",
                });
                setSurpriseFiles([]);
                setSurpriseSubTab("history");
            } else {
                setError(data.msg || "Submission failed");
            }
        } catch (err) {
            setError(err?.response?.data?.msg || "Failed to submit request");
        }
        setSubmittingSurprise(false);
    };

    const handleCancelRequest = async (id) => {
        const ok = await confirm({
            title: "Cancel this request?",
            description: "You'll need to submit a new request if you change your mind.",
            confirmText: "Cancel Request",
            danger: true,
        });
        if (!ok) return;
        setCancellingId(id);
        try {
            const { data } = await api.patch(`surprise/${id}/cancel`, {}, { meta: { auth: "user" } });
            if (!data.error) {
                toast({ title: "Request cancelled" });
                fetchRequests();
                if (selectedRequest?._id === id) setSelectedRequest(data.data);
            } else {
                toast({ title: "Failed to cancel", description: data.msg, variant: "destructive" });
            }
        } catch (err) {
            toast({ title: "Error", description: err?.response?.data?.msg || "Failed to cancel request.", variant: "destructive" });
        }
        setCancellingId(null);
    };

    // MOMENT MEDIA UPLOAD
    const handleMomentMediaChange = async (e) => {
        if (!e.target.files?.length) return;
        setUploadingMomentMedia(true);
        setError("");
        const formData = new FormData();
        Array.from(e.target.files).forEach(file => {
            formData.append("images", file);
        });

        try {
            const { data } = await api.post("upload/user-multiple", formData, {
                headers: { "Content-Type": "multipart/form-data" },
                meta: { auth: "user" }
            });
            if (!data.error) {
                const formatted = data.media ? data.media : data.urls.map(url => {
                    const isVideoFile = url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.ogg') || url.endsWith('.mov') || url.includes('/video/');
                    return { url, type: isVideoFile ? "video" : "image" };
                });
                setMomentMedia(prev => [...prev, ...formatted]);
            } else {
                setError(data.msg || "Media upload failed");
            }
        } catch (err) {
            setError(err?.response?.data?.msg || "Failed to upload media");
        }
        setUploadingMomentMedia(false);
    };

    // MOMENT PROOFS UPLOAD
    const handleMomentProofsChange = async (e) => {
        if (!e.target.files?.length) return;
        setUploadingMomentProofs(true);
        setError("");
        const formData = new FormData();
        Array.from(e.target.files).forEach(file => {
            formData.append("images", file);
        });

        try {
            const { data } = await api.post("upload/user-multiple", formData, {
                headers: { "Content-Type": "multipart/form-data" },
                meta: { auth: "user" }
            });
            if (!data.error) {
                setMomentProofs(prev => [...prev, ...data.urls]);
            } else {
                setError(data.msg || "Proof upload failed");
            }
        } catch (err) {
            setError(err?.response?.data?.msg || "Failed to upload proof");
        }
        setUploadingMomentProofs(false);
    };

    const handleMomentSubmit = async (e) => {
        e.preventDefault();
        if (!momentForm.caption) {
            setError("Caption is required");
            return;
        }

        setSubmittingMoment(true);
        setError("");
        try {
            const payload = {
                ...momentForm,
                media: momentMedia,
                proofs: momentProofs,
                publishNow: true,
            };
            const { data } = await api.post("happy-moment", payload, { meta: { auth: "user" } });
            if (!data.error) {
                setSuccessMsg("Happy moment shared! It will be visible in gallery once moderator approves.");
                setMomentForm({ caption: "", description: "" });
                setMomentMedia([]);
                setMomentProofs([]);
                setMomentsSubTab("gallery");
            } else {
                setError(data.msg || "Failed to share moment");
            }
        } catch (err) {
            setError(err?.response?.data?.msg || "Failed to submit");
        }
        setSubmittingMoment(false);
    };

    const handleReactToMoment = async (id, index) => {
        if (!userAuthenticated) {
            router.push("/login");
            return;
        }
        try {
            const { data } = await api.post(`happy-moment/${id}/react`, { type: "love" }, { meta: { auth: "user" } });
            if (!data.error) {
                const nowLiked = data.data?.some(r => r.userId === user?._id);
                if (nowLiked) {
                    setJustLikedId(id);
                    setTimeout(() => setJustLikedId(null), 400);
                }
                setMoments(prev => {
                    const copy = [...prev];
                    const targetIdx = index !== undefined ? index : copy.findIndex(m => m._id === id);
                    if (targetIdx > -1) {
                        copy[targetIdx].reactions = data.data;
                    }
                    return copy;
                });
                if (selectedMoment && selectedMoment._id === id) {
                    setSelectedMoment(prev => ({
                        ...prev,
                        reactions: data.data
                    }));
                }
            }
        } catch (_) {}
    };

    const openFullViewModal = (moment) => {
        setSelectedMoment(moment);
        setActiveMediaIndex(0);
        setNewCommentText("");
        setMediaLoaded({});
        setMediaErrored({});
        setModalClosing(false);
    };

    const closeFullViewModal = () => {
        setModalClosing(true);
        setTimeout(() => {
            setSelectedMoment(null);
            setModalClosing(false);
        }, 220);
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newCommentText.trim() || !selectedMoment) return;
        setSubmittingComment(true);
        try {
            const { data } = await api.post(`happy-moment/${selectedMoment._id}/comment`, { text: newCommentText.trim() }, { meta: { auth: "user" } });
            if (!data.error) {
                setNewCommentText("");
                setSelectedMoment(prev => ({
                    ...prev,
                    comments: data.data
                }));
                setMoments(prev => {
                    const copy = [...prev];
                    const idx = copy.findIndex(m => m._id === selectedMoment._id);
                    if (idx > -1) {
                        copy[idx].comments = data.data;
                    }
                    return copy;
                });
                toast({ title: "Comment added" });
            } else {
                toast({ title: "Error", description: data.msg, variant: "destructive" });
            }
        } catch (err) {
            toast({ title: "Error", description: err?.response?.data?.msg || "Failed to add comment", variant: "destructive" });
        }
        setSubmittingComment(false);
    };

    const handleDeleteComment = async (commentId) => {
        if (!selectedMoment) return;
        const ok = await confirm({
            title: "Delete Comment?",
            description: "Are you sure you want to delete this comment? This action cannot be undone.",
            confirmText: "Delete",
            danger: true
        });
        if (!ok) return;

        try {
            const { data } = await api.delete(`happy-moment/${selectedMoment._id}/comment/${commentId}`, { meta: { auth: "user" } });
            if (!data.error) {
                setSelectedMoment(prev => ({
                    ...prev,
                    comments: data.data
                }));
                setMoments(prev => {
                    const copy = [...prev];
                    const idx = copy.findIndex(m => m._id === selectedMoment._id);
                    if (idx > -1) {
                        copy[idx].comments = data.data;
                    }
                    return copy;
                });
                toast({ title: "Comment deleted" });
            } else {
                toast({ title: "Error", description: data.msg, variant: "destructive" });
            }
        } catch (err) {
            toast({ title: "Error", description: err?.response?.data?.msg || "Failed to delete comment", variant: "destructive" });
        }
    };

    const handleReportMoment = (id) => {
        if (!userAuthenticated) {
            router.push("/login");
            return;
        }
        setReportReason("");
        setReportModalClosing(false);
        setReportTarget(id);
    };

    const closeReportModal = () => {
        setReportModalClosing(true);
        setTimeout(() => {
            setReportTarget(null);
            setReportModalClosing(false);
        }, 200);
    };

    const submitReport = async () => {
        if (!reportReason.trim() || !reportTarget) return;
        setSubmittingReport(true);
        try {
            const { data } = await api.post(`happy-moment/${reportTarget}/report`, { reason: reportReason.trim() }, { meta: { auth: "user" } });
            if (!data.error) {
                toast({ title: "Reported", description: "Thanks — our team will review this post." });
                closeReportModal();
                fetchGallery();
            } else {
                toast({ title: "Failed to report", description: data.msg, variant: "destructive" });
            }
        } catch (err) {
            toast({ title: "Error", description: err?.response?.data?.msg || "Failed to report", variant: "destructive" });
        }
        setSubmittingReport(false);
    };

    const handleShareLink = (id) => {
        navigator.clipboard.writeText(`${window.location.origin}/surprise-me#${id}`);
        toast({ title: "Link copied", description: "Moment link copied to clipboard." });
    };

    // RENDER AUTH GUARD CARD
    const renderAuthGuard = (featureText) => (
        <div className="glass-dark border-white/10 border rounded-3xl p-8 text-center max-w-md mx-auto my-12 space-y-6">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6 text-red-500" />
            </div>
            <div>
                <h3 className="text-xl font-bold text-white mb-2">Login Required</h3>
                <p className="text-sm text-neutral-400">
                    You need an account to {featureText}. Sign in or create an account to unlock this feature.
                </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <button
                    onClick={() => router.push("/login")}
                    className="px-6 py-2.5 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-all text-sm"
                >
                    Sign In
                </button>
                <button
                    onClick={() => router.push("/register")}
                    className="px-6 py-2.5 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all text-sm"
                >
                    Create Account
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#070708] text-white selection:bg-red-500/30">
            <Navbar />

            {/* Sub-header / Banner */}
            <div className="relative pt-28 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center overflow-hidden">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="relative z-10 flex flex-col items-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] font-bold text-red-400 mb-4 uppercase tracking-wider">
                        <Sparkles className="w-3 h-3 animate-spin" /> Live Community Portal
                    </span>
                    <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-3">
                        Surprises & <span className="text-gradient">Moments</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-neutral-400 text-sm sm:text-base mb-6">
                        Claim surprise gifts on your special moments, track claim validations, or browse real winning experiences from across the country.
                    </p>

                    {/* Master Tabs Selector */}
                    <div className="flex bg-white/[0.04] p-1.5 rounded-xl border border-white/10">
                        <button
                            onClick={() => { setActiveTab("surprise"); setError(""); setSuccessMsg(""); }}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "surprise" ? "bg-red-600 text-white shadow-lg" : "text-neutral-400 hover:text-white"}`}
                        >
                            <Gift className="w-4 h-4" /> Surprise Me
                        </button>
                        <button
                            onClick={() => { setActiveTab("moments"); setError(""); setSuccessMsg(""); }}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "moments" ? "bg-red-600 text-white shadow-lg" : "text-neutral-400 hover:text-white"}`}
                        >
                            <Smile className="w-4 h-4" /> Happy Moments
                        </button>
                    </div>
                </div>
            </div>

            {/* Dynamic Content Pane */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
                {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm mb-6 max-w-3xl mx-auto">{error}</div>}
                {successMsg && <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm mb-6 max-w-3xl mx-auto">{successMsg}</div>}

                {/* ── SURPRISE TAB VIEW ────────────────────────────────────────── */}
                {activeTab === "surprise" && (
                    <div className="space-y-6">
                        {/* Sub-tabs */}
                        <div className="flex justify-center gap-3">
                            <button
                                onClick={() => setSurpriseSubTab("apply")}
                                className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${surpriseSubTab === "apply" ? "bg-white/10 border-white/20 text-white" : "border-transparent text-neutral-500 hover:text-neutral-300"}`}
                            >
                                Apply For Surprise
                            </button>
                            <button
                                onClick={() => setSurpriseSubTab("history")}
                                className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${surpriseSubTab === "history" ? "bg-white/10 border-white/20 text-white" : "border-transparent text-neutral-500 hover:text-neutral-300"}`}
                            >
                                My Applications {userAuthenticated ? `(${requests.length})` : ""}
                            </button>
                        </div>

                        {!userAuthenticated ? (
                            renderAuthGuard("submit surprise requests and track status timeline")
                        ) : (
                            <>
                                {surpriseSubTab === "apply" && (
                                    <form onSubmit={handleSurpriseSubmit} className="glass-dark border-white/10 rounded-3xl p-6 sm:p-8 border space-y-6 max-w-3xl mx-auto">
                                        <div className="border-b border-white/10 pb-4">
                                            <h2 className="text-lg font-bold text-white">Request A Surprise Gift</h2>
                                            <p className="text-xs text-neutral-500 mt-1">Provide information about your special day and attach valid proof.</p>
                                        </div>

                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-neutral-400 uppercase mb-2">Event Title *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="e.g. My 25th Birthday"
                                                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500/50 text-white"
                                                    value={surpriseForm.eventName}
                                                    onChange={e => setSurpriseForm(p => ({ ...p, eventName: e.target.value }))}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-neutral-400 uppercase mb-2">Occasion Type *</label>
                                                <select
                                                    className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500/50 text-white"
                                                    value={surpriseForm.eventType}
                                                    onChange={e => setSurpriseForm(p => ({ ...p, eventType: e.target.value }))}
                                                >
                                                    {OCCASIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-neutral-400 uppercase mb-2">Date of Event *</label>
                                                <input
                                                    type="date"
                                                    required
                                                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500/50 text-white"
                                                    value={surpriseForm.eventDate}
                                                    onChange={e => setSurpriseForm(p => ({ ...p, eventDate: e.target.value }))}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-neutral-400 uppercase mb-2">Recipient Name *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="Full Name"
                                                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500/50 text-white"
                                                    value={surpriseForm.recipientName}
                                                    onChange={e => setSurpriseForm(p => ({ ...p, recipientName: e.target.value }))}
                                                />
                                            </div>
                                        </div>

                                        <div className={config.requireSurpriseProof ? "grid sm:grid-cols-2 gap-4" : "grid grid-cols-1 gap-4"}>
                                            <div>
                                                <label className="block text-xs font-semibold text-neutral-400 uppercase mb-2">Recipient Contact Number</label>
                                                <input
                                                    type="tel"
                                                    placeholder="Phone number"
                                                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500/50 text-white"
                                                    value={surpriseForm.recipientContact}
                                                    onChange={e => setSurpriseForm(p => ({ ...p, recipientContact: e.target.value }))}
                                                />
                                            </div>
                                            {config.requireSurpriseProof && (
                                                <div>
                                                    <label className="block text-xs font-semibold text-neutral-400 uppercase mb-2">Attachment / Document Proof *</label>
                                                    <label className="flex flex-col items-center justify-center w-full h-12 border-2 border-white/10 border-dashed rounded-xl cursor-pointer bg-white/[0.01] hover:bg-white/[0.03] transition-all">
                                                        <div className="flex items-center gap-2">
                                                            <Upload className={`w-4 h-4 ${uploadingSurpriseDocs ? "animate-bounce text-red-400" : "text-neutral-500"}`} />
                                                            <span className="text-xs text-neutral-400">Click to upload doc</span>
                                                        </div>
                                                        <input type="file" multiple className="hidden" onChange={handleSurpriseFileChange} disabled={uploadingSurpriseDocs} accept="image/*,application/pdf" />
                                                    </label>
                                                </div>
                                            )}
                                        </div>

                                        {config.requireSurpriseProof && surpriseFiles.length > 0 && (
                                            <div className="flex flex-wrap gap-2 pt-2">
                                                {surpriseFiles.map((url, idx) => (
                                                    <div key={idx} className="relative bg-white/[0.03] border border-white/10 rounded-xl px-3 py-1.5 pr-8 flex items-center gap-2">
                                                        <FileText className="w-3.5 h-3.5 text-red-400" />
                                                        <span className="text-xs text-neutral-300 truncate max-w-[100px]">Doc {idx + 1}</span>
                                                        <button type="button" onClick={() => setSurpriseFiles(prev => prev.filter((_, i) => i !== idx))} className="absolute right-2 text-neutral-500 hover:text-white">✕</button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-xs font-semibold text-neutral-400 uppercase mb-2">Description / Notes</label>
                                            <textarea
                                                rows={3}
                                                placeholder="Details about your occasion..."
                                                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500/50 text-white resize-none"
                                                value={surpriseForm.description}
                                                onChange={e => setSurpriseForm(p => ({ ...p, description: e.target.value }))}
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={submittingSurprise || uploadingSurpriseDocs}
                                            className="w-full py-3.5 btn-gradient rounded-xl font-bold transition-all disabled:opacity-60"
                                        >
                                            {submittingSurprise ? "Submitting..." : "Submit Surprise Request"}
                                        </button>
                                    </form>
                                )}

                                {surpriseSubTab === "history" && (
                                    <div>
                                        {loadingRequests ? (
                                            <div className="text-center text-neutral-500 py-8">Loading applications...</div>
                                        ) : requests.length === 0 ? (
                                            <div className="text-center py-12 space-y-3">
                                                <EmptyTimelineIllustration className="w-24 h-24 mx-auto" />
                                                <p className="text-neutral-500 text-sm">No requests found. Apply using the other tab.</p>
                                            </div>
                                        ) : (
                                            <div className="grid lg:grid-cols-3 gap-6">
                                                {/* Requests list */}
                                                <div className="lg:col-span-2 space-y-3">
                                                    {requests.map(r => (
                                                        <div
                                                            key={r._id}
                                                            onClick={() => setSelectedRequest(r)}
                                                            className={`p-4 border rounded-xl cursor-pointer transition-all flex justify-between items-center ${selectedRequest?._id === r._id ? "border-red-500/50 bg-white/[0.03]" : "border-white/10 bg-white/[0.01]"}`}
                                                        >
                                                            <div>
                                                                <h4 className="font-semibold text-white text-sm">{r.eventName}</h4>
                                                                <p className="text-xs text-neutral-500">{new Date(r.eventDate).toLocaleDateString("en-IN")} • {r.recipientName}</p>
                                                            </div>
                                                            <span className={`text-[10px] px-2.5 py-1 rounded-full border capitalize ${STATUS_COLORS[r.status] || "bg-neutral-800 text-neutral-400 border-white/10"}`}>
                                                                {r.status?.replace(/_/g, " ")}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Request Details */}
                                                <div className="lg:col-span-1">
                                                    {selectedRequest ? (
                                                        <div className="glass-dark border-white/10 border rounded-xl p-5 space-y-4">
                                                            <div>
                                                                <h3 className="font-bold text-white text-base">{selectedRequest.eventName}</h3>
                                                                <span className="text-[10px] text-neutral-500 capitalize">{selectedRequest.eventType} Occasion</span>
                                                            </div>

                                                            <div>
                                                                <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Timeline</h4>
                                                                <div className="space-y-2.5">
                                                                    {selectedRequest.verificationTimeline?.map((t, idx) => (
                                                                        <div key={idx} className="flex gap-2 text-xs">
                                                                            <Clock className="w-3.5 h-3.5 text-neutral-600 shrink-0 mt-0.5" />
                                                                            <div>
                                                                                <p className="text-white capitalize font-medium">{t.status?.replace(/_/g, " ")}</p>
                                                                                {t.note && <p className="text-[10px] text-neutral-500">{t.note}</p>}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {selectedRequest.assignedGift && (
                                                                <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg text-xs">
                                                                    <p className="text-purple-400 font-semibold mb-1">🎁 Gift Assigned!</p>
                                                                    <p className="text-white font-medium">{selectedRequest.assignedGift.name}</p>
                                                                </div>
                                                            )}

                                                            {["draft", "submitted", "under_review"].includes(selectedRequest.status) && (
                                                                <button
                                                                    onClick={() => handleCancelRequest(selectedRequest._id)}
                                                                    disabled={cancellingId === selectedRequest._id}
                                                                    className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-bold rounded-lg transition-all"
                                                                >
                                                                    {cancellingId === selectedRequest._id ? "Cancelling..." : "Cancel Application"}
                                                                </button>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="p-5 border border-white/10 rounded-xl text-center text-xs text-neutral-500">
                                                            Select an application to view status timeline.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* ── HAPPY MOMENTS TAB VIEW ───────────────────────────────────── */}
                {activeTab === "moments" && (
                    <div className="space-y-6">
                        {/* Sub-tabs */}
                        <div className="flex justify-center gap-3">
                            <button
                                onClick={() => setMomentsSubTab("gallery")}
                                className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${momentsSubTab === "gallery" ? "bg-white/10 border-white/20 text-white" : "border-transparent text-neutral-500 hover:text-neutral-300"}`}
                            >
                                Moments Gallery
                            </button>
                            <button
                                onClick={() => setMomentsSubTab("share")}
                                className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${momentsSubTab === "share" ? "bg-white/10 border-white/20 text-white" : "border-transparent text-neutral-500 hover:text-neutral-300"}`}
                            >
                                Share My Moment
                            </button>
                        </div>

                        {momentsSubTab === "gallery" && (
                            <div>
                                {loadingGallery ? (
                                    <div className="text-center text-neutral-500 py-8">Loading gallery...</div>
                                ) : moments.length === 0 ? (
                                    <div className="text-center py-12 space-y-3">
                                        <EmptyGalleryIllustration className="w-24 h-24 mx-auto" />
                                        <p className="text-neutral-500 text-sm">No moments shared yet. Share yours!</p>
                                    </div>
                                ) : (
                                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {moments.map((m, idx) => (
                                            <div key={m._id} id={m._id} className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all flex flex-col h-full">
                                                {m.media && m.media.length > 0 ? (
                                                    <MomentMediaPreview media={m.media[0]} isFeatured={m.isFeatured} onClick={() => openFullViewModal(m)} />
                                                ) : (
                                                    <div onClick={() => openFullViewModal(m)} className="aspect-video bg-neutral-900/40 border-b border-white/10 flex items-center justify-center text-neutral-600 shrink-0 cursor-pointer">No Media</div>
                                                )}

                                                <div className="p-4 flex-1 flex flex-col justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <div className="w-7 h-7 rounded-full bg-white/10 overflow-hidden flex items-center justify-center">
                                                                {m.userId?.profilePic ? (
                                                                    <img src={m.userId.profilePic} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <span className="text-xs font-semibold text-neutral-400">{(m.userId?.name || "U")[0]}</span>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <h4 className="text-xs font-semibold text-white truncate max-w-[120px]">{m.userId?.name || "User"}</h4>
                                                                <span className="text-[9px] text-neutral-500">{new Date(m.createdAt).toLocaleDateString("en-IN")}</span>
                                                            </div>
                                                        </div>
                                                        <p onClick={() => openFullViewModal(m)} className="text-xs text-neutral-200 font-medium mb-1 line-clamp-2 cursor-pointer hover:text-amber-400 transition-colors">{m.caption}</p>
                                                        {m.description && <p onClick={() => openFullViewModal(m)} className="text-[11px] text-neutral-400 line-clamp-3 mb-3 cursor-pointer">{m.description}</p>}
                                                    </div>

                                                    <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-3">
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                onClick={() => handleReactToMoment(m._id, idx)}
                                                                className={`flex items-center gap-1 text-xs transition-colors ${m.reactions?.some(r => r.userId === user?._id) ? "text-red-500" : "text-neutral-400 hover:text-red-500"}`}
                                                            >
                                                                <Heart className={`w-4 h-4 shrink-0 ${justLikedId === m._id ? "animate-heart-pop" : ""}`} />
                                                                <span>{m.reactions?.length || 0}</span>
                                                            </button>
                                                            <button
                                                                onClick={() => openFullViewModal(m)}
                                                                className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition-colors"
                                                            >
                                                                <Smile className="w-4 h-4 shrink-0" />
                                                                <span>{m.comments?.length || 0}</span>
                                                            </button>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button onClick={() => handleShareLink(m._id)} className="text-neutral-400 hover:text-white"><Share2 className="w-3.5 h-3.5" /></button>
                                                            <button onClick={() => handleReportMoment(m._id)} className="text-neutral-400 hover:text-red-400"><AlertTriangle className="w-3.5 h-3.5" /></button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {momentsSubTab === "share" && (
                            <>
                                {!userAuthenticated ? (
                                    renderAuthGuard("share your winner experience with the community")
                                ) : (
                                    <form onSubmit={handleMomentSubmit} className="glass-dark border-white/10 rounded-3xl p-6 sm:p-8 border space-y-6 max-w-3xl mx-auto">
                                        <div className="border-b border-white/10 pb-4">
                                            <h2 className="text-lg font-bold text-white">Share Your Happy Moment</h2>
                                            <p className="text-xs text-neutral-500 mt-1">Post your gift arrival photo or experience to share the joy.</p>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-neutral-400 uppercase mb-2">Caption *</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. Look at this amazing watch I claimed!"
                                                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500/50 text-white"
                                                value={momentForm.caption}
                                                onChange={e => setMomentForm(p => ({ ...p, caption: e.target.value }))}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-neutral-400 uppercase mb-2">Description / Experience</label>
                                            <textarea
                                                rows={3}
                                                placeholder="Describe how you feel..."
                                                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500/50 text-white resize-none"
                                                value={momentForm.description}
                                                onChange={e => setMomentForm(p => ({ ...p, description: e.target.value }))}
                                            />
                                        </div>

                                        <div className={config.requireMomentProof ? "grid sm:grid-cols-2 gap-4" : "grid grid-cols-1 gap-4"}>
                                            <div>
                                                <label className="block text-xs font-semibold text-neutral-400 uppercase mb-2">Photos / Media</label>
                                                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-white/10 border-dashed rounded-xl cursor-pointer bg-white/[0.01] hover:bg-white/[0.03] transition-all">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <Upload className={`w-5 h-5 ${uploadingMomentMedia ? "animate-bounce text-amber-400" : "text-neutral-500"}`} />
                                                        <p className="text-[10px] text-neutral-400 mt-1">Upload images or videos</p>
                                                    </div>
                                                    <input type="file" multiple className="hidden" onChange={handleMomentMediaChange} disabled={uploadingMomentMedia} accept="image/*,video/*" />
                                                </label>
                                                {momentMedia.length > 0 && (
                                                    <div className="mt-2 flex flex-wrap gap-1">
                                                        {momentMedia.map((m, idx) => (
                                                            <div key={idx} className="relative w-10 h-10 rounded border border-white/10 overflow-hidden bg-neutral-900 flex items-center justify-center">
                                                                {m.type === 'video' ? (
                                                                    <div className="w-full h-full flex items-center justify-center relative">
                                                                        <video src={m.url} className="w-full h-full object-cover" muted />
                                                                        <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                                                                            <span className="text-[7px] font-bold text-white uppercase">VID</span>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <img src={m.url} alt="" className="w-full h-full object-cover" />
                                                                )}
                                                                <button type="button" onClick={() => setMomentMedia(prev => prev.filter((_, i) => i !== idx))} className="absolute top-0 right-0 bg-black/80 text-[8px] p-0.5 text-white hover:text-red-400 transition-colors">✕</button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {config.requireMomentProof && (
                                                <div>
                                                    <label className="block text-xs font-semibold text-neutral-400 uppercase mb-2">Verification Proof (Private to Admin)</label>
                                                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-white/10 border-dashed rounded-xl cursor-pointer bg-white/[0.01] hover:bg-white/[0.03] transition-all">
                                                        <div className="flex flex-col items-center justify-center">
                                                            <Upload className={`w-5 h-5 ${uploadingMomentProofs ? "animate-bounce text-amber-400" : "text-neutral-500"}`} />
                                                            <p className="text-[10px] text-neutral-400 mt-1">Upload proof docs</p>
                                                        </div>
                                                        <input type="file" multiple className="hidden" onChange={handleMomentProofsChange} disabled={uploadingMomentProofs} accept="image/*" />
                                                    </label>
                                                    {momentProofs.length > 0 && (
                                                        <div className="mt-2 flex flex-wrap gap-1">
                                                            {momentProofs.map((url, idx) => (
                                                                <div key={idx} className="relative bg-white/[0.03] border border-white/10 rounded px-2 py-1 flex items-center gap-1 text-[10px]">
                                                                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                                                                    <span className="truncate max-w-[50px]">Proof {idx + 1}</span>
                                                                    <button type="button" onClick={() => setMomentProofs(prev => prev.filter((_, i) => i !== idx))} className="text-neutral-500">✕</button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={submittingMoment || uploadingMomentMedia || uploadingMomentProofs}
                                            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl font-bold transition-all disabled:opacity-60 text-white"
                                        >
                                            {submittingMoment ? "Sharing..." : "Share My Moment"}
                                        </button>
                                    </form>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            <Footer />

            {/* Report Moment Modal — replaces window.prompt() */}
            {reportTarget && (
                <div
                    className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md ${reportModalClosing ? "animate-fade-out" : "animate-fade-in"}`}
                    onClick={closeReportModal}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className={`glass-dark border border-white/10 rounded-2xl p-6 max-w-sm w-full space-y-4 ${reportModalClosing ? "animate-scale-out" : "animate-scale-in"}`}
                    >
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                                <Flag className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-sm">Report this post</h3>
                                <p className="text-neutral-400 text-xs mt-1">Tell us what&apos;s wrong — our moderators will review it.</p>
                            </div>
                            <button onClick={closeReportModal} className="ml-auto text-neutral-500 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <textarea
                            autoFocus
                            rows={3}
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            placeholder="e.g. Inappropriate content, spam, fake gift claim..."
                            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500/50 text-white resize-none"
                        />
                        <div className="flex gap-2 justify-end">
                            <button onClick={closeReportModal} className="px-4 py-2 rounded-lg text-xs font-bold text-neutral-300 hover:bg-white/5 transition-all">
                                Cancel
                            </button>
                            <button
                                onClick={submitReport}
                                disabled={!reportReason.trim() || submittingReport}
                                className="px-4 py-2 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-all disabled:opacity-50"
                            >
                                {submittingReport ? "Submitting..." : "Submit Report"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Immersive Glassmorphism Happy Moment Full-View Modal */}
            {selectedMoment && (
                <div
                    className={`fixed inset-0 z-[110] bg-neutral-950/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 md:p-8 ${modalClosing ? "animate-fade-out" : "animate-fade-in"}`}
                    onClick={closeFullViewModal}
                >
                    <div
                        className={`glass-dark border border-white/10 rounded-3xl overflow-hidden w-full max-w-5xl h-[92vh] sm:h-[85vh] md:h-[75vh] flex flex-col md:flex-row ${modalClosing ? "animate-scale-out" : "animate-scale-in"}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* LEFT: Media Player / Viewer */}
                        <div className="w-full md:w-[60%] bg-black/40 flex items-center justify-center relative h-[38%] md:h-full border-b md:border-b-0 md:border-r border-white/10">
                            {selectedMoment.media && selectedMoment.media.length > 0 ? (
                                <div className="w-full h-full flex items-center justify-center relative">
                                    {!mediaLoaded[activeMediaIndex] && !mediaErrored[activeMediaIndex] && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-white/[0.03] animate-pulse">
                                            <div className="w-10 h-10 border-2 border-amber-500/40 border-t-amber-500 rounded-full animate-spin" />
                                        </div>
                                    )}
                                    {mediaErrored[activeMediaIndex] ? (
                                        <div className="flex flex-col items-center gap-2 text-neutral-500">
                                            <ImageOff className="w-10 h-10" />
                                            <p className="text-xs">Media failed to load</p>
                                        </div>
                                    ) : selectedMoment.media[activeMediaIndex]?.type === 'video' || selectedMoment.media[activeMediaIndex]?.url?.endsWith('.mp4') || selectedMoment.media[activeMediaIndex]?.url?.includes('/video/') ? (
                                        <video
                                            key={selectedMoment.media[activeMediaIndex].url}
                                            src={selectedMoment.media[activeMediaIndex].url}
                                            controls
                                            autoPlay
                                            loop
                                            onLoadedData={() => setMediaLoaded(p => ({ ...p, [activeMediaIndex]: true }))}
                                            onError={() => setMediaErrored(p => ({ ...p, [activeMediaIndex]: true }))}
                                            className={`w-full h-full object-contain transition-opacity ${mediaLoaded[activeMediaIndex] ? "opacity-100" : "opacity-0"}`}
                                        />
                                    ) : (
                                        <img
                                            key={selectedMoment.media[activeMediaIndex].url}
                                            src={selectedMoment.media[activeMediaIndex].url}
                                            alt=""
                                            onLoad={() => setMediaLoaded(p => ({ ...p, [activeMediaIndex]: true }))}
                                            onError={() => setMediaErrored(p => ({ ...p, [activeMediaIndex]: true }))}
                                            className={`w-full h-full object-contain transition-opacity ${mediaLoaded[activeMediaIndex] ? "opacity-100" : "opacity-0"}`}
                                        />
                                    )}

                                    {/* Multi-media navigation arrows */}
                                    {selectedMoment.media.length > 1 && (
                                        <>
                                            {activeMediaIndex > 0 && (
                                                <button 
                                                    onClick={() => setActiveMediaIndex(p => p - 1)} 
                                                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/55 hover:bg-black/80 rounded-full text-white backdrop-blur-md transition-all border border-white/10 z-20"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
                                                </button>
                                            )}
                                            {activeMediaIndex < selectedMoment.media.length - 1 && (
                                                <button 
                                                    onClick={() => setActiveMediaIndex(p => p + 1)} 
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/55 hover:bg-black/80 rounded-full text-white backdrop-blur-md transition-all border border-white/10 z-20"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                                                </button>
                                            )}

                                            {/* Indicators */}
                                            <div className="absolute bottom-4 flex gap-1.5 justify-center z-10">
                                                {selectedMoment.media.map((_, idx) => (
                                                    <button 
                                                        key={idx} 
                                                        onClick={() => setActiveMediaIndex(idx)}
                                                        className={`w-2 h-2 rounded-full transition-all ${idx === activeMediaIndex ? 'bg-amber-500 w-4' : 'bg-white/30'}`}
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="text-neutral-500 text-sm">No Media</div>
                            )}

                            {/* Floating close button for mobile */}
                            <button 
                                onClick={closeFullViewModal} 
                                className="absolute top-4 left-4 md:hidden p-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* RIGHT: Moment Details & Comments Feed */}
                        <div className="w-full md:w-[40%] flex flex-col h-[62%] md:h-full bg-neutral-900/25 min-h-0">
                            {/* Header: Author Info */}
                            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/10 shrink-0">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden flex items-center justify-center border border-white/15">
                                        {selectedMoment.userId?.profilePic ? (
                                            <img src={selectedMoment.userId.profilePic} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xs font-bold text-neutral-300">{(selectedMoment.userId?.name || "U")[0]}</span>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-white leading-none">{selectedMoment.userId?.name || "User"}</h4>
                                        <span className="text-[9px] text-neutral-500 mt-1 block">{new Date(selectedMoment.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={closeFullViewModal} 
                                    className="hidden md:flex p-2 hover:bg-white/10 border border-transparent hover:border-white/15 rounded-full text-neutral-400 hover:text-white transition-all active:scale-95"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Caption & Description */}
                            <div className="p-4 border-b border-white/10 bg-white/[0.01] shrink-0 max-h-[80px] sm:max-h-[140px] overflow-y-auto">
                                <p className="text-xs text-white font-bold mb-1">{selectedMoment.caption}</p>
                                {selectedMoment.description && (
                                    <p className="text-[11px] text-neutral-400 leading-relaxed">{selectedMoment.description}</p>
                                )}
                            </div>

                            {/* Scrollable Comments Feed */}
                            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-neutral-950/20">
                                {!selectedMoment.comments || selectedMoment.comments.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-2">
                                        <Smile className="w-8 h-8 text-neutral-600" />
                                        <p className="text-xs text-neutral-500">No comments yet</p>
                                        <p className="text-[10px] text-neutral-600">Be the first to share your thoughts!</p>
                                    </div>
                                ) : (
                                    selectedMoment.comments.map((c) => (
                                        <div key={c._id} className="flex gap-3 items-start">
                                            <div className="w-7 h-7 rounded-full bg-white/10 overflow-hidden flex items-center justify-center shrink-0 border border-white/5">
                                                {c.userId?.profilePic ? (
                                                    <img src={c.userId.profilePic} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-[10px] font-bold text-neutral-400">{(c.userId?.name || "U")[0]}</span>
                                                )}
                                            </div>
                                            <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl p-3 relative group">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-[10px] font-bold text-white">{c.userId?.name || "User"}</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[8px] text-neutral-500">{new Date(c.at).toLocaleDateString("en-IN")}</span>
                                                        {userAuthenticated && c.userId?._id === user?._id && (
                                                            <button 
                                                                onClick={() => handleDeleteComment(c._id)}
                                                                className="text-neutral-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                                            >
                                                                ✕
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-xs text-neutral-300 mt-1 whitespace-pre-wrap break-all leading-relaxed">{c.text}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Likes Panel (Community count & engagement) */}
                            <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between bg-black/10 shrink-0">
                                <button
                                    onClick={() => handleReactToMoment(selectedMoment._id)}
                                    className={`flex items-center gap-1.5 text-xs font-bold transition-all ${selectedMoment.reactions?.some(r => r.userId === user?._id) ? "text-red-500 scale-105" : "text-neutral-400 hover:text-red-500"}`}
                                >
                                    <Heart className={`w-4 h-4 fill-current ${justLikedId === selectedMoment._id ? "animate-heart-pop" : ""}`} />
                                    <span>{selectedMoment.reactions?.length || 0} Likes</span>
                                </button>
                                <button
                                    onClick={() => handleShareLink(selectedMoment._id)}
                                    className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition-colors"
                                >
                                    <Share2 className="w-4 h-4" />
                                    <span>Share</span>
                                </button>
                            </div>

                            {/* Comment Input Box */}
                            <div className="p-4 border-t border-white/10 bg-neutral-900/60 shrink-0">
                                <form onSubmit={handleAddComment}>
                                    <div className="relative flex items-center">
                                        <input 
                                            type="text"
                                            placeholder={userAuthenticated ? "Add a comment..." : "Log in to join the discussion"}
                                            disabled={!userAuthenticated || submittingComment}
                                            value={newCommentText}
                                            onChange={e => setNewCommentText(e.target.value)}
                                            className="w-full bg-white/[0.04] border border-white/10 rounded-2xl pl-4 pr-16 py-3.5 text-xs focus:outline-none focus:border-amber-500/50 text-white placeholder-neutral-500 disabled:opacity-50"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!userAuthenticated || !newCommentText.trim() || submittingComment}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-[10px] font-bold text-white disabled:opacity-20 transition-all hover:brightness-110 active:scale-95"
                                        >
                                            Post
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {ConfirmDialog}
        </div>
    );
}
