#!/bin/bash

# Fix Admin Build Issues Script
# This script fixes the Tailwind CSS and dependency issues in the admin panel

set -e

echo "🔧 Fixing admin build issues..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Navigate to admin directory
cd admin

print_status "Installing updated dependencies..."

# Clean install to ensure all dependencies are properly resolved
if [ -d "node_modules" ]; then
    print_status "Removing existing node_modules..."
    rm -rf node_modules
fi

if [ -f "package-lock.json" ]; then
    print_status "Removing package-lock.json..."
    rm package-lock.json
fi

# Install dependencies
print_status "Installing dependencies..."
npm install

print_status "Testing build locally..."

# Test the build
if npm run build; then
    print_success "✅ Admin build successful!"
    print_status "Admin panel is ready for deployment"
else
    print_error "❌ Admin build failed"
    print_status "Please check the error messages above"
    exit 1
fi

print_success "🎉 Admin build issues have been resolved!"
print_status "You can now deploy using: ./deploy-production.sh"
