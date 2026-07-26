"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
    XCircle,
    Search,
    Trash2,
    Users,
    Chrome,
    RefreshCw,
} from "lucide-react";
import api from "@/app/utils/apiClient";

const TABS = [
    { key: "all", label: "All Users" },
    { key: "active", label: "Active" },
    { key: "blocked", label: "Blocked" },
];

function ViewSvg() {
    return <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" /><circle cx="12" cy="12" r="3" /></svg>;
}
function BlockSvg() {
    return <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="m7 7 10 10" /></svg>;
}
function AllowSvg() {
    return <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5 4.5-5" /></svg>;
}
function DeleteSvg() {
    return <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></svg>;
}

const UsersPage = () => {
    const router = useRouter();
    const { toast } = useToast();
    const [users, setUsers] = useState([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("all");

    // Unified dialog state (one dialog, no shared-state bug)
    const [dialog, setDialog] = useState({ open: false, type: null, user: null });
    const [banReason, setBanReason] = useState("");
    const [banDuration, setBanDuration] = useState("");

    const limit = 10;

    const fetchUsers = useCallback(async (overridePage, overrideTab) => {
        setLoading(true);
        try {
            const currentPage = overridePage ?? page;
            const currentTab = overrideTab ?? activeTab;
            let query = `page=${currentPage}&limit=${limit}`;
            if (currentTab === "blocked") query += "&blocked=true";
            if (currentTab === "active") query += "&blocked=false";

            const response = await api.get(`admin/all-users?${query}`, {
                meta: { auth: "admin" },
            });
            setUsers(response.data.data || []);
            setTotal(response.data.total || 0);
        } catch (error) {
            if (error?.response?.status === 401) {
                toast({
                    title: "Session Expired",
                    variant: "destructive",
                    description: (
                        <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4" />
                            <span>Please login again.</span>
                        </div>
                    ),
                });
                router.push("/admin/");
            }
        } finally {
            setLoading(false);
        }
    }, [activeTab, page, router, toast]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setPage(1);
        setSearch("");
    };

    const handleSearch = async () => {
        const trimmed = search.trim();
        if (!trimmed) {
            fetchUsers(1);
            return;
        }

        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
        const isPhone = /^\d{10}$/.test(trimmed);

        if (!isEmail && !isPhone) {
            toast({
                title: "Invalid Search",
                variant: "destructive",
                description: "Enter a valid email or 10-digit phone number.",
            });
            return;
        }

        setLoading(true);
        try {
            const query = isEmail ? `email=${trimmed}` : `phone=${trimmed}`;
            const response = await api.get(`admin/all-users?${query}`, {
                meta: { auth: "admin" },
            });
            setUsers(response.data.data || []);
            setTotal(response.data.total || 0);
            setPage(1);
        } catch {
            toast({ title: "Search Failed", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const closeDialog = () => {
        setDialog({ open: false, type: null, user: null });
        setBanReason("");
        setBanDuration("");
    };

    const handleDelete = async () => {
        try {
            const { data } = await api.post(
                "admin/users/del",
                { userId: dialog.user._id },
                { meta: { auth: "admin" } }
            );
            if (!data.error) {
                toast({ title: "User Deleted", description: `${dialog.user.name} has been removed.` });
                fetchUsers();
            } else {
                toast({ title: "Error", variant: "destructive", description: data.msg });
            }
        } catch {
            toast({ title: "Error", variant: "destructive", description: "Delete failed." });
        } finally {
            closeDialog();
        }
    };

    const handleBan = async (ban) => {
        try {
            const endpoint = ban ? "admin/users/ban" : "admin/users/unban";
            const payload = { userId: dialog.user._id };
            if (ban) {
                if (banReason.trim()) payload.reason = banReason.trim();
                if (banDuration) payload.durationDays = Number(banDuration);
            }
            const { data } = await api.post(
                endpoint,
                payload,
                { meta: { auth: "admin" } }
            );
            if (!data.error) {
                toast({
                    title: ban ? "User Blocked" : "User Unblocked",
                    description: `${dialog.user.name} has been ${ban ? "blocked" : "unblocked"}.`,
                });
                fetchUsers();
            } else {
                toast({ title: "Error", variant: "destructive", description: data.msg });
            }
        } catch {
            toast({ title: "Error", variant: "destructive" });
        } finally {
            closeDialog();
        }
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="min-h-screen bg-black p-4 md:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500/20 to-amber-500/5 border border-red-500/30 flex items-center justify-center shadow-[0_8px_32px_-8px_rgba(239,68,68,0.35)] shrink-0">
                        <Users className="text-red-400 w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white ">User Management</h1>
                        <p className="text-[10px] text-neutral-500 font-bold  tracking-widest mt-1">
                            {total} total user{total !== 1 ? "s" : ""}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => fetchUsers()}
                    disabled={loading}
                    className="self-start md:self-center flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] text-neutral-400 hover:text-white transition-all text-[10px] font-bold  tracking-widest"
                >
                    <RefreshCw className={`w-3 h-3 md:w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    <span>Refresh</span>
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-8 w-full md:w-fit">
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => handleTabChange(tab.key)}
                        className={`flex-1 md:flex-none px-4 md:px-5 py-2 rounded-lg text-[10px] font-semibold  tracking-widest transition-all duration-300 ${activeTab === tab.key
                            ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                            : "text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.03]"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="flex flex-col sm:flex-row items-center gap-3 mb-6 max-w-md w-full">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <Input
                        placeholder="Search by email or phone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        className="pl-9 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-neutral-600 h-11 rounded-xl text-xs"
                    />
                </div>
                <Button
                    onClick={handleSearch}
                    disabled={loading}
                    className="w-full sm:w-auto px-8 bg-red-600 hover:bg-red-700 text-white border-0 h-11 rounded-xl font-semibold  text-[10px] tracking-widest shadow-lg shadow-red-900/20"
                >
                    Search
                </Button>
            </div>

            {/* Table */}
            <div className="admin-table-shell mb-6">
                <div className="overflow-x-auto custom-scrollbar">
                    <div className="min-w-[600px]">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.02]">
                                    <TableHead className="text-neutral-400 font-medium">User</TableHead>
                                    <TableHead className="text-neutral-400 font-medium hidden md:table-cell">Phone</TableHead>
                                    <TableHead className="text-neutral-400 font-medium">Status</TableHead>
                                    <TableHead className="text-neutral-400 font-medium hidden lg:table-cell">Auth</TableHead>
                                    <TableHead className="text-neutral-400 font-medium hidden lg:table-cell">Joined</TableHead>
                                    <TableHead className="text-neutral-400 font-medium text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i} className="border-white/[0.04]">
                                            <TableCell colSpan={6}>
                                                <div className="h-5 w-full bg-white/[0.04] rounded animate-pulse" />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : users.length > 0 ? (
                                    users.map((user) => (
                                        <TableRow
                                            key={user._id}
                                            className="border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                                        >
                                            <TableCell>
                                                <div>
                                                    <div className="text-sm font-medium text-white">{user.name}</div>
                                                    <div className="text-xs text-neutral-500 mt-0.5">{user.email}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell text-sm text-neutral-400">
                                                {user.phone && !user.phone.startsWith("google_") ? user.phone : (
                                                    <span className="text-neutral-600 text-xs">not set</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold  tracking-wider ${user.blocked
                                                    ? "bg-red-500/10 text-red-500 border border-red-500/20"
                                                    : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${user.blocked ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"}`} />
                                                    {user.blocked ? "Blocked" : "Active"}
                                                </span>
                                                {user.blocked && (user.banReason || user.banExpiresAt) && (
                                                    <div className="text-[10px] text-neutral-500 mt-1 max-w-[160px] truncate" title={user.banReason}>
                                                        {user.banReason || "No reason given"}
                                                        {user.banExpiresAt && (
                                                            <> · until {new Date(user.banExpiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</>
                                                        )}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell">
                                                {user.isGoogleAuth ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-600/10 text-amber-400 border border-amber-600/20">
                                                        <Chrome className="w-3 h-3" />
                                                        Google
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-neutral-500">Email</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell text-xs text-neutral-500">
                                                {user.createdAt
                                                    ? new Date(user.createdAt).toLocaleDateString("en-IN", {
                                                        day: "numeric", month: "short", year: "numeric"
                                                    })
                                                    : "-"}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => router.push(`/admin/dashboard/users/${user._id}`)}
                                                        title="View Profile"
                                                        className="admin-action-btn view"
                                                    >
                                                        <ViewSvg />
                                                    </button>
                                                    {user.blocked ? (
                                                        <button
                                                            onClick={() => setDialog({ open: true, type: "unban", user })}
                                                            title="Unblock User"
                                                            className="admin-action-btn edit"
                                                        >
                                                            <AllowSvg />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => setDialog({ open: true, type: "ban", user })}
                                                            title="Block User"
                                                            className="admin-action-btn warn"
                                                        >
                                                            <BlockSvg />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => setDialog({ open: true, type: "delete", user })}
                                                        title="Delete User"
                                                        className="admin-action-btn danger"
                                                    >
                                                        <DeleteSvg />
                                                    </button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12">
                                            <div className="flex flex-col items-center gap-3">
                                                <Users className="w-10 h-10 text-neutral-700" />
                                                <span className="text-neutral-500 text-sm">No users found</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                    <Button
                        variant="secondary"
                        onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                        disabled={page === 1 || loading}
                        className="bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 border-white/[0.06]"
                    >
                        Previous
                    </Button>
                    <span className="text-sm text-neutral-500">
                        Page {page} of {totalPages}
                    </span>
                    <Button
                        variant="secondary"
                        onClick={() => setPage((prev) => (prev < totalPages ? prev + 1 : prev))}
                        disabled={page === totalPages || loading}
                        className="bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 border-white/[0.06]"
                    >
                        Next
                    </Button>
                </div>
            )}

            {/* Unified Confirmation Dialog */}
            <Dialog open={dialog.open} onOpenChange={(open) => !open && closeDialog()}>
                <DialogContent className="bg-zinc-950 border border-white/[0.08] text-white">
                    <DialogHeader>
                        <DialogTitle>
                            {dialog.type === "delete" && "Delete User"}
                            {dialog.type === "ban" && "Block User"}
                            {dialog.type === "unban" && "Unblock User"}
                        </DialogTitle>
                        <DialogDescription className="text-neutral-400">
                            {dialog.type === "delete" &&
                                `Are you sure you want to permanently delete ${dialog.user?.name}? This action cannot be undone.`}
                            {dialog.type === "ban" &&
                                `Block ${dialog.user?.name}? They will not be able to login or participate in giveaways.`}
                            {dialog.type === "unban" &&
                                `Unblock ${dialog.user?.name}? They will regain full access to the platform.`}
                        </DialogDescription>
                    </DialogHeader>
                    {dialog.type === "ban" && (
                        <div className="space-y-3 py-1">
                            <div>
                                <label className="text-[10px] font-bold tracking-widest text-neutral-500 mb-1.5 block">
                                    REASON (optional)
                                </label>
                                <Input
                                    placeholder="e.g. Spam, abusive behavior..."
                                    value={banReason}
                                    onChange={(e) => setBanReason(e.target.value)}
                                    className="bg-white/[0.03] border-white/[0.08] text-white placeholder:text-neutral-600 text-xs"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold tracking-widest text-neutral-500 mb-1.5 block">
                                    DURATION IN DAYS (blank = permanent)
                                </label>
                                <Input
                                    type="number"
                                    min="1"
                                    placeholder="e.g. 7"
                                    value={banDuration}
                                    onChange={(e) => setBanDuration(e.target.value)}
                                    className="bg-white/[0.03] border-white/[0.08] text-white placeholder:text-neutral-600 text-xs"
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter className="gap-2">
                        <Button
                            variant="secondary"
                            onClick={closeDialog}
                            className="bg-white/[0.06] hover:bg-white/[0.1] text-neutral-300 border-0"
                        >
                            Cancel
                        </Button>
                        {dialog.type === "delete" && (
                            <Button
                                onClick={handleDelete}
                                className="bg-red-600 hover:bg-red-700 text-white border-0"
                            >
                                Delete
                            </Button>
                        )}
                        {dialog.type === "ban" && (
                            <Button
                                onClick={() => handleBan(true)}
                                className="bg-amber-600 hover:bg-amber-700 text-white border-0"
                            >
                                Block User
                            </Button>
                        )}
                        {dialog.type === "unban" && (
                            <Button
                                onClick={() => handleBan(false)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white border-0"
                            >
                                Unblock User
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default UsersPage;
