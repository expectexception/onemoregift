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

export default function AdminSidebar() {
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
                "relative flex flex-col border-r border-white/[0.06] bg-black transition-all duration-500 ease-in-out z-50",
                isCollapsed || mobileWidth ? "w-[80px]" : "w-[260px]"
            )}
        >
            {/* Branding Area */}
            <div className="h-24 flex items-center px-6 border-b border-white/[0.04]">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center shrink-0 shadow-lg shadow-red-900/20 shadow-inner">
                    <span className="text-white font-black italic text-xl">D</span>
                </div>
                {mounted && !isCollapsed && !mobileWidth && (
                    <div className="ml-4 animate-in fade-in slide-in-from-left-2 duration-500">
                        <h1 className="text-white font-black italic tracking-tighter text-lg uppercase leading-none">Dorrka</h1>
                        <span className="text-[10px] text-neutral-600 font-bold uppercase tracking-[0.2em]">Matrix Admin</span>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className="flex-1 px-3 py-6 overflow-y-auto custom-scrollbar">
                <Nav
                    isCollapsed={mobileWidth ? true : isCollapsed}
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
                            Protocol Version 4.0.2
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
