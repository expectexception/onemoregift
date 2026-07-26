"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Megaphone, Wrench, X } from "lucide-react";
import { fetchSiteConfig } from "../utils/siteConfig";

const DISMISS_KEY = "omg_announcement_dismissed";

// Site-wide strip driven entirely from the admin panel: a maintenance notice when
// maintenance mode is on, otherwise the announcement bar if one is published.
// Maintenance cannot be dismissed; an announcement can, and the dismissal is keyed
// to the message so a new announcement shows again.
export default function SiteBanner() {
    const [config, setConfig] = useState(null);
    const [dismissed, setDismissed] = useState(true);

    useEffect(() => {
        let cancelled = false;
        fetchSiteConfig()
            .then((cfg) => {
                if (cancelled || !cfg) return;
                setConfig(cfg);
                const text = String(cfg.announcementText || "");
                try {
                    setDismissed(localStorage.getItem(DISMISS_KEY) === text);
                } catch {
                    setDismissed(false);
                }
            })
            .catch(() => {});
        return () => { cancelled = true; };
    }, []);

    if (!config) return null;

    if (config.maintenanceMode) {
        return (
            <div className="relative z-[60] bg-amber-500/15 border-b border-amber-500/25">
                <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-2.5 text-center">
                    <Wrench className="w-4 h-4 text-amber-400 shrink-0" />
                    <p className="text-xs sm:text-sm text-amber-100 font-medium">
                        {config.maintenanceMessage || "We are doing a bit of maintenance — some actions are paused."}
                    </p>
                </div>
            </div>
        );
    }

    const text = String(config.announcementText || "").trim();
    if (!config.announcementEnabled || !text || dismissed) return null;

    const link = String(config.announcementLink || "").trim();
    const isInternal = link.startsWith("/");

    const body = (
        <span className="text-xs sm:text-sm text-white font-medium">
            {text}
            {link && <span className="ml-2 underline underline-offset-2 opacity-90">Learn more</span>}
        </span>
    );

    const dismiss = () => {
        setDismissed(true);
        try { localStorage.setItem(DISMISS_KEY, text); } catch { /* private mode */ }
    };

    return (
        <div className="relative z-[60] bg-gradient-to-r from-red-600/25 via-red-500/15 to-amber-500/20 border-b border-red-500/25">
            <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-2.5 text-center">
                <Megaphone className="w-4 h-4 text-red-300 shrink-0" />
                {link ? (
                    isInternal ? (
                        <Link href={link} className="hover:opacity-80 transition-opacity">{body}</Link>
                    ) : (
                        <a href={link} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">{body}</a>
                    )
                ) : body}
                <button
                    onClick={dismiss}
                    aria-label="Dismiss announcement"
                    className="absolute right-3 text-neutral-400 hover:text-white transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
