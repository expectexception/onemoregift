'use client'

import { useId } from "react";

export default function AnimatedGiftSVG({ className = "w-6 h-6" }) {
    const boxGradId = useId();
    const ribbonGradId = useId();
    const lidGradId = useId();

    return (
        <svg
            viewBox="0 0 100 100"
            className={`${className} animated-gift`}
            xmlns="http://www.w3.org/2000/svg"
            style={{
                animation: 'float 3.5s ease-in-out infinite'
            }}
        >
            <defs>
                <linearGradient id={boxGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#991b1b" />
                </linearGradient>
                <linearGradient id={lidGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f87171" />
                    <stop offset="100%" stopColor="#b91c1c" />
                </linearGradient>
                <linearGradient id={ribbonGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
                <style>{`
                    @keyframes float {
                        0%, 100% { transform: translateY(0px) rotate(0deg); }
                        50% { transform: translateY(-4px) rotate(1deg); }
                    }
                    @keyframes shimmer {
                        0% { opacity: 0.3; }
                        50% { opacity: 0.8; }
                        100% { opacity: 0.3; }
                    }
                    .sparkle {
                        animation: shimmer 2.5s ease-in-out infinite;
                    }
                `}</style>
            </defs>

            {/* Sparkles / Magic Glow in Background */}
            <g className="sparkle">
                <circle cx="15" cy="20" r="1.5" fill="#fbbf24" />
                <path d="M15 15v10M10 20h10" stroke="#fbbf24" strokeWidth="0.5" opacity="0.6" />
                
                <circle cx="85" cy="25" r="1" fill="#fbbf24" />
                <path d="M85 21v8M81 25h8" stroke="#fbbf24" strokeWidth="0.5" opacity="0.6" />

                <circle cx="88" cy="78" r="1.2" fill="#fbbf24" />
                <path d="M88 74v8M84 78h8" stroke="#fbbf24" strokeWidth="0.5" opacity="0.6" />
            </g>

            {/* Main Gift Box Body */}
            <g>
                {/* 3D Box shadow */}
                <rect x="18" y="47" width="64" height="42" rx="4" fill="rgba(0,0,0,0.25)" />

                {/* Box Body */}
                <rect x="17" y="44" width="66" height="44" rx="4" fill={`url(#${boxGradId})`} />

                {/* Horizontal Ribbon on Body */}
                <rect x="17" y="62" width="66" height="8" fill={`url(#${ribbonGradId})`} />

                {/* Vertical Ribbon on Body */}
                <rect x="45" y="44" width="10" height="44" fill={`url(#${ribbonGradId})`} />
            </g>

            {/* Gift Box Lid */}
            <g>
                {/* Lid shadow */}
                <rect x="13" y="32" width="74" height="12" rx="2" fill="rgba(0,0,0,0.15)" />

                {/* Lid Body */}
                <rect x="13" y="30" width="74" height="14" rx="3" fill={`url(#${lidGradId})`} />

                {/* Vertical Ribbon on Lid */}
                <rect x="45" y="30" width="10" height="14" fill={`url(#${ribbonGradId})`} />
            </g>

            {/* Ribbon Bow */}
            <g>
                {/* Left Bow Loop */}
                <path
                    d="M47 30 C30 18, 32 10, 47 24 Z"
                    fill={`url(#${ribbonGradId})`}
                    stroke="#ffffff"
                    strokeWidth="0.5"
                />
                {/* Right Bow Loop */}
                <path
                    d="M53 30 C70 18, 68 10, 53 24 Z"
                    fill={`url(#${ribbonGradId})`}
                    stroke="#ffffff"
                    strokeWidth="0.5"
                />
                {/* Left ribbon tail */}
                <path
                    d="M46 30 C38 35, 35 45, 30 46"
                    stroke={`url(#${ribbonGradId})`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                />
                {/* Right ribbon tail */}
                <path
                    d="M54 30 C62 35, 65 45, 70 46"
                    stroke={`url(#${ribbonGradId})`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                />
                {/* Center Knot */}
                <circle cx="50" cy="27" r="4.5" fill="#fbbf24" stroke="#d97706" strokeWidth="0.5" />
                <circle cx="50" cy="27" r="2" fill="#fff" opacity="0.5" />
            </g>
        </svg>
    );
}
