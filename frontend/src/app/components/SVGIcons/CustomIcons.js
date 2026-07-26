import { useId } from "react";

export function DashboardIcon({ className = "w-6 h-6" }) {
    const gradientId = useId();
    return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="8" width="14" height="14" rx="3" fill={`url(#${gradientId})`} stroke="#dc2626" strokeWidth="1.5" />
            <rect x="26" y="8" width="14" height="14" rx="3" fill="none" stroke="#fbbf24" strokeWidth="2" />
            <rect x="8" y="26" width="14" height="14" rx="3" fill="none" stroke="#fbbf24" strokeWidth="2" />
            <circle cx="33" cy="33" r="7" fill={`url(#${gradientId})`} stroke="#dc2626" strokeWidth="1.5" />
            <defs>
                <linearGradient id={gradientId} x1="8" x2="22" y1="8" y2="22" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ef4444" />
                    <stop offset="1" stopColor="#991b1b" />
                </linearGradient>
            </defs>
        </svg>
    );
}

export function UsersIcon({ className = "w-6 h-6" }) {
    const gradientId = useId();
    return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="14" r="6" fill={`url(#${gradientId})`} stroke="#dc2626" strokeWidth="1.5" />
            <path d="M12 34c0-6 6-8 12-8s12 2 12 8" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
            <circle cx="36" cy="18" r="4" fill="none" stroke="#dc2626" strokeWidth="1.5" opacity="0.7" />
            <path d="M30 38c0-3 3-5 7-5" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
            <circle cx="12" cy="18" r="4" fill="none" stroke="#dc2626" strokeWidth="1.5" opacity="0.7" />
            <path d="M18 38c0-3-3-5-7-5" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
            <defs>
                <linearGradient id={gradientId} x1="18" x2="30" y1="8" y2="20" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ef4444" />
                    <stop offset="1" stopColor="#991b1b" />
                </linearGradient>
            </defs>
        </svg>
    );
}

export function GiveawayIcon({ className = "w-6 h-6" }) {
    const gradientId = useId();
    return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="18" width="32" height="22" rx="3" fill="none" stroke="#fbbf24" strokeWidth="2" />
            <path d="M6 14h36v4H6z" fill={`url(#${gradientId})`} stroke="#dc2626" strokeWidth="1.5" />
            <path d="M24 10c-3-3-8-1-8 2s4 4 8 0c4 4 8 3 8 0s-5-5-8-2z" fill="#fbbf24" />
            <line x1="24" y1="18" x2="24" y2="40" stroke="#dc2626" strokeWidth="2" />
            <line x1="8" y1="29" x2="40" y2="29" stroke="#dc2626" strokeWidth="2" />
            <defs>
                <linearGradient id={gradientId} x1="6" x2="42" y1="14" y2="18" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ef4444" />
                    <stop offset="1" stopColor="#991b1b" />
                </linearGradient>
            </defs>
        </svg>
    );
}

export function AddIcon({ className = "w-6 h-6" }) {
    const gradientId = useId();
    return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="24" r="18" fill="none" stroke="#fbbf24" strokeWidth="2" />
            <line x1="24" y1="14" x2="24" y2="34" stroke={`url(#${gradientId})`} strokeWidth="3" strokeLinecap="round" />
            <line x1="14" y1="24" x2="34" y2="24" stroke={`url(#${gradientId})`} strokeWidth="3" strokeLinecap="round" />
            <defs>
                <linearGradient id={gradientId} x1="14" x2="34" y1="14" y2="34" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ef4444" />
                    <stop offset="1" stopColor="#991b1b" />
                </linearGradient>
            </defs>
        </svg>
    );
}

export function LogoutIcon({ className = "w-6 h-6" }) {
    const gradientId = useId();
    return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 8H8a2 2 0 00-2 2v28a2 2 0 002 2h8" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M26 14l10 10-10 10" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="14" y1="24" x2="36" y2="24" stroke={`url(#${gradientId})`} strokeWidth="2" strokeLinecap="round" />
            <defs>
                <linearGradient id={gradientId} x1="14" x2="36" y1="20" y2="28" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ef4444" />
                    <stop offset="1" stopColor="#991b1b" />
                </linearGradient>
            </defs>
        </svg>
    );
}

export function PauseIcon({ className = "w-5 h-5" }) {
    const gradientId = useId();
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="6" y="4" width="4" height="16" rx="1" fill={`url(#${gradientId})`} stroke="#dc2626" strokeWidth="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" fill={`url(#${gradientId})`} stroke="#dc2626" strokeWidth="1" />
            <defs>
                <linearGradient id={gradientId} x1="6" x2="18" y1="4" y2="20" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ef4444" />
                    <stop offset="1" stopColor="#991b1b" />
                </linearGradient>
            </defs>
        </svg>
    );
}

export function PlayIcon({ className = "w-5 h-5" }) {
    const gradientId = useId();
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 5v14l11-7-11-7z" fill={`url(#${gradientId})`} stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <defs>
                <linearGradient id={gradientId} x1="8" x2="19" y1="5" y2="19" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#f59e0b" />
                    <stop offset="1" stopColor="#b45309" />
                </linearGradient>
            </defs>
        </svg>
    );
}

export function DrawIcon({ className = "w-5 h-5" }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 3-1.912 5.886L4 9.366l5 4.364L7.088 20 12 16.5 16.912 20 15 13.73l5-4.364-6.088-.48L12 3z" />
        </svg>
    );
}

export function ResetIcon({ className = "w-5 h-5" }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
        </svg>
    );
}

export function TrashIcon({ className = "w-5 h-5" }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
    );
}
