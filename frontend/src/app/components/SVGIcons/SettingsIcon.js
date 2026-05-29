export default function SettingsIcon({ className = "w-6 h-6" }) {
    return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="24" r="4" fill="#dc2626" />
            <path d="M24 8v4M24 36v4M39 24h4M5 24h4" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M33 15l3-3M15 33l3-3M33 33l3 3M15 15l3 3" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
            <circle cx="24" cy="24" r="14" stroke="#dc2626" strokeWidth="2" fill="none" opacity="0.3" />
        </svg>
    );
}
