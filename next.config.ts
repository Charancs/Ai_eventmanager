import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: 'http://localhost:8000/uploads/:path*'
      },
      {
        source: '/socket.io/:path*',
        destination: '/api/socket-not-found'
      }
    ]
  },
  // Suppress socket.io related warnings in development
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development' ? false : true,
    },
  },
  // Custom headers to prevent socket.io polling
  async headers() {
    return [
      {
        source: '/socket.io/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
    ]
  },
};

export default nextConfig;
