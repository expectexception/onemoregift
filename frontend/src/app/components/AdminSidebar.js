/** @format */
"use client";

import { useState, useEffect } from "react";
import { Nav } from "@/components/ui/nav";
import {
    ChevronRight,
    ChevronLeft
} from "lucide-react";
import { DashboardIcon, UsersIcon, GiveawayIcon, AddIcon, LogoutIcon } from "./SVGIcons";
import TrophyIcon from "./SVGIcons/TrophyIcon";
import SettingsIcon from "./SVGIcons/SettingsIcon";
import { useWindowWidth } from "@react-hook/window-size";
import { cn } from "@/lib/utils";
import AnimatedGiftSVG from "./AnimatedGiftSVG";

export default function AdminSidebar({ isMobileOpen, setIsMobileOpen, isCollapsed, setIsCollapsed }) {
    const [mounted, setMounted] = useState(false);
    const onlyWidth = useWindowWidth();

    useEffect(() => {
        setMounted(true);
    }, []);

    const mobileWidth = mounted ? onlyWidth < 1024 : false;

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
            icon: DashboardIcon,
            variant: "default"
        },
        {
            title: "Users",
            href: "/admin/dashboard/users",
            icon: UsersIcon,
            variant: "ghost"
        },
        {
            title: "Giveaways",
            href: "/admin/dashboard/giveaways",
            icon: GiveawayIcon,
            variant: "ghost"
        },
        {
            title: "Add Giveaway",
            href: "/admin/dashboard/add",
            icon: AddIcon,
            variant: "ghost"
        },
        {
            title: "Winners",
            href: "/admin/dashboard/winners",
            icon: TrophyIcon,
            variant: "ghost"
        },
        {
            title: "Settings",
            href: "/admin/dashboard/settings",
            icon: SettingsIcon,
            variant: "ghost"
        },
        {
            title: "Logout",
            href: "/admin/logout",
            icon: LogoutIcon,
            variant: "ghost"
        }
    ];

    return (
        <div
            className={cn(
                "fixed inset-y-0 left-0 z-50 flex h-dvh shrink-0 flex-col overflow-hidden border-r border-white/10 bg-[#0b0b0b] transition-all duration-300 ease-in-out",
                mobileWidth
                    ? (isMobileOpen ? "fixed inset-y-0 left-0 w-[260px] translate-x-0" : "fixed inset-y-0 left-0 w-[260px] -translate-x-full")
                    : (isCollapsed ? "w-[80px]" : "w-[260px]")
            )}
        >
            {/* Branding Area */}
            <div className="h-20 flex items-center px-5 border-b border-white/10 relative overflow-hidden">
                <div className="w-10 h-10 flex items-center justify-center shrink-0">
                    <AnimatedGiftSVG className="w-9 h-9" />
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
