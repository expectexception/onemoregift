"use client";

export default function SessionLoader({ label = "Loading your session..." }) {
    return (
        <div className="min-h-[50vh] flex items-center justify-center px-4">
            <div className="premium-card rounded-2xl px-6 py-5 text-center border border-slate-200/70">
                <div className="mx-auto h-10 w-10 rounded-full border-2 border-slate-300 border-t-slate-900 animate-spin" />
                <p className="mt-3 text-sm text-slate-600">{label}</p>
            </div>
        </div>
    );
}
