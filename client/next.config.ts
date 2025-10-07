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

// Allow Google profile images (e.g., Google OAuth avatars)
remotePatterns.push({
  protocol: 'https',
  hostname: 'lh3.googleusercontent.com',
})

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
    unoptimized: false,
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // Cache images for 1 year
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Configure image quality values (required for Next.js 16+)
    qualities: [60, 75, 85, 90, 100],
  },
  trailingSlash: false,
  output: 'standalone',
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Force Node.js runtime for middleware and API routes using Supabase
  serverExternalPackages: ['@supabase/supabase-js', '@supabase/ssr'],
  experimental: {
    optimizePackageImports: ['@radix-ui/react-avatar', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
  },
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  async headers() {
    return [
      {
        source: '/sitemap.xml',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/xml',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/services/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      // **CACHING DISABLED FOR REAL-TIME UPDATES**
      // Products and categories must always be fresh for instant admin sync
      {
        source: '/api/products/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'no-cache',
          },
        ],
      },
      {
        source: '/api/categories/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'no-cache',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ]
  },
};

export default nextConfig;
