import { useId } from "react";

export default function CheckIcon({ className = "w-6 h-6" }) {
    const gradientId = useId();

    return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="24" r="18" fill={`url(#${gradientId})`} stroke="#dc2626" strokeWidth="1.5" />
            <path d="M16 24l5 5 10-12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <defs>
                <linearGradient id={gradientId} x1="6" x2="42" y1="6" y2="42" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#fbbf24" />
                    <stop offset="1" stopColor="#f59e0b" />
                </linearGradient>
            </defs>
        </svg>
    );
}
