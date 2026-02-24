// layouts/AdminLayout.js
import { useState } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { Menu, X } from 'lucide-react';

const AdminLayout = ({ children }) => {
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-black overflow-hidden relative">
            {/* Mobile Top Header - Sticky */}
            <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-md border-b border-white/[0.06] z-[40] flex items-center px-4 justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center shrink-0 shadow-lg shadow-red-900/20 shadow-inner">
                        <span className="text-white font-black italic text-sm">A</span>
                    </div>
                    <span className="text-white font-black italic tracking-tighter text-base uppercase">Admin</span>
                </div>

                <button
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                    className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-lg active:scale-95 transition-all"
                >
                    {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </header>

            {/* Mobile Backdrop */}
            {isMobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[45] animate-in fade-in duration-300"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            <AdminSidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

            <main className="flex-grow bg-black relative w-full lg:w-auto overflow-y-auto pt-16 lg:pt-0">
                {children}
            </main>
        </div>
    );
};

export default AdminLayout;
