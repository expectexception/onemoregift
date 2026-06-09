import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search, X } from "lucide-react";

export default function SearchableSelect({ value, onChange, options, placeholder, disabled, className }) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [mounted, setMounted] = useState(false);

    const containerRef = useRef(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isOpen) setSearch("");
    }, [isOpen]);

    const selectedOption = options.find(opt => opt.value === value);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div ref={containerRef} className="relative w-full">
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between w-full h-10 px-3 rounded-xl text-left text-xs sm:text-sm border bg-[#0e0e0e] border-white/10 text-white focus:outline-none focus:border-red-500/70 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
            >
                <span className="truncate">
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown className={`w-4 h-4 text-neutral-500 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && mounted && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="absolute inset-0" onClick={() => setIsOpen(false)} />
                    <div className="relative w-full max-w-sm bg-neutral-950 border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[70vh] sm:max-h-[500px] animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
                            <span className="text-sm font-bold text-white tracking-wide">{placeholder || "Select Option"}</span>
                            <button type="button" onClick={() => setIsOpen(false)} className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-neutral-400 hover:text-white transition-all">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex items-center border-b border-white/[0.08] px-3.5 py-2">
                            <Search className="w-4 h-4 text-neutral-500 mr-2 shrink-0" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search..."
                                className="w-full bg-transparent border-0 text-sm text-white focus:outline-none placeholder:text-neutral-600 h-8"
                                autoFocus
                            />
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => {
                                            onChange(opt.value);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full text-left px-3.5 py-2.5 text-sm rounded-xl transition-all ${
                                            opt.value === value
                                                ? "bg-red-600 text-white font-bold"
                                                : "text-neutral-300 hover:bg-white/[0.05] hover:text-white"
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))
                            ) : (
                                <div className="py-8 px-4 text-sm text-neutral-500 text-center font-medium">
                                    No results found
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
