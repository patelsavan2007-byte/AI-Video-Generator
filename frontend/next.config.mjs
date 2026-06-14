/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  
  // Standalone output for Docker
  output: "standalone",

  // Image optimization for external URLs
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "http",
        hostname: "api",
      },
    ],
    unoptimized: process.env.NODE_ENV === 'development',
  },

  // API Rewrites - routes /api/* to the FastAPI backend
  async rewrites() {
    const API_URL = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${API_URL}/:path*`,
      },
      {
        source: "/media/:path*",
        destination: `${API_URL}/media/:path*`,
      }
    ];
  },
};

export default nextConfig;
