/** @type {import('next').NextConfig} */
const BACKEND_URL = process.env.BACKEND_PROXY_URL || "http://127.0.0.1:5000";

const nextConfig = {
  allowedDevOrigins: [
    '192.168.1.101',
    '192.168.1.*',
    '192.168.*.*',
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
  ],
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
    ];
  },
};

export default nextConfig;
