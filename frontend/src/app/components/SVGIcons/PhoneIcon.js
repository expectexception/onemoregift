export default function PhoneIcon({ className = "w-6 h-6" }) {
    return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="11" y="8" width="26" height="32" rx="3" stroke="#dc2626" strokeWidth="2.5" fill="none" />
            <line x1="11" y1="38" x2="37" y2="38" stroke="#dc2626" strokeWidth="2" />
            <circle cx="24" cy="41" r="1.5" fill="#dc2626" />
            <path d="M18 16h12M18 24h12M18 32h8" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}
