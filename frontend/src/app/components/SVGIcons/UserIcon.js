export default function UserIcon({ className = "w-6 h-6" }) {
    return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="14" r="8" stroke="#dc2626" strokeWidth="2.5" fill="none" />
            <path d="M10 38c0-6 6-10 14-10s14 4 14 10" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M35 8l6 6M35 14l6-6" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
    );
}
