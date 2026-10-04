/** @type {import('next').NextConfig} */

const PROD_API = "https://onemoregift.in";
const isDev = process.env.NODE_ENV !== "production";

const nextConfig = {
    output: "standalone",
    env: {
        NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
        NEXT_PUBLIC_ALTCHA_CHALLENGE_URL: process.env.NEXT_PUBLIC_ALTCHA_CHALLENGE_URL,
    },
    // In local dev, proxy API calls through Next.js to avoid CORS.
    // In production, set BACKEND_INTERNAL_URL at build time (e.g. on DreamHost,
    // where the Proxy Server sends the whole domain to Next) to forward the API
    // and media paths to the backend. Next passes X-Forwarded-For through
    // untouched, so the backend's `trust proxy 1` still sees the client IP.
    async rewrites() {
        const LOCAL_API = isDev
            ? process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'
            : process.env.BACKEND_INTERNAL_URL;
        if (!LOCAL_API) return [];
        return [
            {
                source: '/api/v1/:path*',
                destination: `${LOCAL_API}/api/v1/:path*`,
            },
            {
                // Proxy uploaded images from local backend (disk storage, public/)
                source: '/uploads/:path*',
                destination: `${LOCAL_API}/uploads/:path*`,
            },
            {
                // Proxy custom media dir images (disk storage, MEDIA_DIR outside public/)
                source: '/media/:path*',
                destination: `${LOCAL_API}/media/:path*`,
            },
        ];
    },
    images: {
        unoptimized: true,
        remotePatterns: [
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '9000', // Specify the exact port
                pathname: '/uploads/images/**', // Allow images under /uploads/images/
            },
            {
                protocol: 'https',
                hostname: 'giveaway-backend-h74f.onrender.com',
                pathname: '/uploads/images/**', // Allow images under /uploads/images/
            },
            {
                protocol: 'https',
                hostname: 'api.onemoregift.in',
                pathname: '/uploads/images/**', // Allow images under /uploads/images/
            },
            {
                protocol: 'https',
                hostname: 'onemoregift.in',
                pathname: '/uploads/images/**', // Allow images under /uploads/images/
            },
        ],
    },
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
    },
};

export default nextConfig;
