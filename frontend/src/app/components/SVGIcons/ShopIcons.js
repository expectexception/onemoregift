import { useId } from "react";

export function GiftBoxIcon({ className = "w-6 h-6" }) {
    const gradientId = useId();
    return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="20" width="32" height="20" rx="3" fill={`url(#${gradientId})`} stroke="#dc2626" strokeWidth="1.5" />
            <path d="M6 14h36v6H6z" fill="none" stroke="#fbbf24" strokeWidth="2" />
            <path d="M24 12c-3-4-9-2-9 2s5 3 9-1c4 4 9 5 9 1s-6-6-9-2z" fill="#fbbf24" />
            <line x1="24" y1="14" x2="24" y2="40" stroke="#dc2626" strokeWidth="2" />
            <defs>
                <linearGradient id={gradientId} x1="8" x2="40" y1="20" y2="40" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ef4444" />
                    <stop offset="1" stopColor="#991b1b" />
                </linearGradient>
            </defs>
        </svg>
    );
}

export function StoreIcon({ className = "w-6 h-6" }) {
    const gradientId = useId();
    return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 18l2-10h28l2 10" stroke="#fbbf24" strokeWidth="2" strokeLinejoin="round" />
            <rect x="10" y="18" width="28" height="20" rx="2" fill={`url(#${gradientId})`} stroke="#dc2626" strokeWidth="1.5" />
            <rect x="20" y="27" width="8" height="11" fill="#0a0a0a" stroke="#fbbf24" strokeWidth="1.5" />
            <circle cx="24" cy="18" r="2.5" fill="#fbbf24" />
            <defs>
                <linearGradient id={gradientId} x1="10" x2="38" y1="18" y2="38" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ef4444" />
                    <stop offset="1" stopColor="#991b1b" />
                </linearGradient>
            </defs>
        </svg>
    );
}

export function CameraIcon({ className = "w-6 h-6" }) {
    const gradientId = useId();
    return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 14l2.5-4h11l2.5 4h6a3 3 0 013 3v17a3 3 0 01-3 3H10a3 3 0 01-3-3V17a3 3 0 013-3z" fill={`url(#${gradientId})`} stroke="#dc2626" strokeWidth="1.5" />
            <circle cx="24" cy="25" r="8" fill="#0a0a0a" stroke="#fbbf24" strokeWidth="2" />
            <circle cx="24" cy="25" r="3.5" fill="#fbbf24" />
            <defs>
                <linearGradient id={gradientId} x1="7" x2="41" y1="10" y2="37" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ef4444" />
                    <stop offset="1" stopColor="#991b1b" />
                </linearGradient>
            </defs>
        </svg>
    );
}

export function SurpriseIcon({ className = "w-6 h-6" }) {
    const gradientId = useId();
    return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 6l4 9 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z" fill={`url(#${gradientId})`} stroke="#dc2626" strokeWidth="1.5" strokeLinejoin="round" />
            <circle cx="40" cy="10" r="2" fill="#fbbf24" />
            <circle cx="6" cy="14" r="1.5" fill="#fbbf24" />
            <circle cx="10" cy="38" r="2" fill="#fbbf24" />
            <defs>
                <linearGradient id={gradientId} x1="9" x2="39" y1="6" y2="40" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#fbbf24" />
                    <stop offset="1" stopColor="#dc2626" />
                </linearGradient>
            </defs>
        </svg>
    );
}

export function BadgeCheckIcon({ className = "w-6 h-6" }) {
    const gradientId = useId();
    return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 5l5 3 6-1 2 6 5 4-2 6 2 6-5 4-2 6-6-1-5 3-5-3-6 1-2-6-5-4 2-6-2-6 5-4 2-6 6 1z" fill={`url(#${gradientId})`} stroke="#16a34a" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M16 24l6 6 11-13" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <defs>
                <linearGradient id={gradientId} x1="10" x2="38" y1="5" y2="43" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#22c55e" />
                    <stop offset="1" stopColor="#15803d" />
                </linearGradient>
            </defs>
        </svg>
    );
}

export function ClockPendingIcon({ className = "w-6 h-6" }) {
    const gradientId = useId();
    return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="25" r="17" fill="none" stroke={`url(#${gradientId})`} strokeWidth="3" />
            <path d="M24 14v11l8 5" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="18" y="4" width="12" height="4" rx="2" fill="#dc2626" />
            <defs>
                <linearGradient id={gradientId} x1="7" x2="41" y1="8" y2="42" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#f59e0b" />
                    <stop offset="1" stopColor="#dc2626" />
                </linearGradient>
            </defs>
        </svg>
    );
}

export function BellAlertIcon({ className = "w-6 h-6" }) {
    const gradientId = useId();
    return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 6c-6 0-10 5-10 11v7l-4 7h28l-4-7v-7c0-6-4-11-10-11z" fill={`url(#${gradientId})`} stroke="#dc2626" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M19 38a5 5 0 0010 0" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
            <defs>
                <linearGradient id={gradientId} x1="10" x2="38" y1="6" y2="31" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ef4444" />
                    <stop offset="1" stopColor="#991b1b" />
                </linearGradient>
            </defs>
        </svg>
    );
}

export function PickupBagIcon({ className = "w-6 h-6" }) {
    const gradientId = useId();
    return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 16h20l2 24a3 3 0 01-3 3H15a3 3 0 01-3-3z" fill={`url(#${gradientId})`} stroke="#dc2626" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M18 16v-3a6 6 0 0112 0v3" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="24" cy="25" r="1.6" fill="#0a0a0a" />
            <defs>
                <linearGradient id={gradientId} x1="11" x2="37" y1="16" y2="43" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ef4444" />
                    <stop offset="1" stopColor="#991b1b" />
                </linearGradient>
            </defs>
        </svg>
    );
}

export function ConfettiBurstIcon({ className = "w-6 h-6" }) {
    return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="14" r="3" fill="#fbbf24" />
            <rect x="34" y="20" width="5" height="5" rx="1" fill="#dc2626" transform="rotate(20 36 22)" />
            <circle cx="10" cy="22" r="2" fill="#22c55e" />
            <rect x="6" y="32" width="4" height="4" rx="1" fill="#fbbf24" transform="rotate(-15 8 34)" />
            <circle cx="38" cy="36" r="2.5" fill="#dc2626" />
            <path d="M20 24l4 16 4-12" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function MapPinIcon({ className = "w-6 h-6" }) {
    const gradientId = useId();
    return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 5c-8 0-14 6-14 14 0 10 14 24 14 24s14-14 14-24c0-8-6-14-14-14z" fill={`url(#${gradientId})`} stroke="#dc2626" strokeWidth="1.5" />
            <circle cx="24" cy="19" r="5.5" fill="#0a0a0a" stroke="#fbbf24" strokeWidth="2" />
            <defs>
                <linearGradient id={gradientId} x1="10" x2="38" y1="5" y2="43" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ef4444" />
                    <stop offset="1" stopColor="#991b1b" />
                </linearGradient>
            </defs>
        </svg>
    );
}
