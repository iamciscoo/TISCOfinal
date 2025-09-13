#!/bin/bash

# TISCO Platform Production Deployment Script
# This script automates the deployment of both client and admin applications to Vercel

set -e  # Exit on any error

echo "🚀 Starting TISCO Platform Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    print_error "Vercel CLI is not installed. Please install it first:"
    echo "npm i -g vercel"
    exit 1
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    print_error "You are not logged in to Vercel. Please run 'vercel login' first."
    exit 1
fi

print_status "Vercel CLI is ready!"

# Function to deploy application
deploy_app() {
    local app_name=$1
    local app_path=$2
    
    print_status "Deploying $app_name..."
    
    cd "$app_path"
    
    # Check if .env.production exists
    if [ ! -f ".env.production" ]; then
        print_error ".env.production file not found in $app_path"
        print_warning "Please create .env.production with your production environment variables"
        return 1
    fi
    
    # Deploy to production
    if vercel --prod --yes; then
        print_success "$app_name deployed successfully!"
        
        # Get the deployment URL
        DEPLOYMENT_URL=$(vercel ls --scope=team 2>/dev/null | grep "$app_name" | head -1 | awk '{print $2}' || echo "Unable to fetch URL")
        print_status "$app_name URL: https://$DEPLOYMENT_URL"
        
    else
        print_error "Failed to deploy $app_name"
        return 1
    fi
    
    cd - > /dev/null
}

# Pre-deployment checks
print_status "Running pre-deployment checks..."

# Check if production environment files exist
if [ ! -f "client/.env.production" ]; then
    print_error "client/.env.production not found!"
    print_warning "Please update client/.env.production with your actual Clerk production keys"
    exit 1
fi

if [ ! -f "admin/.env.production" ]; then
    print_error "admin/.env.production not found!"
    print_warning "Please update admin/.env.production with your actual Clerk production keys"
    exit 1
fi

# Check if production keys are properly set
if grep -q "YOUR_PRODUCTION" client/.env.production; then
    print_error "client/.env.production still contains placeholder values!"
    print_warning "Please replace 'YOUR_PRODUCTION_*' with actual Clerk production keys"
    exit 1
fi

if grep -q "YOUR_PRODUCTION" admin/.env.production; then
    print_error "admin/.env.production still contains placeholder values!"
    print_warning "Please replace 'YOUR_PRODUCTION_*' with actual Clerk production keys"
    exit 1
fi

print_success "Pre-deployment checks passed!"

# Deploy client application
print_status "Starting client application deployment..."
if deploy_app "TISCO Client" "client"; then
    CLIENT_DEPLOYED=true
else
    CLIENT_DEPLOYED=false
fi

# Deploy admin application
print_status "Starting admin application deployment..."
if deploy_app "TISCO Admin" "admin"; then
    ADMIN_DEPLOYED=true
else
    ADMIN_DEPLOYED=false
fi

# Summary
echo ""
echo "🎉 Deployment Summary:"
echo "====================="

if [ "$CLIENT_DEPLOYED" = true ]; then
    print_success "✅ Client application deployed successfully"
else
    print_error "❌ Client application deployment failed"
fi

if [ "$ADMIN_DEPLOYED" = true ]; then
    print_success "✅ Admin application deployed successfully"
else
    print_error "❌ Admin application deployment failed"
fi

echo ""
print_status "Next steps:"
echo "1. Update Clerk dashboard with your production domain URLs"
echo "2. Configure Supabase CORS settings for production domains"
echo "3. Test authentication on both applications"
echo "4. Verify all critical user flows work correctly"
echo ""
print_status "For detailed instructions, see PRODUCTION_DEPLOYMENT_GUIDE.md"

if [ "$CLIENT_DEPLOYED" = true ] && [ "$ADMIN_DEPLOYED" = true ]; then
    print_success "🚀 All applications deployed successfully!"
    exit 0
else
    print_error "⚠️  Some deployments failed. Please check the logs above."
    exit 1
fi
