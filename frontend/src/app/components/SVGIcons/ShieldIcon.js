import { useId } from "react";

export default function ShieldIcon({ className = "w-6 h-6" }) {
    const gradientId = useId();

    return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 5l14 6v11c0 10-7 16-14 19-7-3-14-9-14-19V11l14-6z" fill={`url(#${gradientId})`} stroke="#dc2626" strokeWidth="1.5" />
            <path d="M18 24l4 4 8-8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <defs>
                <linearGradient id={gradientId} x1="10" x2="38" y1="5" y2="41" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ef4444" />
                    <stop offset="1" stopColor="#991b1b" />
                </linearGradient>
            </defs>
        </svg>
    );
}
