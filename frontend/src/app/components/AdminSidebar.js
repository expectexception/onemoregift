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

function AdminMonogram() {
    return (
        <svg viewBox="0 0 44 44" className="w-6 h-6" fill="none" aria-hidden="true">
            <rect x="2" y="2" width="40" height="40" rx="12" fill="rgba(255,255,255,0.12)" />
            <path d="M14 30L20.5 14H23.5L30 30H26.8L25.4 26.3H18.6L17.2 30H14ZM19.6 23.8H24.4L22 17.3L19.6 23.8Z" fill="white" />
        </svg>
    );
}

export default function AdminSidebar({ isMobileOpen, setIsMobileOpen }) {
    const [mounted, setMounted] = useState(false);
    const onlyWidth = useWindowWidth();
    const [isCollapsed, setIsCollapsed] = useState(false);

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
        <div
            className={cn(
                "relative flex h-screen shrink-0 flex-col overflow-hidden border-r border-white/10 bg-[#0b0b0b] transition-all duration-300 ease-in-out z-50 lg:sticky lg:top-0",
                mobileWidth
                    ? (isMobileOpen ? "fixed inset-y-0 left-0 w-[260px] translate-x-0" : "fixed inset-y-0 left-0 w-[260px] -translate-x-full")
                    : (isCollapsed ? "w-[80px]" : "w-[260px]")
            )}
        >
            {/* Branding Area */}
            <div className="h-20 flex items-center px-5 border-b border-white/10 relative overflow-hidden">
                <div className="w-10 h-10 rounded-md bg-red-600 flex items-center justify-center shrink-0">
                    <AdminMonogram />
                </div>
                {(mounted && !isCollapsed && !mobileWidth) || (mobileWidth && isMobileOpen) ? (
                    <div className="ml-3 animate-in fade-in slide-in-from-left-2 duration-300">
                        <h1 className="text-white font-semibold text-base leading-none">Admin</h1>
                        <span className="text-xs text-neutral-500">Management</span>
                    </div>
                ) : null}
            </div>

            {/* Navigation */}
            <div className="flex-1 px-3 py-4 overflow-y-auto custom-scrollbar">
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
                    className="absolute -right-3 top-24 w-6 h-6 rounded-full bg-[#111] border border-white/10 flex items-center justify-center text-neutral-500 hover:text-white hover:bg-[#181818] transition-all"
                >
                    {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
                </button>
            )}

            {/* Footer Attribution */}
            {mounted && !isCollapsed && !mobileWidth && (
                <div className="p-4 border-t border-white/10 animate-in fade-in duration-500">
                    <div className="p-3 rounded-md bg-white/[0.03] border border-white/10">
                        <p className="text-xs text-neutral-500 font-medium text-center">
                            OneMoreGift System
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
