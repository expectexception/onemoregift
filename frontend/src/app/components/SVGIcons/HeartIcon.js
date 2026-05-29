import { useId } from "react";

export default function HeartIcon({ className = "w-6 h-6" }) {
    const gradientId = useId();

    return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 43C12 33 6 27 6 20c0-5 4-9 9-9 3 0 6 1 9 4 3-3 6-4 9-4 5 0 9 4 9 9 0 7-6 13-18 23z" fill={`url(#${gradientId})`} stroke="#dc2626" strokeWidth="1.5" />
            <defs>
                <linearGradient id={gradientId} x1="6" x2="42" y1="8" y2="43" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#fbbf24" />
                    <stop offset="1" stopColor="#f59e0b" />
                </linearGradient>
            </defs>
        </svg>
    );
}
