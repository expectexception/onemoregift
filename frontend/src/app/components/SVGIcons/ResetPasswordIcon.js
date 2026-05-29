import { useId } from "react";

export default function ResetPasswordIcon({ className = "w-6 h-6" }) {
    const ringGradientId = useId();
    const lockGradientId = useId();

    return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M24 6C15.7 6 9 12.7 9 21"
                stroke={`url(#${ringGradientId})`}
                strokeWidth="3"
                strokeLinecap="round"
            />
            <path d="M9 21V14.5M9 21H15.5" stroke="#fca5a5" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            <path
                d="M24 42C32.3 42 39 35.3 39 27"
                stroke={`url(#${ringGradientId})`}
                strokeWidth="3"
                strokeLinecap="round"
            />
            <path d="M39 27V33.5M39 27H32.5" stroke="#fca5a5" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />

            <rect x="15" y="20" width="18" height="16" rx="5" fill={`url(#${lockGradientId})`} stroke="#7f1d1d" strokeWidth="1.4" />
            <path d="M19 20V16C19 13.2 21.2 11 24 11C26.8 11 29 13.2 29 16V20" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
            <circle cx="24" cy="28" r="2.1" fill="#fff" />
            <path d="M24 30V33" stroke="#fff" strokeWidth="2" strokeLinecap="round" />

            <defs>
                <linearGradient id={ringGradientId} x1="9" y1="6" x2="39" y2="42" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#f87171" />
                    <stop offset="1" stopColor="#dc2626" />
                </linearGradient>
                <linearGradient id={lockGradientId} x1="15" y1="20" x2="33" y2="36" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ef4444" />
                    <stop offset="1" stopColor="#b91c1c" />
                </linearGradient>
            </defs>
        </svg>
    );
}
