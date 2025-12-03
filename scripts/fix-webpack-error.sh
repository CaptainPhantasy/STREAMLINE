#!/bin/bash

# Webpack Error Prevention Script
# This script prevents common webpack runtime errors by clearing cache and reinstalling dependencies

echo "🔧 Webpack Error Prevention Script"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running in the correct directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Kill any existing Next.js processes
print_status "Killing existing Next.js processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3002 | xargs kill -9 2>/dev/null || true

# Clear cache based on parameters
CLEAR_ALL=false
CLEAR_NODE_MODULES=false

# Parse arguments
for arg in "$@"; do
    case $arg in
        --all)
            CLEAR_ALL=true
            ;;
        --node-modules)
            CLEAR_NODE_MODULES=true
            ;;
        --help|-h)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --all           Clear .next, node_modules, and package-lock.json"
            echo "  --node-modules  Clear only node_modules and package-lock.json"
            echo "  --help, -h      Show this help message"
            echo ""
            echo "Default behavior: Clear only .next cache"
            exit 0
            ;;
        *)
            print_warning "Unknown argument: $arg"
            ;;
    esac
done

# Clear caches
if [ "$CLEAR_ALL" = true ]; then
    print_status "Performing full cache clear..."
    rm -rf .next
    rm -rf node_modules
    rm -f package-lock.json

    print_status "Reinstalling dependencies with legacy-peer-deps..."
    npm install --legacy-peer-deps
elif [ "$CLEAR_NODE_MODULES" = true ]; then
    print_status "Clearing node_modules and package-lock.json..."
    rm -rf node_modules
    rm -f package-lock.json

    print_status "Reinstalling dependencies with legacy-peer-deps..."
    npm install --legacy-peer-deps
else
    print_status "Clearing .next cache..."
    rm -rf .next

    # Also clear any webpack artifacts
    find . -name ".webpack" -type d -exec rm -rf {} + 2>/dev/null || true
fi

# Clear TypeScript cache if it exists
if [ -d ".tsbuildinfo" ] || [ -f "*.tsbuildinfo" ]; then
    print_status "Clearing TypeScript build cache..."
    rm -f *.tsbuildinfo
    find . -name "*.tsbuildinfo" -delete 2>/dev/null || true
fi

# Verify .npmrc exists with correct configuration
if [ ! -f ".npmrc" ]; then
    print_status "Creating .npmrc with legacy-peer-deps configuration..."
    echo "legacy-peer-deps=true" > .npmrc
else
    if ! grep -q "legacy-peer-deps=true" .npmrc; then
        print_status "Adding legacy-peer-deps to .npmrc..."
        echo "legacy-peer-deps=true" >> .npmrc
    fi
fi

print_status "✅ Webpack error prevention completed!"
echo ""
print_warning "To start the development server, run:"
echo "  npm run dev                    # Default port 3000"
echo "  PORT=3002 npm run dev          # Port 3002"
echo ""
print_warning "If webpack errors persist, run with --all flag:"
echo "  $0 --all"