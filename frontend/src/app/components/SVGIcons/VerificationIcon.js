import { useId } from "react";

export default function VerificationIcon({ className = "w-6 h-6" }) {
    const mainGradId = useId();
    const glowGradId = useId();

    return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id={mainGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="50%" stopColor="#ea580c" />
                    <stop offset="100%" stopColor="#dc2626" />
                </linearGradient>
                <linearGradient id={glowGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#dc2626" stopOpacity="0.2" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="1.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>
            {/* Outer Glowing Seal / Starburst */}
            <path
                d="M24 2l4.3 4.3 6-.5 1.5 5.8 5.6 2.3-1.4 5.9 4 4.5-4 4.5 1.4 5.9-5.6 2.3-1.5 5.8-6-.5L24 46l-4.3-4.3-6 .5-1.5-5.8-5.6-2.3 1.4-5.9-4-4.5 4-4.5-1.4-5.9 5.6-2.3 1.5-5.8 6 .5L24 2z"
                fill={`url(#${glowGradId})`}
                opacity="0.35"
            />
            <path
                d="M24 4l3.8 3.8 5.3-.4 1.3 5.2 4.9 2-1.2 5.2 3.5 4-3.5 4 1.2 5.2-4.9 2-1.3 5.2-5.3-.4L24 44l-3.8-3.8-5.3.4-1.3-5.2-4.9-2 1.2-5.2-3.5-4 3.5-4-1.2-5.2 4.9-2 1.3-5.2 5.3.4L24 4z"
                fill={`url(#${mainGradId})`}
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeLinejoin="round"
            />
            {/* Inner Ring */}
            <circle cx="24" cy="24" r="11" fill="black" fillOpacity="0.3" stroke="#ffffff" strokeWidth="1" strokeDasharray="3 2" />
            {/* Bold, premium checkmark */}
            <path
                d="M18.5 24.5l3.5 3.5 7.5-7.5"
                stroke="#ffffff"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow)"
            />
        </svg>
    );
}
