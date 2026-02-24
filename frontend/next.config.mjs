/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
        NEXT_PUBLIC_ALTCHA_CHALLENGE_URL: process.env.NEXT_PUBLIC_ALTCHA_CHALLENGE_URL,
    },
    images: {
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
        ],

    },
};

export default nextConfig;
