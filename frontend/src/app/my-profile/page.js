"use client";

import Image from "next/image";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useEffect, useMemo, useState } from "react";
import userImage from "../../../public/images/user.png";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, MapPin, Pencil, Gift, Star, Home } from "lucide-react";
import api from "@/app/utils/apiClient";
import withUserAuth from "../components/withUserAuth";

function HomePage() {
    const router = useRouter();
    const [user, setUser] = useState({});
    const [giveaways, setGiveaways] = useState([]);

    const fetchData = async () => {
        try {
            const { data } = await api.get("profile/", { meta: { auth: "user" } });
            setUser(data.myProfile || {});
            setGiveaways(data.giveaways || []);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

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
            <Footer />
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
                <p className="text-white text-sm font-medium">{value || "—"}</p>
            </div>
        </div>
    );
}

export default withUserAuth(HomePage, {
    loadingLabel: "Loading your profile...",
});
