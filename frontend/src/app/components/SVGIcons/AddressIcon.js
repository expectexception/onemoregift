import { useId } from "react";

export default function AddressIcon({ className = "w-6 h-6" }) {
    const gradientId = useId();

    return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 6c-6 0-10 4-10 10 0 8 10 18 10 18s10-10 10-18c0-6-4-10-10-10z" fill={`url(#${gradientId})`} stroke="#dc2626" strokeWidth="1.5" />
            <circle cx="24" cy="16" r="3" fill="white" />
            <rect x="10" y="30" width="28" height="12" rx="2" stroke="#fbbf24" strokeWidth="2" fill="none" />
            <line x1="10" y1="36" x2="38" y2="36" stroke="#fbbf24" strokeWidth="1.5" />
            <defs>
                <linearGradient id={gradientId} x1="14" x2="34" y1="6" y2="34" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ef4444" />
                    <stop offset="1" stopColor="#991b1b" />
                </linearGradient>
            </defs>
        </svg>
    );
}
