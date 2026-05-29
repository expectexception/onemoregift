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
                                            "relative group/item h-11 w-11 flex items-center justify-center rounded-md transition-colors",
                                            isActive
                                                ? "bg-red-600 text-white"
                                                : "text-neutral-500 hover:text-white hover:bg-white/[0.06]"
                                        )}
                                    >
                                        <link.icon className={cn(
                                            "h-5 w-5"
                                        )} />

                                        <span className="sr-only">{link.title}</span>
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent
                                    side="right"
                                    className="bg-[#111] border-white/10 text-white text-xs px-3 py-1.5 rounded-md shadow-xl"
                                >
                                    {link.title}
                                </TooltipContent>
                            </Tooltip>
                        ) : (
                            <Link
                                key={index}
                                href={link.href}
                                className={cn(
                                    "relative flex h-11 items-center px-3 rounded-md transition-colors group/item overflow-hidden",
                                    isActive
                                        ? "bg-white/[0.06] border border-white/10 text-white"
                                        : "text-neutral-500 hover:text-white hover:bg-white/[0.05]"
                                )}
                            >
                                <div className={cn(
                                    "absolute left-0 top-2 bottom-2 w-1 bg-red-500 rounded-r-full transition-opacity",
                                    isActive ? "opacity-100" : "opacity-0 group-hover/item:opacity-50"
                                )} />

                                <link.icon className={cn(
                                    "mr-3 h-5 w-5 shrink-0",
                                    isActive ? "text-red-400" : "group-hover/item:text-neutral-200"
                                )} />

                                <span className="text-sm font-medium leading-none transition-colors duration-300">
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
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </TooltipProvider>
    );
}
