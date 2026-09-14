import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:8000';
    return [
      {
        source: '/api/auth/:path*',
        destination: `${backendUrl}/api/auth/:path*`,
      },
      {
        source: '/api/challenges/:path*',
        destination: `${backendUrl}/api/challenges/:path*`,
      },
      {
        source: '/api/execution/:path*',
        destination: `${backendUrl}/api/execution/:path*`,
      },
      {
        source: '/api/gamification/:path*',
        destination: `${backendUrl}/api/gamification/:path*`,
      },
      {
        source: '/api/profile/:path*',
        destination: `${backendUrl}/api/profile/:path*`,
      },
      {
        source: '/api/admin/:path*',
        destination: `${backendUrl}/api/admin/:path*`,
      },
    ];
  },
};

export default nextConfig;
