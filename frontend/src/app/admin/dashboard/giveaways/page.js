"use client";
import { DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import withAdminAuth from "../../../components/withAdminAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DataTable } from "../../../components/DataTable";
import { useToast } from "@/hooks/use-toast";
import { Eye, Edit2, Trash2, Plus, Gift, Target, Trophy, Clock, Search, ShieldCheck } from "lucide-react";
import api from "@/app/utils/apiClient";
import { cn } from "@/lib/utils";

const columns = [
    {
        accessorKey: "title",
        header: "Event Directive",
        cell: ({ row }) => <span className="font-bold text-white uppercase tracking-tight">{row.original.title}</span>
    },
    {
        accessorKey: "prize",
        header: "Asset",
        cell: ({ row }) => (
            <div className="flex items-center gap-2">
                <Gift className="w-3 h-3 text-red-500" />
                <span className="text-neutral-300 font-medium italic">{row.original.prize}</span>
            </div>
        )
    },
    {
        accessorKey: "winnerCount",
        header: "Slots",
        cell: ({ row }) => (
            <div className="flex items-center gap-2">
                <Trophy className="w-3 h-3 text-amber-500" />
                <span className="text-white font-black">{row.original.winnerCount}</span>
            </div>
        )
    },
    {
        accessorKey: "startDate",
        header: "Initiation",
        cell: ({ row }) => <span className="font-mono text-[10px] text-neutral-400 uppercase">{row.original.startDate}</span>,
    },
    {
        accessorKey: "endDate",
        header: "Termination",
        cell: ({ row }) => <span className="font-mono text-[10px] text-red-400/80 uppercase">{row.original.endDate}</span>,
    },
    {
        accessorKey: "actions",
        header: () => <div className="text-right uppercase tracking-widest text-[9px] font-black text-neutral-600">Operations</div>,
        cell: ({ row }) => <div className="text-right">{row.original.actions}</div>,
    },
];

function GiveawaysDashboardPage() {
    const { toast } = useToast();
    const router = useRouter();
    const containerRef = useRef(null);

    const [data, setData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(8);
    const [totalPages, setTotalPages] = useState(0);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedGiveawayId, setSelectedGiveawayId] = useState(null);

    // Cursor glow effect
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!containerRef.current) return;
            const { clientX, clientY } = e;
            const { left, top } = containerRef.current.getBoundingClientRect();
            containerRef.current.style.setProperty('--x', `${clientX - left}px`);
            containerRef.current.style.setProperty('--y', `${clientY - top}px`);
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const getData = async () => {
        try {
            const { data } = await api.get(
                `admin/giveaways?page=${currentPage}&limit=${pageSize}`,
                { meta: { auth: "admin" } }
            );

            const dayjsModule = await import("dayjs");
            const dayjs = dayjsModule.default;
            const utc = (await import("dayjs/plugin/utc")).default;
            const timezone = (await import("dayjs/plugin/timezone")).default;
            dayjs.extend(utc);
            dayjs.extend(timezone);
            const formatStr = "DD MMM YYYY | HH:mm";

            setData(
                data.data.map((item) => ({
                    ...item,
                    startDate: item.startDate ? dayjs(item.startDate).tz("Asia/Kolkata").format(formatStr) : "N/A",
                    endDate: item.endDate ? dayjs(item.endDate).tz("Asia/Kolkata").format(formatStr) : "N/A",
                    actions: (
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => router.push(`/admin/dashboard/giveaways/${item._id}`)}
                                className="w-8 h-8 rounded-lg bg-white/[0.02] border border-white/[0.05] flex items-center justify-center text-neutral-500 hover:text-blue-400 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all group"
                            >
                                <Eye className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            </button>
                            <button
                                onClick={() => router.push(`/admin/dashboard/giveaways/edit/${item._id}`)}
                                className="w-8 h-8 rounded-lg bg-white/[0.02] border border-white/[0.05] flex items-center justify-center text-neutral-500 hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all group"
                            >
                                <Edit2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedGiveawayId(item._id);
                                    setIsDeleteDialogOpen(true);
                                }}
                                className="w-8 h-8 rounded-lg bg-white/[0.02] border border-white/[0.05] flex items-center justify-center text-neutral-500 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/5 transition-all group"
                            >
                                <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            </button>
                        </div>
                    ),
                }))
            );
            setTotalPages(Math.ceil(data.total / pageSize));
        } catch (error) {
            toast({ title: "System Error", description: "Telemetry sync failed.", variant: "destructive" });
        }
    };

    useEffect(() => {
        getData();
    }, [currentPage]);

    const handleDelete = async () => {
        try {
            await api.delete(`giveaway/${selectedGiveawayId}`, {
                meta: { auth: "admin" },
            });
            toast({ title: "Purged", description: "Target asset removed from matrix.", variant: "success" });
            setIsDeleteDialogOpen(false);
            getData();
        } catch (error) {
            toast({ title: "Rejection", description: "Deactivation protocol failed.", variant: "destructive" });
        }
    };

    return (
        <div ref={containerRef} className="flex flex-col min-h-screen bg-black relative overflow-hidden cursor-glow-container p-6 md:p-10">
            <div className="absolute inset-0 section-gradient opacity-30 pointer-events-none" />

            <div className="relative z-10 space-y-10 animate-fade-in">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center shadow-xl shadow-red-900/20 shadow-inner border border-red-500/20">
                            <Gift className="text-white w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-white uppercase italic">
                                Event <span className="text-gradient">Registry</span>
                            </h2>
                            <p className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.3em] mt-1 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                Monitoring Active Contests
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={() => router.push('/admin/dashboard/add')}
                        className="h-14 px-8 btn-gradient rounded-2xl font-black text-xs uppercase tracking-[0.2em] italic shadow-2xl shadow-red-900/20 hover:scale-105 active:scale-95 transition-all group"
                    >
                        <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-500" />
                        Deploy New Event
                    </Button>
                </div>

                <div className="h-px bg-white/[0.06] w-full" />

                {/* Main Table Content */}
                <div className="relative rounded-[2.5rem] border border-white/[0.06] bg-white/[0.01] backdrop-blur-3xl overflow-hidden shadow-2xl group">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-red-600/40 to-transparent group-hover:via-red-600 transition-all duration-1000" />
                    <div className="p-4 md:p-8 overflow-x-auto custom-scrollbar">
                        <DataTable columns={columns} data={data} />
                    </div>

                    {/* Footer Controls */}
                    <div className="px-8 py-6 border-t border-white/[0.04] bg-white/[0.01] flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="px-4 py-2 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-2">
                                <span className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Protocol Page</span>
                                <span className="text-xs font-black text-white italic">{currentPage} <span className="text-neutral-700">/</span> {totalPages}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="h-10 px-6 bg-white/[0.02] border-white/[0.08] text-white hover:bg-white/[0.05] rounded-xl font-bold uppercase text-[10px] tracking-widest disabled:opacity-20"
                            >
                                Previous
                            </Button>
                            <div className="flex gap-1 px-2">
                                {[...Array(totalPages)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "w-1 h-1 rounded-full transition-all duration-500",
                                            currentPage === i + 1 ? "w-4 bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)]" : "bg-neutral-800"
                                        )}
                                    />
                                ))}
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="h-10 px-6 bg-white/[0.02] border-white/[0.08] text-white hover:bg-white/[0.05] rounded-xl font-bold uppercase text-[10px] tracking-widest disabled:opacity-20"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Intelligence Feed */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    <div className="p-6 rounded-3xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.02] transition-colors group">
                        <ShieldCheck className="w-5 h-5 text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
                        <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-2 text-center md:text-left">Security Verified</h4>
                        <p className="text-[9px] text-neutral-700 leading-relaxed uppercase italic">Every event in this registry is cryptographically signed and tracked for participant integrity.</p>
                    </div>
                    <div className="p-6 rounded-3xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.02] transition-colors group">
                        <Clock className="w-5 h-5 text-amber-500 mb-4 group-hover:scale-110 transition-transform" />
                        <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-2 text-center md:text-left">Chronos Sync</h4>
                        <p className="text-[9px] text-neutral-700 leading-relaxed uppercase italic">System execution triggers are synchronized with global server time every 60 seconds.</p>
                    </div>
                    <div className="p-6 rounded-3xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.02] transition-colors group">
                        <Target className="w-5 h-5 text-emerald-500 mb-4 group-hover:scale-110 transition-transform" />
                        <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-2 text-center md:text-left">Participant Flow</h4>
                        <p className="text-[9px] text-neutral-700 leading-relaxed uppercase italic">Real-time load balancing is active for all high-traffic deployment scenarios.</p>
                    </div>
                </div>
            </div>

            {/* Delete Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="bg-zinc-950 border border-white/[0.08] text-white rounded-3xl max-w-sm backdrop-blur-2xl">
                    <DialogHeader className="space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-600/10 flex items-center justify-center mx-auto mb-2 border border-red-500/20">
                            <Trash2 className="w-6 h-6 text-red-500" />
                        </div>
                        <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-center">Terminate <span className="text-red-600">Asset</span></DialogTitle>
                        <DialogDescription className="text-center text-neutral-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed px-6">
                            This operation will permanently purge the giveaway event and all associated participant telemetry from the matrix.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-3 mt-8">
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                            className="flex-1 h-12 bg-white/[0.02] hover:bg-white/[0.05] text-neutral-400 border-white/5 rounded-2xl font-black uppercase text-[10px] tracking-widest"
                        >
                            Abort
                        </Button>
                        <Button
                            onClick={handleDelete}
                            className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-900/20"
                        >
                            Confirm Purge
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default withAdminAuth(GiveawaysDashboardPage);
