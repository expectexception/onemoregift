/** @format */
"use client";

import { useState, useEffect } from "react";
import { Nav } from "@/components/ui/nav";
import {
    LayoutDashboard,
    ChevronRight,
    UsersRound,
    Gift,
    BadgePlus,
    LogOut,
    Trophy,
    ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWindowWidth } from "@react-hook/window-size";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

export default function AdminSidebar() {
    const [mounted, setMounted] = useState(false);
    const onlyWidth = useWindowWidth();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const mobileWidth = mounted ? onlyWidth < 768 : false;

    function toggleSidebar() {
        setIsCollapsed(!isCollapsed);
    }

    function toggleMobileMenu() {
        setIsMobileOpen(!isMobileOpen);
    }

    const navLinks = [
        {
            title: "Dashboard",
            href: "/admin/dashboard",
            icon: LayoutDashboard,
            variant: "default"
        },
        {
            title: "Users",
            href: "/admin/dashboard/users",
            icon: UsersRound,
            variant: "ghost"
        },
        {
            title: "Giveaways",
            href: "/admin/dashboard/giveaways",
            icon: Gift,
            variant: "ghost"
        },
        {
            title: "Add Giveaway",
            href: "/admin/dashboard/add",
            icon: BadgePlus,
            variant: "ghost"
        },
        {
            title: "Winners",
            href: "/admin/dashboard/winners",
            icon: Trophy,
            variant: "ghost"
        },
        {
            title: "Logout",
            href: "/admin/logout",
            icon: LogOut,
            variant: "ghost"
        }
    ];

    return (
        <>
            {/* Mobile Toggle Button */}
            {mounted && mobileWidth && (
                <button
                    onClick={toggleMobileMenu}
                    className={cn(
                        "fixed top-6 z-[60] w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-900/40 border border-red-500/20 active:scale-95 transition-all",
                        isMobileOpen ? "left-[215px]" : "left-6"
                    )}
                >
                    {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            )}

            {/* Mobile Backdrop */}
            {mounted && mobileWidth && isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45] animate-in fade-in duration-300"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            <div
                className={cn(
                    "relative flex flex-col border-r border-white/[0.06] bg-black transition-all duration-500 ease-in-out z-50",
                    mobileWidth
                        ? (isMobileOpen ? "fixed inset-y-0 left-0 w-[260px] translate-x-0" : "fixed inset-y-0 left-0 w-[260px] -translate-x-full")
                        : (isCollapsed ? "w-[80px]" : "w-[260px]")
                )}
            >
                {/* Branding Area */}
                <div className="h-24 flex items-center px-6 border-b border-white/[0.04]">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center shrink-0 shadow-lg shadow-red-900/20 shadow-inner">
                        <span className="text-white font-black italic text-xl">A</span>
                    </div>
                    {(mounted && !isCollapsed && !mobileWidth) || (mobileWidth && isMobileOpen) ? (
                        <div className="ml-4 animate-in fade-in slide-in-from-left-2 duration-500">
                            <h1 className="text-white font-black italic tracking-tighter text-lg uppercase leading-none">Admin</h1>
                            <span className="text-[10px] text-neutral-600 font-bold uppercase tracking-[0.2em]">Management</span>
                        </div>
                    ) : null}
                </div>

                {/* Navigation */}
                <div className="flex-1 px-3 py-6 overflow-y-auto custom-scrollbar">
                    <Nav
                        isCollapsed={mobileWidth ? false : isCollapsed}
                        links={navLinks}
                    />
                </div>

                {/* Sidebar Toggle */}
                {mounted && !mobileWidth && (
                    <button
                        id="sidebar-toggle"
                        aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                        onClick={toggleSidebar}
                        className="absolute -right-3 top-28 w-6 h-6 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-md flex items-center justify-center text-neutral-500 hover:text-white hover:bg-white/[0.1] transition-all duration-300 shadow-xl"
                    >
                        {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
                    </button>
                )}

                {/* Footer Attribution */}
                {mounted && !isCollapsed && !mobileWidth && (
                    <div className="p-6 border-t border-white/[0.04] animate-in fade-in duration-700">
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                            <p className="text-[9px] text-neutral-600 font-bold uppercase tracking-widest text-center">
                                OneMoreGift System
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
