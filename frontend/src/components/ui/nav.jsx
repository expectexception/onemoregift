"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider
} from "@/components/ui/tooltip";
import { usePathname } from "next/navigation";

export function Nav({ links, isCollapsed }) {
    const pathName = usePathname();

    return (
        <TooltipProvider>
            <div
                data-collapsed={isCollapsed}
                className="group flex flex-col gap-2 py-2 data-[collapsed=true]:py-2"
            >
                <nav className="grid gap-1.5 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
                    {links.map((link, index) => {
                        const isActive = link.href === pathName;

                        return isCollapsed ? (
                            <Tooltip key={index} delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Link
                                        href={link.href}
                                        className={cn(
                                            "relative group/item h-12 w-12 flex items-center justify-center rounded-xl transition-all duration-300",
                                            isActive
                                                ? "bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)]"
                                                : "text-neutral-500 hover:text-white hover:bg-white/[0.05]"
                                        )}
                                    >
                                        <link.icon className={cn(
                                            "h-5 w-5 transition-transform duration-300",
                                            !isActive && "group-hover/item:scale-110"
                                        )} />

                                        {/* Hover Glow Background */}
                                        {!isActive && (
                                            <div className="absolute inset-0 bg-red-600/0 group-hover/item:bg-red-600/5 rounded-xl transition-colors duration-300" />
                                        )}

                                        <span className="sr-only">{link.title}</span>
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent
                                    side="right"
                                    className="bg-black border-white/[0.08] text-white font-bold uppercase text-[10px] tracking-widest px-3 py-1.5 rounded-lg backdrop-blur-xl shadow-2xl"
                                >
                                    {link.title}
                                </TooltipContent>
                            </Tooltip>
                        ) : (
                            <Link
                                key={index}
                                href={link.href}
                                className={cn(
                                    "relative flex h-12 items-center px-4 rounded-xl transition-all duration-300 group/item overflow-hidden",
                                    isActive
                                        ? "bg-white/[0.03] border border-white/[0.06] text-white shadow-inner"
                                        : "text-neutral-500 hover:text-white hover:bg-white/[0.05]"
                                )}
                            >
                                {/* Left Active/Hover Accent */}
                                <div className={cn(
                                    "absolute left-0 top-1/4 bottom-1/4 w-1 bg-red-600 rounded-r-full transition-all duration-500 transform",
                                    isActive ? "opacity-100 scale-y-100 shadow-[0_0_10px_rgba(220,38,38,0.8)]" : "opacity-0 scale-y-0 group-hover/item:opacity-50 group-hover/item:scale-y-75"
                                )} />

                                <link.icon className={cn(
                                    "mr-3 h-5 w-5 shrink-0 transition-transform duration-300",
                                    isActive ? "text-red-500" : "group-hover/item:scale-110 group-hover/item:text-neutral-200"
                                )} />

                                <span className="text-xs font-black uppercase tracking-widest italic leading-none transition-colors duration-300">
                                    {link.title}
                                </span>

                                {link.label && (
                                    <span className={cn(
                                        "ml-auto font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/[0.02] border border-white/[0.04]",
                                        isActive ? "text-white" : "text-neutral-600"
                                    )}>
                                        {link.label}
                                    </span>
                                )}

                                {/* Premium Hover Sweep Effect */}
                                {!isActive && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-red-600/[0.01] to-red-600/0 translate-x-[-100%] group-hover/item:translate-x-[100%] transition-transform duration-1000" />
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </TooltipProvider>
    );
}
