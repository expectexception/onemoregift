"use client";
import { DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import withAdminAuth from "../../../components/withAdminAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DataTable } from "../../../components/DataTable";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Gift, Target, Trophy, Clock, ShieldCheck } from "lucide-react";
import api from "@/app/utils/apiClient";
import { cn } from "@/lib/utils";

function ViewSvg() {
    return <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" /><circle cx="12" cy="12" r="3" /></svg>;
}
function EditSvg() {
    return <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z" /><path d="m13.5 6.5 3 3" /></svg>;
}
function DeleteSvg() {
    return <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></svg>;
}

const columns = [
    {
        accessorKey: "title",
        header: "Event Directive",
        cell: ({ row }) => <span className="font-bold text-white  tracking-tight">{row.original.title}</span>
    },
    {
        accessorKey: "prize",
        header: "Asset",
        cell: ({ row }) => (
            <div className="flex items-center gap-2">
                <Gift className="w-3 h-3 text-red-500" />
                <span className="text-neutral-300 font-medium">{row.original.prize}</span>
            </div>
        )
    },
    {
        accessorKey: "winnerCount",
        header: "Slots",
        cell: ({ row }) => (
            <div className="flex items-center gap-2">
                <Trophy className="w-3 h-3 text-amber-500" />
                <span className="text-white font-semibold">{row.original.winnerCount}</span>
            </div>
        )
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${row.original.statusColor}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${row.original.statusLabel === "Running" ? "bg-emerald-400 animate-pulse" : row.original.statusLabel === "Pending" ? "bg-blue-400" : "bg-red-400"}`} />
                {row.original.statusLabel}
            </div>
        )
    },
    {
        accessorKey: "startDate",
        header: "Initiation",
        cell: ({ row }) => <span className="font-mono text-[10px] text-neutral-400 ">{row.original.startDate}</span>,
    },
    {
        accessorKey: "endDate",
        header: "Termination",
        cell: ({ row }) => <span className="font-mono text-[10px] text-red-400/80 ">{row.original.endDate}</span>,
    },
    {
        accessorKey: "actions",
        header: () => <div className="text-right  tracking-widest text-[9px] font-semibold text-neutral-600">Operations</div>,
        cell: ({ row }) => <div className="text-right">{row.original.actions}</div>,
    },
];

function GiveawaysDashboardPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [data, setData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(8);
    const [totalPages, setTotalPages] = useState(0);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedGiveawayId, setSelectedGiveawayId] = useState(null);

    const getData = useCallback(async () => {
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
                data.data.map((item) => {
                    const now = dayjs().tz("Asia/Kolkata");
                    const start = item.startDate ? dayjs(item.startDate).tz("Asia/Kolkata") : null;
                    const end = item.endDate ? dayjs(item.endDate).tz("Asia/Kolkata") : null;
                    
                    let statusLabel = "Running";
                    let statusColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                    
                    if (start && now.isBefore(start)) {
                        statusLabel = "Pending";
                        statusColor = "bg-blue-500/10 text-blue-400 border-blue-500/20";
                    } else if (end && now.isAfter(end)) {
                        statusLabel = "Ended";
                        statusColor = "bg-red-500/10 text-red-400 border-red-500/20";
                    }

                    return {
                        ...item,
                        statusLabel,
                        statusColor,
                        startDate: item.startDate ? dayjs(item.startDate).tz("Asia/Kolkata").format(formatStr) : "N/A",
                        endDate: item.endDate ? dayjs(item.endDate).tz("Asia/Kolkata").format(formatStr) : "N/A",
                        actions: (
                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={() => router.push(`/admin/dashboard/giveaways/${item._id}`)}
                                    className="admin-action-btn view"
                                >
                                    <ViewSvg />
                                </button>
                                <button
                                    onClick={() => router.push(`/admin/dashboard/giveaways/edit/${item._id}`)}
                                    className="admin-action-btn edit"
                                >
                                    <EditSvg />
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedGiveawayId(item._id);
                                        setIsDeleteDialogOpen(true);
                                    }}
                                    className="admin-action-btn danger"
                                >
                                    <DeleteSvg />
                                </button>
                            </div>
                        ),
                    };
                })
            );
            setTotalPages(Math.ceil(data.total / pageSize));
        } catch (error) {
            toast({ title: "System Error", description: "Data loading failed.", variant: "destructive" });
        }
    }, [currentPage, pageSize, router, toast]);

    useEffect(() => {
        getData();
    }, [getData]);

    const handleDelete = async () => {
        try {
            await api.delete(`giveaway/${selectedGiveawayId}`, {
                meta: { auth: "admin" },
            });
            toast({ title: "Deleted", description: "Giveaway has been deleted.", variant: "success" });
            setIsDeleteDialogOpen(false);
            getData();
        } catch (error) {
            toast({ title: "Rejection", description: "Deactivation protocol failed.", variant: "destructive" });
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-[#070707] p-4 md:p-8">
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500/20 to-amber-500/5 border border-red-500/30 flex items-center justify-center shadow-[0_8px_32px_-8px_rgba(239,68,68,0.35)] shrink-0">
                            <Gift className="text-red-400 w-7 h-7" />
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
                                Giveaway Management
                            </h2>
                            <p className="text-xs text-neutral-500 font-medium mt-1 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                Manage your giveaways and prizes
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={() => router.push('/admin/dashboard/add')}
                        className="h-11 px-5 rounded-lg bg-red-600 font-semibold text-sm text-white hover:bg-red-500"
                    >
                        <Plus className="w-3 h-3 md:w-4 md:h-4 mr-2 group-hover:rotate-90 transition-transform duration-500" />
                        Create Giveaway
                    </Button>
                </div>

                <div className="h-px bg-white/[0.06] w-full" />

                {/* Main Table Content */}
                <div className="admin-table-shell shadow-2xl">
                    <div className="p-0 md:p-8 overflow-x-auto custom-scrollbar">
                        <div className="min-w-[800px] md:min-w-0">
                            <DataTable columns={columns} data={data} />
                        </div>
                    </div>

                    {/* Footer Controls */}
                    <div className="px-8 py-6 border-t border-white/[0.04] bg-white/[0.01] flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="px-4 py-2 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-2">
                                <span className="text-xs font-medium text-neutral-500">Page</span>
                                <span className="text-xs font-semibold text-white">{currentPage} <span className="text-neutral-700">/</span> {totalPages}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="h-10 px-5 bg-white/[0.02] border-white/[0.08] text-white hover:bg-white/[0.05] rounded-lg font-semibold text-xs disabled:opacity-20"
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
                                className="h-10 px-5 bg-white/[0.02] border-white/[0.08] text-white hover:bg-white/[0.05] rounded-lg font-semibold text-xs disabled:opacity-20"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-5 rounded-lg admin-panel hover:bg-white/[0.02] transition-colors">
                        <ShieldCheck className="w-5 h-5 text-blue-500 mb-4" />
                        <h4 className="text-sm font-semibold text-neutral-300 mb-2 text-center md:text-left">Verified</h4>
                        <p className="text-xs text-neutral-600 leading-relaxed">All giveaways are securely tracked for fairness.</p>
                    </div>
                    <div className="p-5 rounded-lg admin-panel hover:bg-white/[0.02] transition-colors">
                        <Clock className="w-5 h-5 text-amber-500 mb-4" />
                        <h4 className="text-sm font-semibold text-neutral-300 mb-2 text-center md:text-left">System time</h4>
                        <p className="text-xs text-neutral-600 leading-relaxed">Giveaway timings are synchronized with global server time.</p>
                    </div>
                    <div className="p-5 rounded-lg admin-panel hover:bg-white/[0.02] transition-colors">
                        <Target className="w-5 h-5 text-emerald-500 mb-4" />
                        <h4 className="text-sm font-semibold text-neutral-300 mb-2 text-center md:text-left">Activity</h4>
                        <p className="text-xs text-neutral-600 leading-relaxed">Real-time monitoring is active for all contest participants.</p>
                    </div>
                </div>
            </div>

            {/* Delete Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="bg-zinc-950 border border-white/[0.08] text-white rounded-lg max-w-sm">
                    <DialogHeader className="space-y-4">
                        <div className="w-12 h-12 rounded-lg bg-red-600/10 flex items-center justify-center mx-auto mb-2 border border-red-500/20">
                            <Trash2 className="w-6 h-6 text-red-500" />
                        </div>
                        <DialogTitle className="text-2xl font-semibold tracking-tight text-center">Delete <span className="text-red-600">Giveaway</span></DialogTitle>
                        <DialogDescription className="text-center text-neutral-500 text-sm font-medium leading-relaxed px-6">
                            This will permanently delete the giveaway and all participant data.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-3 mt-8">
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                            className="flex-1 h-12 bg-white/[0.02] hover:bg-white/[0.05] text-neutral-400 border-white/5 rounded-lg font-semibold text-xs"
                        >
                            Abort
                        </Button>
                        <Button
                            onClick={handleDelete}
                            className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-xs"
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
