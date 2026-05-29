"use client";
// layouts/AdminLayout.js
import { useState } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { Menu, X } from 'lucide-react';

function MobileAdminMark() {
    return (
        <svg viewBox="0 0 40 40" className="w-5 h-5" fill="none" aria-hidden="true">
            <rect x="1" y="1" width="38" height="38" rx="10" stroke="rgba(255,255,255,0.35)" />
            <path d="M12 28L18 13H22L28 28H25L23.8 24.5H16.2L15 28H12ZM17 22H23L20 16L17 22Z" fill="#ffffff" />
        </svg>
    );
}

const AdminLayout = ({ children }) => {
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-[#070707] overflow-hidden relative">
            <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#0b0b0b] border-b border-white/10 z-[40] flex items-center px-4 justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-red-600 flex items-center justify-center shrink-0">
                        <MobileAdminMark />
                    </div>
                    <span className="text-white font-semibold text-base">Admin</span>
                </div>

                <button
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                    className="w-10 h-10 rounded-md bg-red-600 flex items-center justify-center text-white active:scale-95 transition-all"
                    aria-label={isMobileOpen ? "Close admin menu" : "Open admin menu"}
                >
                    {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </header>

            {/* Mobile Backdrop */}
            {isMobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/60 z-[45] animate-in fade-in duration-300"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            <AdminSidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

            <main className="flex-grow relative w-full lg:w-auto overflow-y-auto pt-16 lg:pt-0">
                {children}
            </main>
        </div>
    );
};

export default AdminLayout;
