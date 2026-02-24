"use client"
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Disclaimer from "@/app/components/Disclaimer";
import { useState, useEffect, use } from "react";
import GiveawayDetails from "@/app/components/GiveawayDetails";
import api from "@/app/utils/apiClient";

export default function Page({ params }) {
    const slug = use(params).id
    let [giveaway, setGiveaway] = useState({});
    let [loading, setLoading] = useState(true);

    let fetchGiveaway = async () => {
        try {
            const { data } = await api.get(`giveaway/${slug}`);
            setGiveaway(data.giveaway);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGiveaway();
        const interval = setInterval(fetchGiveaway, 10000); // Poll every 10 seconds for real-time stats
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen flex flex-col">
            <div className="sticky top-0 z-50">
                <Navbar />
            </div>
            <main className="flex-1 section-dark py-8">
                {loading ? (
                    <div className="max-w-3xl mx-auto px-4">
                        <div className="premium-card rounded-3xl p-8 animate-pulse">
                            <div className="h-72 bg-white/[0.03] rounded-xl mb-8" />
                            <div className="h-8 bg-white/[0.03] rounded w-3/4 mb-4" />
                            <div className="h-4 bg-white/[0.03] rounded w-full mb-2" />
                            <div className="h-4 bg-white/[0.03] rounded w-2/3" />
                        </div>
                    </div>
                ) : (
                    <GiveawayDetails data={giveaway} />
                )}
            </main>
            <Disclaimer />
            <Footer />
        </div>
    )
}