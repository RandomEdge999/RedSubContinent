/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "upload.wikimedia.org",
            },
            {
                protocol: "https",
                hostname: "basemaps.cartocdn.com",

            },
        ],
    },
    async rewrites() {
        return [
            // Keep Next.js image proxy route local
            {
                source: "/api/images",
                destination: "/api/images",
            },
            // Proxy backend API
            {
                source: "/api/:path*",
                destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/:path*`,
            },
        ];
    },
};

module.exports = nextConfig;
