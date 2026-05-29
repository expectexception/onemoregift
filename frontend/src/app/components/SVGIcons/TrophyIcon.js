import { useId } from "react";

export default function TrophyIcon({ className = "w-6 h-6" }) {
    const gradientId = useId();

    return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 10h20v8c0 4-3 7-8 7h-4c-5 0-8-3-8-7v-8z" fill={`url(#${gradientId})`} stroke="#dc2626" strokeWidth="1.5" />
            <rect x="12" y="17" width="24" height="3" fill="#fbbf24" />
            <path d="M20 20v12h8v-12" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
            <circle cx="16" cy="10" r="3" stroke="#dc2626" strokeWidth="1.5" fill="none" />
            <circle cx="32" cy="10" r="3" stroke="#dc2626" strokeWidth="1.5" fill="none" />
            <path d="M24 32l-4 8h8l-4-8z" fill="#fbbf24" opacity="0.8" />
            <defs>
                <linearGradient id={gradientId} x1="14" x2="34" y1="10" y2="30" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ef4444" />
                    <stop offset="1" stopColor="#991b1b" />
                </linearGradient>
            </defs>
        </svg>
    );
}
