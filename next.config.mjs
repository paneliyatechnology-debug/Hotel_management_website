/** @type {import('next').NextConfig} */
const BACKEND_URL = (
  process.env.BACKEND_PROXY_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_LIVE_API_URL ||
  "https://hotelmanagementbackendnew-production.up.railway.app"
).trim().replace(/\/+$/, "");

const nextConfig = {
  allowedDevOrigins: [
    '192.168.1.101',
    '192.168.1.*',
    '192.168.*.*',
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
  ],
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false,
  },
  async rewrites() {
    return [
      {
        source: "/mobile-sign",
        destination: "http://127.0.0.1:3001/mobile-sign",
      },
      {
        source: "/api/signature-sync",
        destination: "http://127.0.0.1:3001/api/signature-sync",
      },
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
      {
        source: "/health",
        destination: `${BACKEND_URL}/health`,
      },
    ];
  },
};

export default nextConfig;
