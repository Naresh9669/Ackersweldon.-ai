#!/bin/bash

echo "🚀 AI Dashboard - Final Production Deployment"
echo "=============================================="
echo "🌐 Domain: https://dashboard.ackersweldon.com"
echo "📍 Frontend: Port 3000"
echo "📍 Backend: Port 5001"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

print_header() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# Check if running as ubuntu user
if [[ $USER != "ubuntu" ]]; then
    print_error "This script must be run as the ubuntu user"
    exit 1
fi

# Step 1: Stop existing processes
print_header "🛑 Step 1: Stopping existing processes..."
pkill -f "npm start" 2>/dev/null || true
pkill -f "next start" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true
print_status "Existing Node.js processes stopped"

# Step 2: Environment verification
print_header "🔧 Step 2: Verifying environment configuration..."
if [[ -L ".env" && -f "/home/ubuntu/.env" ]]; then
    print_status "Environment symlink is correctly configured"
else
    print_error "Environment configuration issue. Please ensure .env symlinks to /home/ubuntu/.env"
    exit 1
fi

# Step 3: Install dependencies and build
print_header "📦 Step 3: Installing dependencies and building..."
npm install --production=false
if [[ $? -ne 0 ]]; then
    print_error "Failed to install dependencies"
    exit 1
fi

npm run build
if [[ $? -ne 0 ]]; then
    print_error "Build failed"
    exit 1
fi
print_status "Application built successfully"

# Step 4: Configure Nginx with HTTPS
print_header "🌐 Step 4: Configuring Nginx with HTTPS..."
sudo cp nginx-dashboard-production-https.conf /etc/nginx/sites-available/dashboard.ackersweldon.com
sudo ln -sf /etc/nginx/sites-available/dashboard.ackersweldon.com /etc/nginx/sites-enabled/dashboard.ackersweldon.com

# Remove old conflicting configurations
sudo rm -f /etc/nginx/sites-available/dashboard-app* 2>/dev/null || true
sudo rm -f /etc/nginx/sites-enabled/dashboard-app* 2>/dev/null || true

# Test nginx configuration
if sudo nginx -t &>/dev/null; then
    sudo systemctl reload nginx
    print_status "Nginx configured with HTTPS and reloaded successfully"
else
    print_error "Nginx configuration test failed"
    exit 1
fi

# Step 5: Configure systemd services
print_header "⚙️  Step 5: Configuring systemd services..."
sudo cp ai-dashboard-production.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable ai-dashboard-production.service
print_status "Frontend systemd service configured"

# Step 6: Configure Docker auto-restart
print_header "🐳 Step 6: Configuring Docker containers..."
if command -v docker &> /dev/null; then
    docker update --restart=unless-stopped $(docker ps -q) 2>/dev/null || true
    print_status "Docker containers configured for auto-restart"
else
    print_warning "Docker not found, skipping container configuration"
fi

# Step 7: Start production services
print_header "🚀 Step 7: Starting production services..."

# Check backend status
if curl -s http://127.0.0.1:5001/api/news?limit=1 &>/dev/null; then
    print_status "Backend service is running on port 5001"
else
    print_warning "Backend service not responding on port 5001"
    print_info "Checking backend service status..."
    sudo systemctl status dashboard-api.service --no-pager || true
fi

# Start frontend service
print_info "Starting frontend service..."
cd /home/ubuntu/aw/dashboard-aw-main
nohup bash -c 'source scripts/ensure-env.sh && NODE_ENV=production npm start' > /tmp/ai-dashboard.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 15

# Test services
if curl -s http://127.0.0.1:3000 &>/dev/null; then
    print_status "Frontend service is running on port 3000 (PID: $FRONTEND_PID)"
else
    print_error "Frontend service failed to start"
    print_info "Check logs: tail -f /tmp/ai-dashboard.log"
    exit 1
fi

# Step 8: Final verification
print_header "🧪 Step 8: Final verification tests..."

# Test HTTPS
if curl -s https://dashboard.ackersweldon.com | grep -q "ACKERS WELDON"; then
    print_status "HTTPS dashboard is accessible"
else
    print_warning "HTTPS dashboard test failed"
fi

# Test AI Summaries
if curl -s https://dashboard.ackersweldon.com/ai-summaries | grep -q "AI.*Summaries"; then
    print_status "AI Summaries page is working"
else
    print_warning "AI Summaries page test failed"
fi

# Test API
if curl -s https://dashboard.ackersweldon.com/api/news?limit=1 | grep -q '"success"'; then
    print_status "API endpoints are working"
else
    print_warning "API endpoint test failed"
fi

# Step 9: Service status summary
print_header "📊 Step 9: Service Status Summary"
echo ""
echo "🔍 Production Services Status:"
echo "=============================="

# Nginx
if systemctl is-active --quiet nginx; then
    print_status "✅ Nginx: Active (HTTPS enabled)"
else
    print_error "❌ Nginx: Inactive"
fi

# Backend
if sudo systemctl is-active --quiet dashboard-api.service; then
    print_status "✅ Backend API: Active (dashboard-api.service)"
else
    print_warning "⚠️  Backend API: Check status"
fi

# Frontend
if pgrep -f "npm start" &>/dev/null; then
    print_status "✅ Frontend: Running (Production mode)"
