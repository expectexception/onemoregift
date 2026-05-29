import { useId } from "react";

export default function RegisterBadgeIcon({ className = "w-6 h-6" }) {
    const mainGradId = useId();
    const ringGradId = useId();

    return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id={mainGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#dc2626" />
                    <stop offset="100%" stopColor="#7f1d1d" />
                </linearGradient>
                <linearGradient id={ringGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#ea580c" />
                </linearGradient>
                <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.5" />
                </filter>
            </defs>

            {/* Outer Glowing Hexagon / Shield Shape */}
            <path
                d="M24 2.5L41.5 10v14c0 10.5-7.5 20.3-17.5 23.5C14 44.3 6.5 34.5 6.5 24V10L24 2.5z"
                fill={`url(#${mainGradId})`}
                stroke="url(#${ringGradId})"
                strokeWidth="2"
                filter="url(#shadow)"
            />

            {/* Glowing Ring inside Shield */}
            <circle cx="24" cy="22" r="12" stroke="white" strokeWidth="0.75" strokeOpacity="0.25" strokeDasharray="4 2" />

            {/* User Avatar - Premium Head & Shoulders */}
            <circle cx="24" cy="18" r="5" fill="#ffffff" />
            <path
                d="M14.5 31.5C14.5 27.5 18.5 25.5 24 25.5s9.5 2 9.5 6v1c0 1.5-1.5 2.5-3 2.5H17.5c-1.5 0-3-1-3-2.5v-1z"
                fill="#ffffff"
            />

            {/* Mini Premium Badge (Plus / Spark) in bottom-right of user */}
            <circle cx="33" cy="30" r="5" fill="url(#ringGradId)" stroke="#ffffff" strokeWidth="1" />
            <path
                d="M33 27.5v5M30.5 30h5"
                stroke="#ffffff"
                strokeWidth="1.2"
                strokeLinecap="round"
            />
        </svg>
    );
}
