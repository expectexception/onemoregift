"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/app/utils/apiClient";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { useAuth } from "@/app/context/AuthContext";
import {
    Gift, Calendar, User, FileText, Phone, Sparkles, Upload,
    History, Info, Smile, Heart, Share2, AlertTriangle, Plus, Clock, Lock
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

export default function JoyHubPage() {
    const router = useRouter();
    const { user, userAuthenticated, loadingUser } = useAuth();

    // Tabs
    const [activeTab, setActiveTab] = useState("surprise"); // "surprise" or "moments"
    const [surpriseSubTab, setSurpriseSubTab] = useState("apply"); // "apply" or "history"
    const [momentsSubTab, setMomentsSubTab] = useState("gallery"); // "gallery" or "share"

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
        if (!confirm("Are you sure you want to cancel this request?")) return;
        setCancellingId(id);
        try {
            const { data } = await api.patch(`surprise/${id}/cancel`, {}, { meta: { auth: "user" } });
            if (!data.error) {
                fetchRequests();
                if (selectedRequest?._id === id) setSelectedRequest(data.data);
            }
        } catch (_) {}
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
                const formatted = data.urls.map(url => ({ url, type: "image" }));
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
                setMoments(prev => {
                    const copy = [...prev];
                    copy[index].reactions = data.data;
                    return copy;
                });
            }
        } catch (_) {}
    };

    const handleReportMoment = async (id) => {
        if (!userAuthenticated) {
            router.push("/login");
            return;
        }
        const reason = prompt("Enter reason for reporting this post:");
        if (!reason) return;
        try {
            const { data } = await api.post(`happy-moment/${id}/report`, { reason }, { meta: { auth: "user" } });
            if (!data.error) {
                alert("Post reported successfully.");
                fetchGallery();
            }
        } catch (err) {
            alert(err?.response?.data?.msg || "Failed to report");
        }
    };

    const handleShareLink = (id) => {
        navigator.clipboard.writeText(`${window.location.origin}/surprise-me#${id}`);
        alert("Link copied to clipboard!");
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

                                        <div className="grid sm:grid-cols-2 gap-4">
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
                                        </div>

                                        {surpriseFiles.length > 0 && (
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
                                            <div className="text-center text-neutral-500 py-12">No requests found. Apply using the other tab.</div>
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
                                    <div className="text-center text-neutral-500 py-12">No moments shared yet. Share yours!</div>
                                ) : (
                                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {moments.map((m, idx) => (
                                            <div key={m._id} id={m._id} className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all flex flex-col h-full">
                                                {m.media && m.media.length > 0 ? (
                                                    <div className="relative aspect-video bg-neutral-900 overflow-hidden shrink-0">
                                                        <img src={m.media[0].url} alt="" className="w-full h-full object-cover" />
                                                        {m.isFeatured && (
                                                            <span className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                                                                <Sparkles className="w-3 h-3" /> Featured
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="aspect-video bg-neutral-900/40 border-b border-white/10 flex items-center justify-center text-neutral-600 shrink-0">No Media</div>
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
                                                        <p className="text-xs text-neutral-200 font-medium mb-1 line-clamp-2">{m.caption}</p>
                                                        {m.description && <p className="text-[11px] text-neutral-400 line-clamp-3 mb-3">{m.description}</p>}
                                                    </div>

                                                    <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-3">
                                                        <button
                                                            onClick={() => handleReactToMoment(m._id, idx)}
                                                            className={`flex items-center gap-1 text-xs transition-colors ${m.reactions?.some(r => r.userId === user?._id) ? "text-red-500" : "text-neutral-400 hover:text-red-500"}`}
                                                        >
                                                            <Heart className="w-4 h-4 shrink-0" />
                                                            <span>{m.reactions?.length || 0}</span>
                                                        </button>
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

                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-neutral-400 uppercase mb-2">Photos / Media</label>
                                                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-white/10 border-dashed rounded-xl cursor-pointer bg-white/[0.01] hover:bg-white/[0.03] transition-all">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <Upload className={`w-5 h-5 ${uploadingMomentMedia ? "animate-bounce text-amber-400" : "text-neutral-500"}`} />
                                                        <p className="text-[10px] text-neutral-400 mt-1">Upload images</p>
                                                    </div>
                                                    <input type="file" multiple className="hidden" onChange={handleMomentMediaChange} disabled={uploadingMomentMedia} accept="image/*" />
                                                </label>
                                                {momentMedia.length > 0 && (
                                                    <div className="mt-2 flex flex-wrap gap-1">
                                                        {momentMedia.map((m, idx) => (
                                                            <div key={idx} className="relative w-10 h-10 rounded border border-white/10 overflow-hidden">
                                                                <img src={m.url} alt="" className="w-full h-full object-cover" />
                                                                <button type="button" onClick={() => setMomentMedia(prev => prev.filter((_, i) => i !== idx))} className="absolute top-0 right-0 bg-black/80 text-[8px] p-0.5">✕</button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

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
                                                                <FileText className="w-3 h-3 text-amber-400" />
                                                                <span className="truncate max-w-[50px]">Proof {idx + 1}</span>
                                                                <button type="button" onClick={() => setMomentProofs(prev => prev.filter((_, i) => i !== idx))} className="text-neutral-500">✕</button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
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
        </div>
    );
}
