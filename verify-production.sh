#!/bin/bash

# TISCO Platform Production Verification Script
# This script helps verify that your production deployment is working correctly

set -e

echo "🔍 Verifying TISCO Platform Production Deployment..."

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

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to test URL endpoint
test_endpoint() {
    local url=$1
    local description=$2
    
    print_status "Testing $description: $url"
    
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|301\|302"; then
        print_success "✅ $description is accessible"
        return 0
    else
        print_error "❌ $description is not accessible"
        return 1
    fi
}

# Get deployment URLs from user input
echo "Please provide your production deployment URLs:"
read -p "Client App URL (e.g., https://tisco-client.vercel.app): " CLIENT_URL
read -p "Admin App URL (e.g., https://tisco-admin.vercel.app): " ADMIN_URL

# Remove trailing slashes
CLIENT_URL=${CLIENT_URL%/}
ADMIN_URL=${ADMIN_URL%/}

echo ""
print_status "Starting verification tests..."

# Test basic accessibility
TESTS_PASSED=0
TOTAL_TESTS=0

# Client app tests
echo ""
print_status "Testing Client Application..."
((TOTAL_TESTS++))
if test_endpoint "$CLIENT_URL" "Client Homepage"; then
    ((TESTS_PASSED++))
fi

((TOTAL_TESTS++))
if test_endpoint "$CLIENT_URL/sign-in" "Client Sign-in Page"; then
    ((TESTS_PASSED++))
fi

((TOTAL_TESTS++))
if test_endpoint "$CLIENT_URL/api/products" "Client Products API"; then
    ((TESTS_PASSED++))
fi

# Admin app tests
echo ""
print_status "Testing Admin Application..."
((TOTAL_TESTS++))
if test_endpoint "$ADMIN_URL" "Admin Homepage"; then
    ((TESTS_PASSED++))
fi

((TOTAL_TESTS++))
if test_endpoint "$ADMIN_URL/sign-in" "Admin Sign-in Page"; then
    ((TESTS_PASSED++))
fi

((TOTAL_TESTS++))
if test_endpoint "$ADMIN_URL/api/products" "Admin Products API"; then
    ((TESTS_PASSED++))
fi

# Summary
echo ""
echo "📊 Verification Summary:"
echo "======================="
print_status "Tests passed: $TESTS_PASSED/$TOTAL_TESTS"

if [ $TESTS_PASSED -eq $TOTAL_TESTS ]; then
    print_success "🎉 All tests passed! Your production deployment looks good."
else
    print_warning "⚠️  Some tests failed. Please check the issues above."
fi

echo ""
print_status "Manual verification checklist:"
echo "□ Sign up with a new account on client app"
echo "□ Sign in with existing account on client app"
echo "□ Add items to cart and test checkout flow"
echo "□ Sign in to admin panel"
echo "□ Create/edit/delete products in admin"
echo "□ View orders in admin panel"
echo "□ Test image uploads"
echo "□ Verify email notifications work"

echo ""
print_status "If any issues are found:"
echo "1. Check Vercel function logs"
echo "2. Verify environment variables in Vercel dashboard"
echo "3. Check Clerk dashboard for authentication issues"
echo "4. Review Supabase logs for database errors"
