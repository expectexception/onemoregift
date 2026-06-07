import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";

export default function SearchableSelect({ value, onChange, options, placeholder, disabled, className }) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
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

            {isOpen && (
                <div className="absolute z-50 w-full mt-1.5 bg-[#0a0a0a]/95 backdrop-blur-md border border-white/10 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100">
                    <div className="flex items-center border-b border-white/[0.08] px-2.5 py-1.5">
                        <Search className="w-3.5 h-3.5 text-neutral-500 mr-2 shrink-0" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search..."
                            className="w-full bg-transparent border-0 text-xs sm:text-sm text-white focus:outline-none placeholder:text-neutral-600 h-7"
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
            )}
        </div>
    );
}
