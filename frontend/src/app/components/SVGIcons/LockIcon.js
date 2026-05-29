export default function LockIcon({ className = "w-6 h-6" }) {
    return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="20" width="28" height="18" rx="3" stroke="#dc2626" strokeWidth="2" fill="none" />
            <path d="M14 20V14c0-5 3.5-8 10-8s10 3 10 8v6" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="24" cy="29" r="2" fill="#fbbf24" />
            <path d="M24 29v5" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}
