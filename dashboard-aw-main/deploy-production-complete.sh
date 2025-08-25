#!/bin/bash

echo "🚀 AI Dashboard - Complete Production Deployment"
echo "================================================="
echo "🌐 Domain: dashboard.ackersweldon.com"
echo "📍 Frontend: Port 3000"
echo "📍 Backend: Port 5001"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Check if running as ubuntu user
if [[ $USER != "ubuntu" ]]; then
    print_error "This script must be run as the ubuntu user"
    exit 1
fi

# Step 1: Environment Setup
print_info "🔧 Step 1: Verifying environment configuration..."
if [[ -L ".env" && -f "/home/ubuntu/.env" ]]; then
    print_status "Environment symlink is correctly configured"
else
    print_error "Environment configuration issue. Please ensure .env symlinks to /home/ubuntu/.env"
    exit 1
fi

# Step 2: Install Dependencies
print_info "📦 Step 2: Installing dependencies..."
npm install
if [[ $? -ne 0 ]]; then
    print_error "Failed to install dependencies"
    exit 1
fi
print_status "Dependencies installed successfully"

# Step 3: Build Application
print_info "🏗️  Step 3: Building application for production..."
npm run build
if [[ $? -ne 0 ]]; then
    print_error "Build failed"
    exit 1
fi
print_status "Application built successfully"

# Step 4: Configure Services
print_info "⚙️  Step 4: Configuring systemd services..."

# Stop any existing frontend processes
print_info "Stopping existing Node.js processes..."
pkill -f "npm start" 2>/dev/null || true
pkill -f "next start" 2>/dev/null || true

# Install systemd service
sudo cp ai-dashboard-production.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable ai-dashboard-production.service
print_status "Frontend systemd service configured"

# Step 5: Configure Docker Auto-restart
print_info "🐳 Step 5: Configuring Docker containers for auto-restart..."
if command -v docker &> /dev/null; then
    docker update --restart=unless-stopped $(docker ps -q) 2>/dev/null || true
    print_status "Docker containers configured for auto-restart"
else
    print_warning "Docker not found, skipping container configuration"
fi

# Step 6: Configure Nginx
print_info "🌐 Step 6: Configuring Nginx..."
sudo cp nginx-dashboard-production.conf /etc/nginx/sites-available/dashboard.ackersweldon.com
sudo ln -sf /etc/nginx/sites-available/dashboard.ackersweldon.com /etc/nginx/sites-enabled/dashboard.ackersweldon.com

# Remove old conflicting configurations
sudo rm -f /etc/nginx/sites-enabled/dashboard-app* 2>/dev/null || true

# Test nginx configuration
if sudo nginx -t &>/dev/null; then
    sudo systemctl reload nginx
    print_status "Nginx configured and reloaded successfully"
else
    print_error "Nginx configuration test failed"
    exit 1
fi

# Step 7: Start Services
print_info "🚀 Step 7: Starting production services..."

# Check if backend is running
if curl -s http://127.0.0.1:5001/api/news?limit=1 &>/dev/null; then
    print_status "Backend service is running on port 5001"
else
    print_warning "Backend service not responding on port 5001"
    print_info "Checking backend service status..."
    sudo systemctl status dashboard-api.service --no-pager || true
fi

# Start frontend manually (systemd service has issues with environment sourcing)
print_info "Starting frontend service manually..."
cd /home/ubuntu/aw/dashboard-aw-main
nohup bash -c 'source scripts/ensure-env.sh && NODE_ENV=production npm start' > /tmp/ai-dashboard.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 10

# Test frontend
if curl -s http://127.0.0.1:3000 &>/dev/null; then
    print_status "Frontend service is running on port 3000 (PID: $FRONTEND_PID)"
else
    print_error "Frontend service failed to start"
    print_info "Check logs: tail -f /tmp/ai-dashboard.log"
    exit 1
fi

# Step 8: Final Tests
print_info "🧪 Step 8: Running production tests..."

# Test domain routing
if curl -s -H "Host: dashboard.ackersweldon.com" http://localhost/ | grep -q "ACKERS WELDON"; then
    print_status "Domain routing working correctly"
