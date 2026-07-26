"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Play, FileText, ImageOff, Maximize2, ExternalLink, X, ChevronLeft, ChevronRight, Download,
} from "lucide-react";
import { mediaUrl } from "@/app/utils/apiClient";

// Uploads can be images, video or PDF. Rendering everything as an <img> silently
// showed an empty box for video, which meant a moderator was approving media they
// had never actually seen.
const kindOf = (item) => {
    const url = String(item?.url || item || "");
    if (item?.type === "video") return "video";
    if (/\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(url)) return "video";
    if (/\.pdf(\?|$)/i.test(url)) return "pdf";
    return "image";
};

const urlOf = (item) => mediaUrl(typeof item === "string" ? item : item?.url);
const fileNameOf = (item) => {
    const raw = String(typeof item === "string" ? item : item?.url || "");
    return raw.split("/").pop()?.split("?")[0] || "file";
};

function Thumb({ item, index, onOpen, accent }) {
    const kind = kindOf(item);
    const src = urlOf(item);
    const [failed, setFailed] = useState(false);

    const border = accent === "amber" ? "border-amber-500/25 hover:border-amber-400/60" : "border-white/10 hover:border-red-500/50";

    return (
        <button
            type="button"
            onClick={() => onOpen(index)}
            aria-label={`Open ${kind} ${index + 1} for review`}
            className={`group relative w-28 h-28 rounded-xl overflow-hidden border ${border} bg-black/60 shrink-0 transition-colors`}
        >
            {kind === "image" && !failed && (
                <img src={src} alt="" onError={() => setFailed(true)} className="w-full h-full object-cover" />
            )}

            {kind === "video" && !failed && (
                // preload metadata is enough to paint a first frame without pulling the whole file
                <video src={src} preload="metadata" muted playsInline onError={() => setFailed(true)}
                    className="w-full h-full object-cover pointer-events-none" />
            )}

            {kind === "pdf" && (
                <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-neutral-400">
                    <FileText className="w-7 h-7" />
                    <span className="text-[9px] px-1 truncate max-w-full">PDF</span>
                </div>
            )}

            {failed && (
                <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-neutral-600 px-1">
                    <ImageOff className="w-6 h-6" />
                    <span className="text-[8px] text-center leading-tight">Could not load</span>
                </div>
            )}

            {/* Type badge, so a moderator can tell at a glance what they are about to open */}
            {kind === "video" && !failed && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/35">
                    <span className="w-9 h-9 rounded-full bg-black/70 border border-white/20 flex items-center justify-center">
                        <Play className="w-4 h-4 text-white ml-0.5" fill="currentColor" />
                    </span>
                </span>
            )}

            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/75 text-[8px] font-bold uppercase tracking-wide text-neutral-300">
                {kind}
            </span>

            <span className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Maximize2 className="w-5 h-5 text-white" />
            </span>
        </button>
    );
}

