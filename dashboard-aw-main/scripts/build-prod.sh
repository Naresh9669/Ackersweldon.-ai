#!/bin/bash

# Production build script for Next.js dashboard
# Follows Context7 best practices for static asset handling

set -e

echo "🚀 Starting production build..."

# Load environment variables from root .env file
if [ -f "/home/ubuntu/.env" ]; then
    echo "📁 Loading environment from /home/ubuntu/.env"
    export $(grep -v '^#' /home/ubuntu/.env | xargs)
else
    echo "⚠️  Root .env file not found at /home/ubuntu/.env"
    echo "   Environment variables may not be available"
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf .next
rm -rf .next/standalone

# Set production environment
export NODE_ENV=production

# Build the application
echo "🔨 Building Next.js application..."
npm run build:production

# Ensure standalone directory exists
if [ ! -d ".next/standalone" ]; then
    echo "❌ Standalone build failed - .next/standalone directory not found"
    exit 1
fi

# Copy static assets to standalone directory (Context7 best practice)
echo "📁 Copying static assets to standalone directory..."
cp -r public .next/standalone/ 2>/dev/null || echo "⚠️  No public directory to copy"
cp -r .next/static .next/standalone/.next/ 2>/dev/null || echo "⚠️  No static assets to copy"

# Create .env file in standalone directory for runtime environment variables
echo "🔧 Creating runtime environment file..."
cat > .next/standalone/.env << EOF
# Runtime environment variables for standalone Next.js server
# Generated from root .env during build
NODE_ENV=production
NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}
NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY=${NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY}
NEXT_PUBLIC_FINNHUB_API_KEY=${NEXT_PUBLIC_FINNHUB_API_KEY}
NEXT_PUBLIC_POLYGON_API_KEY=${NEXT_PUBLIC_POLYGON_API_KEY}
NEXT_PUBLIC_FMP_API_KEY=${NEXT_PUBLIC_FMP_API_KEY}
NEXT_PUBLIC_OLLAMA_BASE_URL=${NEXT_PUBLIC_OLLAMA_BASE_URL}
NEXT_PUBLIC_OLLAMA_DEFAULT_MODEL=${NEXT_PUBLIC_OLLAMA_DEFAULT_MODEL}
NEXT_PUBLIC_RSS_CACHE_DURATION=${NEXT_PUBLIC_RSS_CACHE_DURATION}
NEXT_PUBLIC_MAX_RSS_ARTICLES_PER_SOURCE=${NEXT_PUBLIC_MAX_RSS_ARTICLES_PER_SOURCE}
NEXT_PUBLIC_MARKET_DATA_CACHE_DURATION=${NEXT_PUBLIC_MARKET_DATA_CACHE_DURATION}
NEXT_PUBLIC_MARKET_INDICES=${NEXT_PUBLIC_MARKET_INDICES}
MONGODB_URI=${MONGODB_URI}
MONGO_URI=${MONGO_URI}
EOF

echo "✅ Runtime environment file created"

# Verify critical files exist
echo "✅ Verifying build output..."
if [ -f ".next/standalone/server.js" ]; then
    echo "✅ server.js found"
else
    echo "❌ server.js not found - build may have failed"
    exit 1
fi

if [ -d ".next/standalone/.next/static" ]; then
    echo "✅ Static assets directory found"
    echo "📊 Static assets count: $(find .next/standalone/.next/static -type f | wc -l)"
else
    echo "❌ Static assets directory not found"
    exit 1
fi

echo "🎉 Production build completed successfully!"
echo "📁 Build output location: .next/standalone/"
echo "🚀 To start: cd .next/standalone && node server.js"
echo "🔧 Environment variables loaded from root .env file"
