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
  },
  // Disable static generation for dynamic routes
  trailingSlash: false,
  // Output configuration
  output: 'standalone',
  // Disable static optimization for pages with auth
  staticPageGenerationTimeout: 120,
};

export default nextConfig;