function Lightbox({ items, index, onClose, onNavigate, title }) {
    const item = items[index];
    const kind = kindOf(item);
    const src = urlOf(item);
    const [failed, setFailed] = useState(false);

    useEffect(() => { setFailed(false); }, [index]);

    const handleKey = useCallback((e) => {
        if (e.key === "Escape") onClose();
        if (e.key === "ArrowRight" && index < items.length - 1) onNavigate(index + 1);
        if (e.key === "ArrowLeft" && index > 0) onNavigate(index - 1);
    }, [onClose, onNavigate, index, items.length]);

    useEffect(() => {
        document.addEventListener("keydown", handleKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", handleKey);
            document.body.style.overflow = prev;
        };
    }, [handleKey]);

    return (
        <div className="fixed inset-0 z-[90] flex flex-col bg-black/95" role="dialog" aria-modal="true" aria-label="Media review">
            <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-white/10 shrink-0">
                <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{title}</p>
                    <p className="text-[11px] text-neutral-500 truncate font-mono">
                        {fileNameOf(item)} · {index + 1} of {items.length}
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <a href={src} target="_blank" rel="noopener noreferrer"
                        className="h-9 px-3 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.1] text-neutral-300 text-xs font-semibold flex items-center gap-1.5 transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" /> Open original
                    </a>
                    <a href={src} download
                        className="h-9 px-3 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.1] text-neutral-300 text-xs font-semibold items-center gap-1.5 transition-colors hidden sm:flex">
                        <Download className="w-3.5 h-3.5" /> Download
                    </a>
                    <button onClick={onClose} aria-label="Close media viewer"
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="flex-1 relative flex items-center justify-center p-4 min-h-0">
                {index > 0 && (
                    <button onClick={() => onNavigate(index - 1)} aria-label="Previous file"
                        className="absolute left-3 z-10 w-11 h-11 rounded-full bg-black/70 border border-white/15 flex items-center justify-center text-white hover:bg-black/90 transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                )}
                {index < items.length - 1 && (
                    <button onClick={() => onNavigate(index + 1)} aria-label="Next file"
                        className="absolute right-3 z-10 w-11 h-11 rounded-full bg-black/70 border border-white/15 flex items-center justify-center text-white hover:bg-black/90 transition-colors">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                )}

                {failed ? (
                    <div className="text-center space-y-3">
                        <ImageOff className="w-12 h-12 mx-auto text-neutral-700" />
                        <p className="text-sm text-neutral-400">This file could not be displayed.</p>
                        <p className="text-[11px] text-neutral-600 font-mono break-all max-w-md">{src}</p>
                        <a href={src} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-semibold">
                            <ExternalLink className="w-3.5 h-3.5" /> Try opening it directly
                        </a>
                    </div>
                ) : kind === "video" ? (
                    <video key={src} src={src} controls autoPlay playsInline onError={() => setFailed(true)}
                        className="max-w-full max-h-full rounded-lg bg-black" />
                ) : kind === "pdf" ? (
                    <object data={src} type="application/pdf" className="w-full h-full rounded-lg bg-neutral-900">
                        <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
                            <FileText className="w-12 h-12 text-neutral-600" />
                            <p className="text-sm text-neutral-400">This browser cannot preview the PDF inline.</p>
                            <a href={src} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-red-400 hover:text-red-300 font-semibold inline-flex items-center gap-1.5">
                                <ExternalLink className="w-3.5 h-3.5" /> Open the PDF
                            </a>
                        </div>
                    </object>
                ) : (
                    <img src={src} alt="" onError={() => setFailed(true)} className="max-w-full max-h-full object-contain rounded-lg" />
                )}
            </div>

            {items.length > 1 && (
                <div className="flex gap-2 px-4 py-3 overflow-x-auto border-t border-white/10 shrink-0">
                    {items.map((it, i) => (
                        <button key={i} onClick={() => onNavigate(i)}
                            aria-label={`View file ${i + 1}`}
                            className={`w-14 h-14 rounded-lg overflow-hidden border shrink-0 transition-colors ${
                                i === index ? "border-red-500" : "border-white/10 hover:border-white/30"
                            }`}>
                            {kindOf(it) === "image"
                                ? <img src={urlOf(it)} alt="" className="w-full h-full object-cover" />
                                : (
                                    <span className="w-full h-full flex items-center justify-center bg-black/60 text-neutral-400">
                                        {kindOf(it) === "video" ? <Play className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                    </span>
                                )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

/**
 * Thumbnail strip plus a full-screen viewer, for admin screens where someone has to
 * actually look at user-submitted files before approving them.
 * `items` accepts either URL strings or { url, type } objects.
 */
export default function MediaReviewer({ items = [], label, accent = "default", emptyText }) {
    const [openAt, setOpenAt] = useState(null);
    const list = (items || []).filter(Boolean);

    if (!list.length) {
        return emptyText
            ? <p className="text-xs text-neutral-600 italic">{emptyText}</p>
            : null;
    }

    const labelTone = accent === "amber" ? "text-amber-400" : "text-neutral-500";

    return (
        <div className="space-y-2">
            {label && (
                <div className="flex items-center justify-between">
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${labelTone}`}>{label}</p>
                    <span className="text-[10px] text-neutral-600">
                        {list.length} file{list.length === 1 ? "" : "s"} · click to review
                    </span>
                </div>
            )}
            <div className="flex gap-2 overflow-x-auto pb-1">
                {list.map((item, i) => (
                    <Thumb key={i} item={item} index={i} onOpen={setOpenAt} accent={accent} />
                ))}
            </div>

            {openAt !== null && (
                <Lightbox
                    items={list}
                    index={openAt}
                    title={label || "Review file"}
                    onClose={() => setOpenAt(null)}
                    onNavigate={setOpenAt}
                />
            )}
        </div>
    );
}
