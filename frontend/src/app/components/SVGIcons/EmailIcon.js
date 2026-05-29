import { useId } from "react";

export default function EmailIcon({ className = "w-6 h-6" }) {
    const gradientId = useId();

    return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="7" y="12" width="34" height="25" rx="6" fill={`url(#${gradientId})`} />
            <path d="M10 17.5 22.2 27a3 3 0 0 0 3.6 0L38 17.5" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M35 7v7M31.5 10.5h7M12 39l-4 4M39 36l3 3" stroke="#fecaca" strokeWidth="2.5" strokeLinecap="round" />
            <defs>
                <linearGradient id={gradientId} x1="7" x2="41" y1="12" y2="37" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ef4444" />
                    <stop offset="1" stopColor="#991b1b" />
                </linearGradient>
            </defs>
        </svg>
    );
}
