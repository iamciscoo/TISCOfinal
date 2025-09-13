#!/bin/bash

# TISCO Platform - Vercel Environment Variables Setup Script
# This script helps you set up environment variables in Vercel for production deployment

set -e

echo "🔧 Setting up Vercel Environment Variables for TISCO Platform..."

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

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    print_error "Vercel CLI is not installed. Please install it first:"
    echo "npm i -g vercel"
    exit 1
fi

# Function to set environment variables for a project
setup_env_vars() {
    local project_name=$1
    local env_file=$2
    local project_path=$3
    
    print_status "Setting up environment variables for $project_name..."
    
    cd "$project_path"
    
    if [ ! -f "$env_file" ]; then
        print_error "$env_file not found in $project_path"
        return 1
    fi
    
    # Read environment variables from file and set them in Vercel
    while IFS= read -r line; do
        # Skip comments and empty lines
        if [[ $line =~ ^[[:space:]]*# ]] || [[ -z "$line" ]]; then
            continue
        fi
        
        # Extract key=value pairs
        if [[ $line =~ ^([^=]+)=(.*)$ ]]; then
            key="${BASH_REMATCH[1]}"
            value="${BASH_REMATCH[2]}"
            
            # Remove quotes if present
            value=$(echo "$value" | sed 's/^["'\'']\|["'\'']$//g')
            
            print_status "Setting $key..."
            
            # Set environment variable in Vercel
            if vercel env add "$key" production <<< "$value" 2>/dev/null; then
                print_success "✅ $key set successfully"
            else
                # Variable might already exist, try to remove and add again
                vercel env rm "$key" production --yes 2>/dev/null || true
                if vercel env add "$key" production <<< "$value" 2>/dev/null; then
                    print_success "✅ $key updated successfully"
                else
                    print_warning "⚠️  Failed to set $key"
                fi
            fi
        fi
    done < "$env_file"
    
    cd - > /dev/null
    print_success "$project_name environment variables configured!"
}

# Setup client environment variables
print_status "Configuring client application environment variables..."
setup_env_vars "Client" ".env.production" "client"

echo ""

# Setup admin environment variables
print_status "Configuring admin application environment variables..."
setup_env_vars "Admin" ".env.production" "admin"

echo ""
print_success "🎉 All environment variables have been configured in Vercel!"
print_status "You can now deploy your applications using the deploy-production.sh script"
print_warning "Remember to update your .env.production files with actual production keys before deployment"
