import { useId } from "react";

// Generic empty list: an open, empty gift box with a few drifting sparkles.
export function EmptyBoxIllustration({ className = "w-32 h-32" }) {
    const gradientId = useId();
    return (
        <svg className={className} viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="80" cy="118" rx="46" ry="8" fill="#dc2626" opacity="0.08" />
            <path d="M34 70l46-14 46 14-46 16z" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinejoin="round" opacity="0.6" />
            <path d="M34 70v34l46 16v-34z" fill={`url(#${gradientId})`} opacity="0.9" />
            <path d="M126 70v34l-46 16v-34z" fill="#1a1a1a" stroke="#dc2626" strokeWidth="1.5" opacity="0.9" />
            <path d="M80 56l-26-12 6-9 20 8 20-8 6 9z" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinejoin="round" opacity="0.5" />
            <circle cx="120" cy="36" r="2.5" fill="#fbbf24" opacity="0.8" />
            <circle cx="132" cy="50" r="1.6" fill="#dc2626" opacity="0.7" />
            <circle cx="28" cy="44" r="2" fill="#fbbf24" opacity="0.6" />
            <defs>
                <linearGradient id={gradientId} x1="34" x2="80" y1="70" y2="120" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#7f1d1d" />
                    <stop offset="1" stopColor="#450a0a" />
                </linearGradient>
            </defs>
        </svg>
    );
}

// Empty happy-moments gallery: a photo frame with a soft sparkle, nothing inside yet.
export function EmptyGalleryIllustration({ className = "w-32 h-32" }) {
    const gradientId = useId();
    return (
        <svg className={className} viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="30" y="20" width="100" height="80" rx="6" fill="none" stroke="#fbbf24" strokeWidth="2.5" opacity="0.7" />
            <rect x="30" y="20" width="100" height="80" rx="6" fill={`url(#${gradientId})`} opacity="0.35" />
            <circle cx="58" cy="48" r="9" fill="none" stroke="#dc2626" strokeWidth="2.5" opacity="0.8" />
            <path d="M40 88l22-22 16 14 14-12 18 20z" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinejoin="round" opacity="0.6" />
            <path d="M118 6l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#fbbf24" opacity="0.9" />
            <ellipse cx="80" cy="116" rx="42" ry="6" fill="#dc2626" opacity="0.08" />
            <defs>
                <linearGradient id={gradientId} x1="30" x2="130" y1="20" y2="100" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#dc2626" />
                    <stop offset="1" stopColor="#7f1d1d" />
                </linearGradient>
            </defs>
        </svg>
    );
}

// Empty cart: a shopping bag drifting with nothing inside.
export function EmptyCartIllustration({ className = "w-32 h-32" }) {
    const gradientId = useId();
    return (
        <svg className={className} viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="80" cy="120" rx="40" ry="7" fill="#dc2626" opacity="0.08" />
            <path d="M48 46h64l6 64a8 8 0 01-8 9H50a8 8 0 01-8-9z" fill={`url(#${gradientId})`} stroke="#dc2626" strokeWidth="2" strokeLinejoin="round" />
            <path d="M60 46v-8a20 20 0 0140 0v8" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
            <circle cx="68" cy="64" r="3" fill="#0a0a0a" opacity="0.7" />
            <circle cx="92" cy="64" r="3" fill="#0a0a0a" opacity="0.7" />
            <path d="M64 78q16 10 32 0" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
            <circle cx="122" cy="30" r="2" fill="#fbbf24" opacity="0.8" />
            <circle cx="34" cy="40" r="1.8" fill="#fbbf24" opacity="0.6" />
            <defs>
                <linearGradient id={gradientId} x1="42" x2="118" y1="46" y2="119" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ef4444" />
                    <stop offset="1" stopColor="#7f1d1d" />
                </linearGradient>
            </defs>
        </svg>
    );
}

// Empty surprise-requests / orders list: a gift box on a clock, "nothing pending yet".
export function EmptyTimelineIllustration({ className = "w-32 h-32" }) {
    const gradientId = useId();
    return (
        <svg className={className} viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="80" cy="122" rx="40" ry="7" fill="#dc2626" opacity="0.08" />
            <circle cx="80" cy="64" r="40" fill="none" stroke="#fbbf24" strokeWidth="2.5" opacity="0.6" />
            <path d="M80 40v24l18 11" stroke="#dc2626" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
            <rect x="64" y="96" width="32" height="22" rx="3" fill={`url(#${gradientId})`} stroke="#dc2626" strokeWidth="1.5" />
            <line x1="80" y1="96" x2="80" y2="118" stroke="#fbbf24" strokeWidth="2" />
            <path d="M73 92c-2-3 1-6 4-4 2-3 6-1 5 2" stroke="#fbbf24" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.85" />
            <defs>
                <linearGradient id={gradientId} x1="64" x2="96" y1="96" y2="118" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ef4444" />
                    <stop offset="1" stopColor="#991b1b" />
                </linearGradient>
            </defs>
        </svg>
    );
}
