"use client";
import Image from "next/image";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useEffect, useState } from "react";
import userImage from "../../../public/images/user.png";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, MapPin, Pencil, Gift } from "lucide-react";
import api from "@/app/utils/apiClient";
import withUserAuth from "../components/withUserAuth";

function Home() {
    const router = useRouter();
    let [user, setUser] = useState({});
    let [giveaways, setGiveaways] = useState([]);

    let data = async () => {
        try {
            let { data } = await api.get("profile/", {
                meta: { auth: "user" },
            });
            setUser(data.myProfile);
            setGiveaways(data.giveaways || []);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        data();
    }, []);

    const progressPercent = Math.min((giveaways.length / 100) * 100, 100);

    return (
        <div className="min-h-screen flex flex-col bg-black">
            <div className="sticky top-0 z-50">
                <Navbar />
            </div>

            {/* Profile Section */}
            <section className="relative py-16 px-6 overflow-hidden">
                <div className="absolute inset-0 section-gradient">
                    <div className="absolute top-10 right-10 w-72 h-72 bg-red-600/5 rounded-full blur-[100px]" />
                </div>
                <div className="relative z-10 max-w-4xl mx-auto">
                    <div className="text-center mb-10">
                        <h1 className="text-4xl font-bold text-white mb-2">My Profile</h1>
                        <p className="text-neutral-500">Manage your account details</p>
                    </div>

                    <div className="premium-card rounded-2xl p-8 max-w-md mx-auto">
                        {/* Avatar */}
                        <div className="flex justify-center mb-6">
                            <div className="w-24 h-24 rounded-full bg-neutral-800 border-2 border-white/[0.06] overflow-hidden">
                                <Image src={userImage} alt="Profile" width={96} height={96} className="rounded-full object-cover" />
                            </div>
                        </div>

                        {/* Info */}
                        <div className="space-y-4 mb-6">
                            <InfoRow icon={<User size={18} />} label="Name" value={user.name} />
                            <InfoRow icon={<Mail size={18} />} label="Email" value={user.email} />
                            <InfoRow icon={<Phone size={18} />} label="Phone" value={user.phone} />
                            <InfoRow icon={<MapPin size={18} />} label="Address" value={user?.address || "Not set"} />
                        </div>

                        {/* Edit Button */}
                        <Button
                            className="w-full btn-gradient rounded-xl h-11 font-medium"
                            onClick={() => router.push("/my-profile/edit")}
                        >
                            <Pencil size={18} className="mr-2" />
                            Edit Profile
                        </Button>
                    </div>
                </div>
            </section>

            {/* Giveaways Section */}
            <section className="py-12 px-6">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-white text-center mb-2">Joined Giveaways</h2>

                    {/* Progress */}
                    <div className="max-w-lg mx-auto mb-10">
                        <p className="text-center text-neutral-400 mb-3">
                            You have joined <span className="text-red-400 font-bold">{giveaways.length}</span> giveaways
                        </p>
                        <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden border border-white/[0.06]">
                            <div
                                className="h-full bg-gradient-to-r from-red-600 to-red-500 rounded-full transition-all duration-500"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                        {giveaways.length >= 100 ? (
                            <p className="text-center text-green-400 text-sm mt-3">
                                Congratulations! You&apos;ve joined 100+ giveaways you qualify for a special bonus gift!
                            </p>
                        ) : (
                            <p className="text-center text-neutral-500 text-sm mt-3">
                                Join 100 giveaways without winning to receive a special gift from us!
                            </p>
                        )}
                    </div>

                    {/* Giveaway Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {giveaways.length > 0 ? (
                            giveaways.map((giveaway) => {
                                const hasWinners = giveaway.winners.length > 0;
                                const isWinner = hasWinners && giveaway.winners.includes(user._id);

                                return (
                                    <div key={giveaway._id} className="premium-card rounded-xl overflow-hidden group">
                                        <div className="relative h-48 bg-neutral-900 overflow-hidden">
                                            <Image
                                                src={giveaway.image}
                                                alt={giveaway.title}
                                                width={400}
                                                height={200}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
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
                                            {hasWinners && (
                                                <div className="mt-4">
                                                    <Link href="/winners">
                                                        <Badge className={`px-4 py-1.5 text-sm ${isWinner ? "bg-green-600 hover:bg-green-700" : "bg-neutral-700 hover:bg-neutral-600"}`}>
                                                            {isWinner ? "🎉 You Won!" : "See Winners"}
                                                        </Badge>
                                                    </Link>
                                                </div>
                                            )}
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

export default withUserAuth(Home, {
    loadingLabel: "Loading your profile...",
});
