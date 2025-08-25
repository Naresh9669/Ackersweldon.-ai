#!/bin/bash

# Dashboard AW Startup Script
# Following Node.js production best practices

set -e  # Exit on any error

# Configuration
APP_NAME="dashboard-aw"
APP_DIR="/home/ubuntu/aw/dashboard-aw-main"
LOG_DIR="$APP_DIR/logs"
PM2_CONFIG="$APP_DIR/ecosystem.config.js"
NODE_ENV=${NODE_ENV:-production}
PORT=${PORT:-3000}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

log "Starting $APP_NAME in $NODE_ENV mode..."

# Check if we're in the right directory
if [ ! -f "$APP_DIR/package.json" ]; then
    error "package.json not found in $APP_DIR"
    exit 1
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    error "PM2 is not installed. Installing PM2..."
    npm install -g pm2
fi

# Check if the app is already running
if pm2 list | grep -q "$APP_NAME"; then
    warning "App is already running. Stopping and restarting..."
    pm2 stop "$APP_NAME" || true
    pm2 delete "$APP_NAME" || true
fi

# Install dependencies if needed
if [ ! -d "$APP_DIR/node_modules" ]; then
    log "Installing dependencies..."
    cd "$APP_DIR"
    npm ci --production
fi

# Build the application if needed
if [ "$NODE_ENV" = "production" ] && [ ! -d "$APP_DIR/.next" ]; then
    log "Building application..."
    cd "$APP_DIR"
    npm run build
fi

# Start the application with PM2
log "Starting application with PM2..."
cd "$APP_DIR"

# Set environment variables
export NODE_ENV="$NODE_ENV"
export PORT="$PORT"

# Start with PM2
pm2 start ecosystem.config.js --env production

# Wait a moment for the app to start
sleep 5

# Check if the app is running
if pm2 list | grep -q "$APP_NAME.*online"; then
    success "Application started successfully!"
    
    # Show status
    pm2 show "$APP_NAME"
    
    # Save PM2 configuration
    pm2 save
    
    # Setup PM2 startup script
    pm2 startup
    
    log "Application is now running on port $PORT"
    log "Health check available at: http://localhost:$PORT/api/health"
    log "View logs with: pm2 logs $APP_NAME"
    log "Monitor with: pm2 monit"
    
else
    error "Failed to start application"
    pm2 logs "$APP_NAME" --lines 20
    exit 1
fi

# Monitor the application for a few seconds
log "Monitoring application startup..."
sleep 10

# Check health endpoint
if command -v curl &> /dev/null; then
    log "Checking application health..."
    if curl -f -s "http://localhost:$PORT/api/health" > /dev/null; then
        success "Health check passed!"
    else
        warning "Health check failed - application may still be starting up"
    fi
fi

log "Startup complete! Application is running and monitored by PM2."
