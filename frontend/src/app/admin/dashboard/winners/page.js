"use client"
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import withAdminAuth from "../../../components/withAdminAuth";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import {
    Card,
    CardContent,
} from "../../../../components/ui/card";
import gift1 from "../../../../../public/images/gift-1.png";
import api from "@/app/utils/apiClient";
import { Eye, Trophy, Calendar, Users, Search, Gift } from "lucide-react";

function formatDateTime(iso) {
    if (!iso) return "-";
    try {
        const d = new Date(iso);
        return d.toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch (e) {
        return iso;
    }
}

function Page() {
    const [items, setItems] = useState([]);
    const [q, setQ] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const fetchWinners = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`admin/winners`, {
                meta: { auth: "admin" },
            });
            setItems(Array.isArray(data.data) ? data.data : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWinners();
    }, []);

    const filtered = items.filter((it) =>
        it.title?.toLowerCase().includes(q.toLowerCase()) ||
        it.prize?.toLowerCase().includes(q.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-black">
            <div className="max-w-7xl mx-auto p-4 md:p-8 animate-fade-in">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Giveaways & Winners</h1>
                        <p className="text-sm text-neutral-500 mt-1">Track victorious participants and reward distributions</p>
                    </div>
                </div>

                <div className="mb-8 flex flex-col md:flex-row items-center gap-4">
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within:text-red-400 transition-colors" />
                        <Input
                            id="search"
                            placeholder="Search by title or prize..."
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            className="premium-input pl-10 h-11 bg-white/[0.03] border-white/[0.08] text-white rounded-xl"
                        />
                    </div>
                    <div className="text-xs font-semibold text-neutral-600 uppercase tracking-widest pl-1">
                        {loading ? 'Refreshing data...' : `${filtered.length} Contests Found`}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((g) => (
                        <Card key={g._id} className="premium-card border-white/[0.06] bg-white/[0.02] rounded-2xl overflow-hidden group hover:bg-white/[0.04] transition-all duration-300">
                            <div className="relative h-48 overflow-hidden">
                                <Image
                                    src={g.image || gift1}
                                    alt={g.title}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-500 opacity-80"
                                    sizes="(max-width: 768px) 100vw, 33vw"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60" />
                                <div className="absolute top-4 right-4">
                                    <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-bold text-red-400 border border-red-400/20 flex items-center gap-1.5 uppercase tracking-wider">
                                        <Trophy className="w-3 h-3" />
                                        {g.winners?.length || 0} Winners
                                    </span>
                                </div>
                            </div>
                            <CardContent className="p-6">
                                <div className="mb-4">
                                    <h3 className="text-lg font-bold text-white line-clamp-1 mb-1">{g.title}</h3>
                                    <p className="text-sm text-neutral-400 font-medium flex items-center gap-2">
                                        <Gift className="w-3.5 h-3.5 text-red-500" />
                                        {g.prize}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] mb-6">
                                    <div className="space-y-1">
                                        <span className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest block">Start Date</span>
                                        <span className="text-xs text-neutral-300 flex items-center gap-1.5">
                                            <Calendar className="w-3 h-3 text-neutral-500" />
                                            {formatDateTime(g.startDate).split(',')[0]}
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest block">Participants</span>
                                        <span className="text-xs text-neutral-300 flex items-center gap-1.5">
                                            <Users className="w-3 h-3 text-neutral-500" />
                                            {g.maxParticipants} Max
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest flex items-center gap-2">
                                        <Trophy className="w-3 h-3 text-red-500" />
                                        Recent Winners
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {g.winners?.length ? (
                                            g.winners.slice(0, 4).map((w, idx) => (
                                                <Link key={idx} href={`/admin/dashboard/users/${w._id}`}>
                                                    <span className="px-2.5 py-1 bg-white/[0.04] hover:bg-white/[0.08] rounded-lg text-xs font-semibold text-white border border-white/[0.06] transition-colors">{w.name}</span>
                                                </Link>
                                            ))
                                        ) : (
                                            <span className="text-xs text-neutral-600 italic">Winners not announced yet</span>
                                        )}
                                        {g.winners?.length > 4 && (
                                            <span className="px-2.5 py-1 text-xs text-neutral-500 font-medium">+{g.winners.length - 4} more</span>
                                        )}
                                    </div>
                                </div>

                                <Link href={`/admin/dashboard/giveaways/${g._id}`} className="block mt-6">
                                    <Button className="w-full h-10 btn-outline-premium rounded-xl text-xs font-bold gap-2">
                                        <Eye className="w-3.5 h-3.5" />
                                        Manage Contest
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default withAdminAuth(Page);