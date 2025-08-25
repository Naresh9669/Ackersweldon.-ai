#!/bin/bash

# Production startup script for AI Dashboard
echo "🚀 Starting AI Dashboard Production Deployment..."

# Kill any existing processes
echo "📋 Stopping existing processes..."
pkill -f "npm start" 2>/dev/null || true
pkill -f "next start" 2>/dev/null || true
pkill -f "node.*next" 2>/dev/null || true

# Wait a moment for processes to stop
sleep 2

# Set production environment
export NODE_ENV=production
export PORT=3000

# Ensure environment is set up
echo "🔧 Setting up environment..."
./scripts/ensure-env.sh

# Build the application
echo "🏗️  Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Check the errors above."
    exit 1
fi

# Start the production server
echo "🌟 Starting production server on port 3000..."
echo "📍 Frontend: http://localhost:3000"
echo "📍 Backend should be running on: http://localhost:5001"
echo "📍 Press Ctrl+C to stop"

# Start the server
npm start --hostname 0.0.0.0 --port 3000
