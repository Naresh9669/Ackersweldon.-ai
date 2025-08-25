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
