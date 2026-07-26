"use client";

import Image from "next/image";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useEffect, useMemo, useState, useRef } from "react";
import userImage from "../../../public/images/user.png";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, MapPin, Pencil, Gift, Star, Home, Heart, MessageSquare, Share2, Smile, X } from "lucide-react";
import api from "@/app/utils/apiClient";
import { useToast } from "@/hooks/use-toast";
import withUserAuth from "../components/withUserAuth";

function HomePage() {
    const router = useRouter();
    const { toast } = useToast();
    
    const [user, setUser] = useState({});
    const [giveaways, setGiveaways] = useState([]);
    const [moments, setMoments] = useState([]);
    const [selectedMoment, setSelectedMoment] = useState(null);
    const [activeMediaIndex, setActiveMediaIndex] = useState(0);
    const [newCommentText, setNewCommentText] = useState("");
    const [submittingComment, setSubmittingComment] = useState(false);

    const fetchData = async () => {
        try {
            const { data } = await api.get("profile/", { meta: { auth: "user" } });
            setUser(data.myProfile || {});
            setGiveaways(data.giveaways || []);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchMoments = async () => {
        try {
            const { data } = await api.get("happy-moment/my-moments", { meta: { auth: "user" } });
            if (!data.error) {
                setMoments(data.data || []);
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchData();
        fetchMoments();
    }, []);

    useEffect(() => {
        if (selectedMoment) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [selectedMoment]);

    const openFullViewModal = (moment) => {
        setSelectedMoment(moment);
        setActiveMediaIndex(0);
        setNewCommentText("");
    };

    const closeFullViewModal = () => {
        setSelectedMoment(null);
    };

    const handleReactToMoment = async (momentId) => {
        try {
            const { data } = await api.post(`happy-moment/${momentId}/react`, {}, { meta: { auth: "user" } });
            if (!data.error) {
                setMoments(prev => prev.map(m => {
                    if (m._id === momentId) {
                        return { ...m, reactions: data.data };
                    }
                    return m;
                }));
                if (selectedMoment && selectedMoment._id === momentId) {
                    setSelectedMoment(prev => ({ ...prev, reactions: data.data }));
                }
                toast({ title: "Reaction updated" });
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleShareLink = (momentId) => {
        const shareUrl = `${window.location.origin}/surprise-me?moment=${momentId}`;
        navigator.clipboard.writeText(shareUrl);
        toast({ title: "Link copied", description: "Moment link copied to clipboard." });
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newCommentText.trim() || submittingComment) return;
        setSubmittingComment(true);
        try {
            const { data } = await api.post(
                `happy-moment/${selectedMoment._id}/comment`,
                { text: newCommentText },
                { meta: { auth: "user" } }
            );
            if (!data.error) {
                setNewCommentText("");
                setSelectedMoment(prev => ({ ...prev, comments: data.data }));
                setMoments(prev => prev.map(m => {
                    if (m._id === selectedMoment._id) {
                        return { ...m, comments: data.data };
                    }
                    return m;
                }));
                toast({ title: "Comment added" });
            }
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to add comment", variant: "destructive" });
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            const { data } = await api.delete(
                `happy-moment/${selectedMoment._id}/comment/${commentId}`,
                { meta: { auth: "user" } }
            );
            if (!data.error) {
                setSelectedMoment(prev => ({ ...prev, comments: data.data }));
                setMoments(prev => prev.map(m => {
                    if (m._id === selectedMoment._id) {
                        return { ...m, comments: data.data };
                    }
                    return m;
                }));
                toast({ title: "Comment deleted" });
            }
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to delete comment", variant: "destructive" });
        }
    };

    const addresses = useMemo(() => {
        if (Array.isArray(user.addresses) && user.addresses.length) return user.addresses;
        if (user.address) {
            return [{
                label: "Home",
                fullName: user.fullName || user.name || "",
                line1: user.address,
                city: "",
                state: "",
                country: "",
                postalCode: "",
                phone: user.phone || "",
                isDefault: true,
            }];
        }
        return [];
    }, [user]);

    const defaultAddress = addresses.find((item) => item.isDefault) || addresses[0];
    const extraAddresses = addresses.filter((item) => item !== defaultAddress);
    const progressPercent = Math.min((giveaways.length / 100) * 100, 100);

    return (
        <div className="min-h-screen flex flex-col bg-black">
            <div className="sticky top-0 z-50">
                <Navbar />
            </div>

            <section className="relative py-14 px-4 sm:px-6 overflow-hidden">
                <div className="absolute inset-0 section-gradient" />
                <div className="absolute -top-12 -right-10 opacity-25">
                    <svg width="320" height="220" viewBox="0 0 320 220" fill="none" aria-hidden="true">
                        <defs>
                            <linearGradient id="profileGlow" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#ef4444" />
                                <stop offset="100%" stopColor="#7f1d1d" />
                            </linearGradient>
                        </defs>
                        <ellipse cx="190" cy="110" rx="120" ry="70" fill="url(#profileGlow)" fillOpacity="0.4" />
                        <ellipse cx="170" cy="110" rx="160" ry="90" stroke="#ef4444" strokeOpacity="0.4" />
                    </svg>
                </div>

                <div className="relative z-10 max-w-6xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">My Profile</h1>
                        <p className="text-neutral-400">Advanced account view with profile and saved addresses.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="premium-card rounded-2xl p-6 lg:col-span-1">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-24 h-24 rounded-full bg-neutral-800 border-2 border-white/[0.08] overflow-hidden">
                                    <Image src={user.avatar || userImage} alt="Profile" width={96} height={96} className="rounded-full object-cover w-full h-full" unoptimized={!!user.avatar} />
                                </div>
                                <h2 className="text-2xl font-bold text-white mt-4">{user.fullName || user.name || "Unnamed User"}</h2>
                                <p className="text-sm text-neutral-400 mt-1 break-all">{user.email || "No email set"}</p>
                            </div>
                            <Button className="w-full btn-gradient rounded-xl h-11 font-medium mt-6" onClick={() => router.push("/my-profile/edit")}>
                                <Pencil size={18} className="mr-2" /> Edit Profile
                            </Button>
                            <Button className="w-full bg-neutral-900 border border-neutral-800 hover:bg-neutral-850 rounded-xl h-11 font-medium mt-3 text-neutral-300" onClick={() => router.push("/shop/orders")}>
                                <Gift size={18} className="mr-2" /> My Shop Orders
                            </Button>
                        </div>

                        <div className="premium-card rounded-2xl p-6 lg:col-span-2">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-lg font-semibold text-white">Account Information</h3>
                                <Badge className="bg-red-600/20 text-red-300 border border-red-500/20">Active</Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InfoRow icon={<User size={18} />} label="Username" value={user.name || "Not set"} />
                                <InfoRow icon={<User size={18} />} label="Full Name" value={user.fullName || "Not set"} />
                                <InfoRow icon={<Phone size={18} />} label="Phone" value={user.phone || "Not set"} />
                                <InfoRow icon={<Mail size={18} />} label="Email" value={user.email || "Not set"} />
                                <InfoRow icon={<MapPin size={18} />} label="Addresses" value={`${addresses.length} saved`} />
                            </div>
                        </div>
                    </div>

                    <div className="premium-card rounded-2xl p-6 mt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Home className="w-4 h-4 text-red-400" /> Saved Addresses
                            </h3>
                            <Button variant="outline" onClick={() => router.push("/my-profile/edit")} className="rounded-lg border-white/[0.1] text-neutral-200 hover:bg-white/[0.04]">
                                Manage Addresses
                            </Button>
                        </div>

                        {defaultAddress ? (
                            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 mb-4">
                                <div className="flex items-center gap-2 mb-2 text-amber-200 text-sm font-medium">
                                    <Star className="w-4 h-4" /> Default Address
                                </div>
                                <p className="text-white text-sm">{renderAddress(defaultAddress)}</p>
                            </div>
                        ) : (
                            <p className="text-neutral-400 text-sm">No address saved yet.</p>
                        )}

                        {extraAddresses.length ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {extraAddresses.map((address, idx) => (
                                    <div key={idx} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
                                        <p className="text-xs uppercase tracking-wide text-neutral-400 mb-2">{address.label || `Address ${idx + 2}`}</p>
                                        <p className="text-sm text-white">{renderAddress(address)}</p>
                                    </div>
                                ))}
                            </div>
                        ) : null}
                    </div>
                </div>
            </section>

            <section className="py-12 px-6">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-white text-center mb-2">Joined Giveaways</h2>
                    <div className="max-w-lg mx-auto mb-10">
                        <p className="text-center text-neutral-400 mb-3">
                            You have joined <span className="text-red-400 font-bold">{giveaways.length}</span> giveaways
                        </p>
                        <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden border border-white/[0.06]">
                            <div className="h-full bg-gradient-to-r from-red-600 to-red-500 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                        </div>
                        {giveaways.length >= 100 ? (
                            <p className="text-center text-green-400 text-sm mt-3">Congratulations! You&apos;ve joined 100+ giveaways.</p>
                        ) : (
                            <p className="text-center text-neutral-500 text-sm mt-3">Join 100 giveaways without winning to receive a special gift.</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {giveaways.length > 0 ? (
                            giveaways.map((giveaway) => {
                                const hasWinners = giveaway.winners.length > 0;
                                const isWinner = hasWinners && giveaway.winners.includes(user._id);
                                return (
                                    <div key={giveaway._id} className="premium-card rounded-xl overflow-hidden group">
                                        <div className="relative h-48 bg-neutral-900 overflow-hidden">
                                            <Image src={giveaway.image || "/images/gift.png"} alt={giveaway.title || "Giveaway"} width={400} height={200} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                        </div>
                                        <div className="p-5">
                                            <h3 className="text-lg font-bold text-white mb-1">{giveaway.title}</h3>
                                            <p className="text-neutral-500 text-sm mb-3 line-clamp-2">{giveaway.description}</p>
                                            <div className="space-y-1 text-sm text-neutral-400">
                                                <p><span className="text-neutral-300 font-medium">Prize:</span> {giveaway.prize}</p>
                                                <p><span className="text-neutral-300 font-medium">Winners:</span> {giveaway.winnerCount}</p>
                                                <p><span className="text-neutral-300 font-medium">Start:</span> {new Date(giveaway.startDate).toLocaleDateString()}</p>
                                                <p><span className="text-neutral-300 font-medium">End:</span> {new Date(giveaway.endDate).toLocaleDateString()}</p>
                                            </div>
                                            {hasWinners ? (
                                                <div className="mt-4">
                                                    <Link href="/winners">
                                                        <Badge className={`px-4 py-1.5 text-sm ${isWinner ? "bg-green-600 hover:bg-green-700" : "bg-neutral-700 hover:bg-neutral-600"}`}>
                                                            {isWinner ? "You Won!" : "See Winners"}
                                                        </Badge>
                                                    </Link>
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="col-span-full text-center py-12">
                                <div className="w-16 h-16 rounded-2xl bg-red-600/10 flex items-center justify-center mx-auto mb-4">
                                    <Gift className="text-red-500 text-2xl" />
                                </div>
                                <p className="text-neutral-500">No giveaways joined yet. Start exploring!</p>
                                <Button className="mt-4 btn-gradient rounded-xl" onClick={() => router.push("/giveaway")}>
                                    Browse Giveaways
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <section className="py-12 px-6 border-t border-white/5">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-white text-center mb-2">Happy Moments Shared</h2>
                    <div className="max-w-lg mx-auto mb-10 text-center">
                        <p className="text-neutral-400">
                            You have shared <span className="text-amber-500 font-bold">{moments.length}</span> happy moments with the community
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {moments.length > 0 ? (
                            moments.map((moment) => (
                                <div key={moment._id} className="premium-card rounded-xl overflow-hidden flex flex-col group">
                                    <div 
                                        className="relative h-48 bg-neutral-900 overflow-hidden cursor-pointer"
                                        onClick={() => openFullViewModal(moment)}
                                    >
                                        <MomentMediaPreview media={moment.media} />
                                    </div>
                                    <div className="p-5 flex flex-col justify-between flex-grow">
                                        <div>
                                            <h3 
                                                className="text-base font-bold text-white mb-1 cursor-pointer hover:text-amber-400 transition-colors line-clamp-1"
                                                onClick={() => openFullViewModal(moment)}
                                            >
                                                {moment.caption}
                                            </h3>
                                            <p className="text-neutral-400 text-xs mb-3 line-clamp-2 leading-relaxed">{moment.description}</p>
                                        </div>
                                        
                                        {/* Interaction Bar */}
                                        <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-auto">
                                            <button 
                                                onClick={() => handleReactToMoment(moment._id)}
                                                className={`flex items-center gap-1.5 text-xs font-bold transition-all ${moment.reactions?.some(r => r.userId === user._id) ? "text-red-500 scale-105" : "text-neutral-500 hover:text-red-500"}`}
                                            >
                                                <Heart className="w-3.5 h-3.5 fill-current" />
                                                <span>{moment.reactions?.length || 0}</span>
                                            </button>
                                            <button 
                                                onClick={() => openFullViewModal(moment)}
                                                className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-amber-400 transition-colors"
                                            >
                                                <MessageSquare className="w-3.5 h-3.5" />
                                                <span>{moment.comments?.length || 0}</span>
                                            </button>
                                            <button 
                                                onClick={() => handleShareLink(moment._id)}
                                                className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-white transition-colors"
                                            >
                                                <Share2 className="w-3.5 h-3.5" />
                                                <span>Share</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-12">
                                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                                    <Smile className="text-amber-500 text-2xl" />
                                </div>
                                <p className="text-neutral-500">No happy moments shared yet. Spread some joy!</p>
                                <Button className="mt-4 btn-gradient rounded-xl" onClick={() => router.push("/surprise-me")}>
                                    Share Your First Moment
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Immersive Glassmorphism Happy Moment Full-View Modal */}
            {selectedMoment && (
                <div 
                    className="fixed inset-0 z-[110] bg-neutral-950/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 md:p-8 animate-fade-in"
                    onClick={closeFullViewModal}
                >
                    <div 
                        className="glass-dark border border-white/10 rounded-3xl overflow-hidden w-full max-w-5xl h-[85vh] md:h-[75vh] flex flex-col md:flex-row animate-scale-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* LEFT: Media Player / Viewer */}
                        <div className="w-full md:w-[60%] bg-black/40 flex items-center justify-center relative h-[45%] md:h-full border-b md:border-b-0 md:border-r border-white/10">
                            {selectedMoment.media && selectedMoment.media.length > 0 ? (
                                <div className="w-full h-full flex items-center justify-center relative">
                                    {selectedMoment.media[activeMediaIndex]?.type === 'video' || selectedMoment.media[activeMediaIndex]?.url?.endsWith('.mp4') || selectedMoment.media[activeMediaIndex]?.url?.includes('/video/') ? (
                                        <video 
                                            src={selectedMoment.media[activeMediaIndex].url} 
                                            controls 
                                            autoPlay 
                                            loop 
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <img 
                                            src={selectedMoment.media[activeMediaIndex].url} 
                                            alt="" 
                                            className="w-full h-full object-contain"
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
                        <div className="w-full md:w-[40%] flex flex-col h-[55%] md:h-full bg-neutral-900/25">
                            {/* Header: Author Info */}
                            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/10 shrink-0">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden flex items-center justify-center border border-white/15">
                                        {selectedMoment.userId?.avatar ? (
                                            <img src={selectedMoment.userId.avatar} alt="" className="w-full h-full object-cover" />
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
                            <div className="p-4 border-b border-white/10 bg-white/[0.01] shrink-0 max-h-[140px] overflow-y-auto">
                                <p className="text-xs text-white font-bold mb-1">{selectedMoment.caption}</p>
                                {selectedMoment.description && (
                                    <p className="text-[11px] text-neutral-400 leading-relaxed">{selectedMoment.description}</p>
                                )}
                            </div>

                            {/* Scrollable Comments Feed */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-950/20">
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
                                                {c.userId?.avatar ? (
                                                    <img src={c.userId.avatar} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-[10px] font-bold text-neutral-400">{(c.userId?.name || "U")[0]}</span>
                                                )}
                                            </div>
                                            <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl p-3 relative group">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-[10px] font-bold text-white">{c.userId?.name || "User"}</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[8px] text-neutral-500">{new Date(c.at).toLocaleDateString("en-IN")}</span>
                                                        {c.userId?._id === user?._id && (
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

                            {/* Likes Panel */}
                            <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between bg-black/10 shrink-0">
                                <button
                                    onClick={() => handleReactToMoment(selectedMoment._id)}
                                    className={`flex items-center gap-1.5 text-xs font-bold transition-all ${selectedMoment.reactions?.some(r => r.userId === user?._id) ? "text-red-500 scale-105" : "text-neutral-400 hover:text-red-500"}`}
                                >
                                    <Heart className="w-4 h-4 fill-current" />
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
                                            placeholder="Add a comment..."
                                            disabled={submittingComment}
                                            value={newCommentText}
                                            onChange={e => setNewCommentText(e.target.value)}
                                            className="w-full bg-white/[0.04] border border-white/10 rounded-2xl pl-4 pr-16 py-3.5 text-xs focus:outline-none focus:border-amber-500/50 text-white placeholder-neutral-500 disabled:opacity-50"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!newCommentText.trim() || submittingComment}
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

            <Footer />
        </div>
    );
}

function MomentMediaPreview({ media }) {
    const videoRef = useMemo(() => {
        return { current: null };
    }, []);
    const [isPlaying, setIsPlaying] = useState(false);

    if (!media || media.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-neutral-600 text-xs">
                No Media
            </div>
        );
    }

    const first = media[0];
    const isVideo = first.type === 'video' || first.url?.endsWith('.mp4') || first.url?.includes('/video/');

    const handleMouseEnter = () => {
        if (isVideo && videoRef.current) {
            videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        }
    };

    const handleMouseLeave = () => {
        if (isVideo && videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
            setIsPlaying(false);
        }
    };

    return (
        <div 
            className="w-full h-full relative overflow-hidden group"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {isVideo ? (
                <>
                    <video 
                        ref={(el) => { videoRef.current = el; }}
                        src={first.url}
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3 px-2 py-0.5 bg-red-600/90 text-[8px] font-extrabold uppercase tracking-widest text-white rounded-full flex items-center gap-1 shadow-md animate-pulse">
                        <span className="w-1 h-1 bg-white rounded-full" />
                        Video
                    </div>
                </>
            ) : (
                <img 
                    src={first.url} 
                    alt="" 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
            )}
        </div>
    );
}

function renderAddress(address) {
    const lines = [
        address.fullName,
        [address.line1, address.line2].filter(Boolean).join(", "),
        [address.city, address.state, address.country, address.postalCode].filter(Boolean).join(", "),
        address.phone ? `+91 ${address.phone}` : "",
    ].filter(Boolean);
    return lines.join(" | ");
}

function InfoRow({ icon, label, value }) {
    return (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <div className="text-red-500 text-lg">{icon}</div>
            <div>
                <p className="text-neutral-500 text-xs uppercase tracking-wider">{label}</p>
                <p className="text-white text-sm font-medium">{value || "-"}</p>
            </div>
        </div>
    );
}

export default withUserAuth(HomePage, {
    loadingLabel: "Loading your profile...",
});