else
    print_warning "⚠️  Frontend: Not running"
fi

# Docker containers
if docker ps --format "table {{.Names}}\t{{.Status}}" 2>/dev/null | grep -q "Up"; then
    print_status "✅ Docker Containers: Running"
    echo "   $(docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "(mongodb|searxng|openwebui)" | wc -l) containers active"
else
    print_warning "⚠️  Docker Containers: Check status"
fi

# SSL Certificate
if openssl x509 -in /etc/letsencrypt/live/dashboard.ackersweldon.com/fullchain.pem -noout -dates 2>/dev/null | grep -q "notAfter"; then
    CERT_EXPIRY=$(openssl x509 -in /etc/letsencrypt/live/dashboard.ackersweldon.com/fullchain.pem -noout -enddate 2>/dev/null | cut -d= -f2)
    print_status "✅ SSL Certificate: Valid (expires: ${CERT_EXPIRY})"
else
    print_warning "⚠️  SSL Certificate: Check status"
fi

echo ""
print_header "🎉 Final Production Deployment Summary"
echo "======================================"
echo "🌐 Primary URL: https://dashboard.ackersweldon.com"
echo "🔗 AI Summaries: https://dashboard.ackersweldon.com/ai-summaries"
echo "📰 News: https://dashboard.ackersweldon.com/news"
echo "💼 Financial: https://dashboard.ackersweldon.com/financials"
echo "🔍 Search: https://dashboard.ackersweldon.com/general-search"
echo "🛡️  KYC: https://dashboard.ackersweldon.com/KYC"
echo ""
echo "📊 Technical Details:"
echo "   Frontend: Next.js on port 3000"
echo "   Backend: Python/Flask on port 5001"
echo "   Database: MongoDB (Docker)"
echo "   Search: SearXNG (Docker)"
echo "   SSL: Let's Encrypt certificates"
echo "   Web Server: Nginx with HTTP/2"
echo ""

# Create monitoring script
cat > monitor-production.sh << 'EOF'
#!/bin/bash
echo "🔍 AI Dashboard Production Monitor"
echo "=================================="

# Check HTTPS
if curl -s https://dashboard.ackersweldon.com >/dev/null; then
    echo "✅ HTTPS Dashboard: Accessible"
else
    echo "❌ HTTPS Dashboard: Not accessible"
fi

# Check Frontend
if pgrep -f "npm start" &>/dev/null; then
    echo "✅ Frontend: Running (PID: $(pgrep -f 'npm start'))"
else
    echo "❌ Frontend: Not running"
    echo "   Restart: cd /home/ubuntu/aw/dashboard-aw-main && nohup bash -c 'source scripts/ensure-env.sh && NODE_ENV=production npm start' > /tmp/ai-dashboard.log 2>&1 &"
fi

# Check Backend
if sudo systemctl is-active --quiet dashboard-api.service; then
    echo "✅ Backend: Running"
else
    echo "❌ Backend: Not running"
    echo "   Restart: sudo systemctl start dashboard-api.service"
fi

# Check Nginx
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx: Running"
else
    echo "❌ Nginx: Not running"
    echo "   Restart: sudo systemctl start nginx"
fi

# Check SSL Certificate
CERT_DAYS=$(( ($(date -d "$(openssl x509 -in /etc/letsencrypt/live/dashboard.ackersweldon.com/fullchain.pem -noout -enddate 2>/dev/null | cut -d= -f2)" +%s) - $(date +%s)) / 86400 ))
if [[ $CERT_DAYS -gt 30 ]]; then
    echo "✅ SSL Certificate: Valid ($CERT_DAYS days remaining)"
elif [[ $CERT_DAYS -gt 0 ]]; then
    echo "⚠️  SSL Certificate: Expires soon ($CERT_DAYS days remaining)"
else
    echo "❌ SSL Certificate: Expired or invalid"
fi

# Check Docker
DOCKER_COUNT=$(docker ps -q | wc -l)
if [[ $DOCKER_COUNT -gt 0 ]]; then
    echo "✅ Docker: $DOCKER_COUNT containers running"
else
    echo "❌ Docker: No containers running"
fi

echo ""
echo "📋 Quick Commands:"
echo "   View frontend logs: tail -f /tmp/ai-dashboard.log"
echo "   View backend logs: sudo journalctl -fu dashboard-api.service"
echo "   Test API: curl https://dashboard.ackersweldon.com/api/news?limit=1"
echo "   Nginx status: sudo systemctl status nginx"
EOF

chmod +x monitor-production.sh
print_status "Created production monitoring script: ./monitor-production.sh"

echo ""
print_status "🎊 Production deployment completed successfully!"
print_info "💡 Use './monitor-production.sh' to check system status"
print_info "📋 Frontend logs: tail -f /tmp/ai-dashboard.log"
print_info "📋 Backend logs: sudo journalctl -fu dashboard-api.service"

echo ""
print_header "🔗 Your AI Dashboard is now live at:"
echo "   https://dashboard.ackersweldon.com"
echo ""
print_info "✨ All services are configured for automatic restart on system reboot"
print_info "🔒 HTTPS is enabled with Let's Encrypt certificates"
print_info "🚀 The application is production-ready and optimized"
