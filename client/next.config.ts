import type { NextConfig } from "next";

// Allow remote images from the project's Supabase storage domain, if configured
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

const remotePatterns: NonNullable<NextConfig['images']>['remotePatterns'] = []
try {
  if (SUPABASE_URL) {
    const { hostname } = new URL(SUPABASE_URL)
    remotePatterns.push({
      protocol: 'https',
      hostname,
      pathname: '/storage/v1/object/public/**'
    })
  }
} catch {}

// Allow Clerk avatar images
remotePatterns.push(
  { protocol: 'https', hostname: 'img.clerk.com', pathname: '/**' },
  { protocol: 'https', hostname: 'images.clerk.dev', pathname: '/**' }
)

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
    unoptimized: false,
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  trailingSlash: false,
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/services/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
};

export default nextConfig;
