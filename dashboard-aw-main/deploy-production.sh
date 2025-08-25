#!/bin/bash

echo "🚀 AI Dashboard Production Deployment Script"
echo "============================================="

# Check if running as root for systemd operations
if [[ $EUID -eq 0 ]]; then
   echo "❌ Don't run this script as root. Run as ubuntu user."
   exit 1
fi

# Stop any existing processes
echo "📋 Stopping existing processes..."
pkill -f "npm start" 2>/dev/null || true
pkill -f "next start" 2>/dev/null || true
sudo systemctl stop ai-dashboard 2>/dev/null || true

# Install dependencies and build
echo "📦 Installing dependencies..."
npm install

echo "🏗️  Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Check the errors above."
    exit 1
fi

# Set up systemd service (optional)
read -p "🤔 Do you want to set up systemd service for auto-start? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "⚙️  Setting up systemd service..."
    sudo cp ai-dashboard.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable ai-dashboard
    echo "✅ Systemd service configured. You can use:"
    echo "   sudo systemctl start ai-dashboard"
    echo "   sudo systemctl status ai-dashboard"
    echo "   sudo systemctl stop ai-dashboard"
fi

# Check backend status
echo "🔍 Checking backend status..."
if curl -s http://127.0.0.1:5001/api/news?limit=1 > /dev/null; then
    echo "✅ Backend is running on port 5001"
else
    echo "⚠️  Backend not responding on port 5001"
    echo "   Make sure your Python backend is running"
fi

# Check nginx status
echo "🔍 Checking nginx status..."
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
else
    echo "⚠️  Nginx is not running. You may want to start it:"
    echo "   sudo systemctl start nginx"
fi

echo ""
echo "🎉 Production deployment ready!"
echo "📍 Frontend will run on: http://localhost:3000"
echo "📍 Backend should be on: http://localhost:5001"
echo ""
echo "🚀 To start the application:"
echo "   ./start-production.sh"
echo ""
echo "🔧 Or use systemd (if configured):"
echo "   sudo systemctl start ai-dashboard"
