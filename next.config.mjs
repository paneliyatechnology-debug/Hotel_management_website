/** @type {import('next').NextConfig} */
const BACKEND_URL = process.env.BACKEND_PROXY_URL || "http://127.0.0.1:5000";

const nextConfig = {
  allowedDevOrigins: ['192.168.1.103', 'localhost', '127.0.0.1'],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
