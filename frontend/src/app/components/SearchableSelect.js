import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search } from "lucide-react";

export default function SearchableSelect({ value, onChange, options, placeholder, disabled, className }) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [mounted, setMounted] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

    const triggerRef = useRef(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isOpen) setSearch("");
    }, [isOpen]);

    const updateCoords = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const dropdownHeight = 280; // Estimated max height of dropdown (max-h-60 is 240px + search)
            const showAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

            setCoords({
                top: showAbove
                    ? rect.top + window.scrollY - dropdownHeight - 6
                    : rect.bottom + window.scrollY + 6,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    useEffect(() => {
        if (isOpen) {
            updateCoords();
            window.addEventListener("resize", updateCoords);
            window.addEventListener("scroll", updateCoords, true);
        }
        return () => {
            window.removeEventListener("resize", updateCoords);
            window.removeEventListener("scroll", updateCoords, true);
        };
    }, [isOpen]);

    const selectedOption = options.find(opt => opt.value === value);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="relative w-full">
            <button
                ref={triggerRef}
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
                <>
                    {/* Click outside backdrop (invisible) */}
                    <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />

                    {/* Floating Dropdown Container */}
                    <div
                        style={{
                            position: "absolute",
                            top: `${coords.top}px`,
                            left: `${coords.left}px`,
                            width: `${coords.width}px`,
                        }}
                        className="bg-[#0a0a0a]/95 backdrop-blur-md border border-white/10 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100 z-[9999]"
                    >
                        <div className="flex items-center border-b border-white/[0.08] px-2.5 py-1.5">
                            <Search className="w-3.5 h-3.5 text-neutral-500 mr-2 shrink-0" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search..."
                                className="w-full bg-transparent border-0 text-xs sm:text-sm text-white focus:outline-none placeholder:text-neutral-600 h-7"
                                autoFocus
                            />
                        </div>
                        <div className="max-h-60 overflow-y-auto custom-scrollbar p-1 space-y-0.5">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => {
                                            onChange(opt.value);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 text-xs sm:text-sm rounded-lg transition-colors ${
                                            opt.value === value
                                                ? "bg-red-600 text-white font-semibold"
                                                : "text-neutral-300 hover:bg-white/[0.05] hover:text-white"
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))
                            ) : (
                                <div className="py-3 px-3 text-xs text-neutral-500 text-center">
                                    No results found
                                </div>
                            )}
                        </div>
                    </div>
                </>,
                document.body
            )}
        </div>
    );
}
