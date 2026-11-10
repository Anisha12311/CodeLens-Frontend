import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Every API route lives in the Express backend, so the browser only ever talks to this origin.
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_URL ?? 'http://localhost:5000'}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