else
    print_warning "Domain routing test failed"
fi

# Test API endpoints
if curl -s http://127.0.0.1:3000/api/news?limit=1 | grep -q '"success"'; then
    print_status "API endpoints working correctly"
else
    print_warning "API endpoint test failed"
fi

# Step 9: Service Status Summary
print_info "📊 Step 9: Service Status Summary..."
echo ""
echo "🔍 Service Status:"
echo "=================="

# Nginx
if systemctl is-active --quiet nginx; then
    print_status "✅ Nginx: Active"
else
    print_error "❌ Nginx: Inactive"
fi

# Backend
if sudo systemctl is-active --quiet dashboard-api.service; then
    print_status "✅ Backend API: Active (dashboard-api.service)"
else
    print_warning "⚠️  Backend API: Check status"
fi

# Docker containers
if docker ps --format "table {{.Names}}\t{{.Status}}" 2>/dev/null | grep -q "Up"; then
    print_status "✅ Docker Containers: Running"
    docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "(mongodb|searxng|openwebui)"
else
    print_warning "⚠️  Docker Containers: Check status"
fi

# Frontend
if pgrep -f "npm start" &>/dev/null; then
    print_status "✅ Frontend: Running (Manual process)"
else
    print_warning "⚠️  Frontend: Not running"
fi

echo ""
print_info "🎉 Production Deployment Summary:"
echo "=================================="
echo "🌐 Domain: dashboard.ackersweldon.com"
echo "📍 Frontend: http://localhost:3000"
echo "📍 Backend: http://localhost:5001"
echo "📍 AI Summaries: http://localhost:3000/ai-summaries"
echo ""

# Create monitoring script
cat > monitor-services.sh << 'EOF'
#!/bin/bash
echo "🔍 AI Dashboard Service Monitor"
echo "==============================="

# Check Frontend
if pgrep -f "npm start" &>/dev/null; then
    echo "✅ Frontend: Running"
else
    echo "❌ Frontend: Not running"
    echo "   Restart with: cd /home/ubuntu/aw/dashboard-aw-main && nohup bash -c 'source scripts/ensure-env.sh && NODE_ENV=production npm start' > /tmp/ai-dashboard.log 2>&1 &"
fi

# Check Backend
if sudo systemctl is-active --quiet dashboard-api.service; then
    echo "✅ Backend: Running"
else
    echo "❌ Backend: Not running"
    echo "   Restart with: sudo systemctl start dashboard-api.service"
fi

# Check Nginx
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx: Running"
else
    echo "❌ Nginx: Not running"
    echo "   Restart with: sudo systemctl start nginx"
fi

# Check Docker
if docker ps -q &>/dev/null; then
    echo "✅ Docker: $(docker ps --format 'table {{.Names}}' | wc -l) containers running"
else
    echo "❌ Docker: No containers running"
fi

echo ""
echo "🌐 Test URLs:"
echo "   curl -H 'Host: dashboard.ackersweldon.com' http://localhost/"
echo "   curl http://localhost:3000"
echo "   curl http://localhost:5001/api/news?limit=1"
EOF

chmod +x monitor-services.sh
print_status "Created monitoring script: ./monitor-services.sh"

echo ""
print_status "🎊 Production deployment completed successfully!"
print_info "💡 Use './monitor-services.sh' to check service status"
print_info "📋 Frontend logs: tail -f /tmp/ai-dashboard.log"
print_info "📋 Backend logs: sudo journalctl -fu dashboard-api.service"

# Final connectivity test
echo ""
print_info "🔗 Final Connectivity Test:"
if timeout 5 curl -s "http://dashboard.ackersweldon.com" &>/dev/null; then
    print_status "✅ dashboard.ackersweldon.com is accessible"
else
    print_warning "⚠️  dashboard.ackersweldon.com connectivity test failed (may need DNS/firewall configuration)"
fi

echo ""
print_info "🚀 Your AI Dashboard is now running in production mode!"
echo "   Access it at: http://dashboard.ackersweldon.com"
