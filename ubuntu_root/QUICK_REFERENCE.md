# 🚀 Quick Reference Card - AckersWeldon Dashboard

## **🌐 Subdomains & Status**
- `ackersweldon.com` → External WordPress ✅
- `dashboard.ackersweldon.com` → Our App ⏳ (DNS pending)
- `ai.ackersweldon.com` → OpenWebUI ⏳ (DNS pending)  
- `community.ackersweldon.com` → Odoo ✅ (Working)

## **🔧 Service Management**

### **Start/Stop Services**
```bash
# Flask Backend
sudo systemctl start dashboard-api
sudo systemctl stop dashboard-api
sudo systemctl restart dashboard-api

# NGINX
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl reload nginx
```

### **Check Status**
```bash
# Service Status
sudo systemctl status dashboard-api
sudo systemctl status nginx

# Port Usage
sudo netstat -tlnp | grep -E ":(80|443|3000|5001|8080)"
```

## **📝 Configuration Management**

### **NGINX**
```bash
# Test Config
sudo nginx -t

# Reload Config
sudo systemctl reload nginx

# View Config
sudo cat /etc/nginx/sites-available/dashboard-app
```

### **View Logs**
```bash
# Flask Backend
sudo journalctl -u dashboard-api -f

# NGINX
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## **🧪 Testing Commands**

### **Local Testing**
```bash
# Backend Health
curl -s http://127.0.0.1:5001/health

# Dashboard Subdomain
curl -s -H "Host: dashboard.ackersweldon.com" -k https://localhost/api/health

# AI Subdomain
curl -s -H "Host: ai.ackersweldon.com" -k https://localhost/

# Community Subdomain
curl -s -H "Host: community.ackersweldon.com" -k https://localhost/
```

### **External Testing (after DNS)**
```bash
# Dashboard
curl -I https://dashboard.ackersweldon.com
curl -s https://dashboard.ackersweldon.com/api/health

# AI
curl -I https://ai.ackersweldon.com

# Community
curl -I https://community.ackersweldon.com
```

## **📁 Key File Locations**
- **Frontend**: `/home/ubuntu/aw/dashboard-aw-main/`
- **Backend**: `/home/ubuntu/aw/aw_scraper-main/`
- **NGINX Config**: `/etc/nginx/sites-available/dashboard-app`
- **SSL Certs**: `/etc/nginx/ssl/`
- **Service**: `/etc/systemd/system/dashboard-api.service`

## **🔑 Current Setup**
- **Server IP**: `35.173.33.118`
- **Frontend Port**: `3000` (Next.js)
- **Backend Port**: `5001` (Flask - local only)
- **AI Port**: `8080` (OpenWebUI)
- **NGINX Ports**: `80` (HTTP), `443` (HTTPS)

## **📋 DNS Records Needed**
```
dashboard.ackersweldon.com → 35.173.33.118 (A record)
ai.ackersweldon.com → 35.173.33.118 (A record)
```

## **⚡ Quick Fixes**

### **If Flask Backend Fails**
```bash
sudo systemctl restart dashboard-api
sudo journalctl -u dashboard-api -f
```

### **If NGINX Fails**
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### **If Ports Are Blocked**
```bash
sudo netstat -tlnp | grep :5001
sudo pkill -f gunicorn
sudo systemctl start dashboard-api
```

## **📊 Health Check**
```bash
# All Services Status
echo "=== SERVICE STATUS ==="
sudo systemctl is-active dashboard-api
sudo systemctl is-active nginx
echo "=== PORTS ==="
sudo netstat -tlnp | grep -E ":(80|443|3000|5001|8080)"
echo "=== API HEALTH ==="
curl -s http://127.0.0.1:5001/health
```

---
**Last Updated**: 2025-08-18  
**Status**: Ready for DNS update 🎯
