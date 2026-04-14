import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['pg', '@prisma/adapter-pg', '@prisma/client', '@prisma/driver-adapter-utils'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'ik.imgkit.net' },
    ],
  },
  // Prevent browsers from caching HTML pages so stale server-action IDs
  // from a previous deployment never cause "Failed to find Server Action" errors.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
