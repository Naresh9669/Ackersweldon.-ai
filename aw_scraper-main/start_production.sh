#!/bin/bash

# Production Dashboard API Startup Script

echo "Starting Dashboard API in production mode..."

# Activate virtual environment
source venv/bin/activate

# Create logs directory if it does not exist
mkdir -p logs

# Kill any existing processes
pkill -f "gunicorn.*dashboard_api" || true
pkill -f "python3.*api_dashboard" || true

# Start with Gunicorn in production mode
gunicorn -c gunicorn.conf.py wsgi:app --daemon

echo "Dashboard API started in production mode on port 5001"
echo "Check logs/gunicorn_access.log for access logs"
echo "Check logs/gunicorn_error.log for error logs"
