#!/bin/bash

# Development server script for Next.js dashboard
# Follows Context7 best practices and loads root .env file

set -e

echo "🚀 Starting Next.js development server..."

# Load environment variables from root .env file
if [ -f "/home/ubuntu/.env" ]; then
    echo "📁 Loading environment from /home/ubuntu/.env"
    export $(grep -v '^#' /home/ubuntu/.env | xargs)
else
    echo "⚠️  Root .env file not found at /home/ubuntu/.env"
    echo "   Environment variables may not be available"
fi

# Set development environment
export NODE_ENV=development

# Check if port 3000 is available
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 3000 is already in use"
    echo "   Available options:"
    echo "   - Kill existing process: pkill -f 'next dev'"
    echo "   - Use different port: npm run dev -- --port 3001"
    echo "   - Use external access: npm run dev:external"
    echo ""
    read -p "Do you want to kill the existing process? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔄 Killing existing Next.js process..."
        pkill -f "next dev" || echo "No existing process found"
        sleep 2
    else
        echo "❌ Port 3000 is busy. Exiting."
        exit 1
    fi
fi

# Check for common development issues
echo "🔍 Checking development environment..."

# Verify .env variables are loaded
if [ -z "$NEXT_PUBLIC_API_URL" ]; then
    echo "⚠️  NEXT_PUBLIC_API_URL not set"
else
    echo "✅ NEXT_PUBLIC_API_URL: $NEXT_PUBLIC_API_URL"
fi

if [ -z "$MONGODB_URI" ]; then
    echo "⚠️  MONGODB_URI not set"
else
    echo "✅ MONGODB_URI: $MONGODB_URI"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if .next exists and is recent
if [ -d ".next" ]; then
    echo "🧹 Cleaning old build cache..."
    rm -rf .next
fi

echo "🚀 Starting development server..."
echo "   - Local access: http://127.0.0.1:3000"
echo "   - External access: http://0.0.0.0:3000"
echo "   - Environment: $NODE_ENV"
echo "   - Root .env: /home/ubuntu/.env"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start development server
exec npm run dev
