import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
    return [
      {
        // Apply CORS headers to all API routes
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: allowedOrigin },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, x-user-id' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
        ],
      },
    ];
  },
};

export default nextConfig;
