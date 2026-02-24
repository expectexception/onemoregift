"use client";
import Image from "next/image";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useEffect, useState } from "react";
import { HiSparkles, HiGift } from "react-icons/hi";
import { FaTrophy } from "react-icons/fa";
import api from "../utils/apiClient";

export default function Winners() {
    const [giveaways, setGiveaways] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            let { data } = await api.get("giveaway/winners/");
            setGiveaways(data.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="min-h-screen flex flex-col bg-black">
            {/* Navbar */}
            <div className="sticky top-0 z-50">
                <Navbar />
            </div>

            {/* Hero Section */}
            <section className="relative py-20 px-6 overflow-hidden">
                {/* Background */}
                <div className="absolute inset-0 section-gradient">
                    <div className="absolute top-10 left-10 w-72 h-72 bg-red-600/5 rounded-full blur-[100px]" />
                    <div className="absolute bottom-10 right-10 w-96 h-96 bg-red-700/5 rounded-full blur-[120px]" />
                </div>

                <div className="relative z-10 max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6 border border-white/[0.06]">
                        <FaTrophy className="text-yellow-400" />
                        <span className="text-neutral-400 text-sm font-medium">Hall of Fame</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
                        Our <span className="text-gradient">Winners</span>
                    </h1>
                    <p className="text-lg text-neutral-500 max-w-2xl mx-auto">
                        Celebrating our lucky winners! Real people, real prizes, real happiness.
                    </p>
                </div>
            </section>

            {/* Winners Grid */}
            <section className="flex-1 section-dark py-12 px-6">
                <div className="max-w-7xl mx-auto">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="premium-card rounded-2xl p-6 animate-pulse">
                                    <div className="h-48 bg-white/[0.03] rounded-xl mb-4" />
                                    <div className="h-6 bg-white/[0.03] rounded w-3/4 mb-2" />
                                    <div className="h-4 bg-white/[0.03] rounded w-1/2" />
                                </div>
                            ))}
                        </div>
                    ) : giveaways.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="winners-grid">
                            {giveaways.map((giveaway, index) => (
                                <WinnerCard key={giveaway._id} giveaway={giveaway} delay={index * 0.1} />
                            ))}
                        </div>
                    ) : (
                        <div className="glass rounded-2xl p-16 text-center border border-white/[0.06]">
                            <div className="w-20 h-20 rounded-full bg-red-600/10 flex items-center justify-center mx-auto mb-6">
                                <FaTrophy className="text-4xl text-red-500" />
                            </div>
                            <h3 className="text-2xl font-semibold text-white mb-2">No Winners Yet</h3>
                            <p className="text-neutral-500">Winners will be announced soon. Stay tuned!</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Footer */}
            <Footer />
        </div>
    );
}

function WinnerCard({ giveaway, delay }) {
    return (
        <div
            className="premium-card rounded-2xl overflow-hidden animate-fade-up"
            style={{ animationDelay: `${delay}s` }}
        >
            {/* Image */}
            <div className="relative h-48 bg-neutral-900 flex items-center justify-center">
                <Image
                    src={giveaway.image}
                    alt={giveaway.title}
                    width={160}
                    height={160}
                    className="object-contain"
                />
                {/* Trophy Badge */}
                <div className="absolute top-3 right-3 w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
                    <FaTrophy className="text-white text-lg" />
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2">{giveaway.title}</h3>
                <p className="text-neutral-500 text-sm mb-4 line-clamp-2">{giveaway.description}</p>

                {/* Prize */}
                <div className="flex items-center gap-2 mb-4 p-3 rounded-xl glass">
                    <HiGift className="text-red-500 text-lg" />
                    <span className="text-white font-medium">{giveaway.prize}</span>
                </div>

                {/* Winners List */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <HiSparkles className="text-yellow-400" />
                        <span className="text-sm font-medium text-neutral-400">
                            {giveaway.winners.length} Winner{giveaway.winners.length > 1 ? 's' : ''}
                        </span>
                    </div>
                    <div className="space-y-2" data-testid={`winners-list-${giveaway._id}`}>
                        {giveaway.winners.map((winner, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]"
                                data-testid="winner-item"
                            >
                                <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-sm">
                                    {winner.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-white font-medium" data-testid="winner-name">{winner.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
