#!/bin/bash

# Build script that skips problematic pages
echo "Building Next.js application..."

# Set environment variables for build
export NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_placeholder"
export CLERK_SECRET_KEY="sk_test_placeholder"
export NEXT_PUBLIC_SUPABASE_URL="https://placeholder.supabase.co"
export SUPABASE_SERVICE_ROLE="placeholder_service_role"

# Run the build
npm run build

echo "Build completed!"