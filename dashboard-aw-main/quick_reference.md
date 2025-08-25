# 🚀 ACKERS WELDON Dashboard - Quick Reference Guide

**Last Updated:** August 26, 2025  
**Status:** Production Ready ✅

---

## 🚨 **EMERGENCY COMMANDS** 🚨

### **Service Status Check**
```bash
# Check all critical services
sudo systemctl status nginx
sudo systemctl status dashboard-api.service
docker ps
ps aux | grep -E "(next|node|npm)" | grep -v grep
```

### **Quick Health Check**
```bash
# Test all subdomains
for subdomain in dashboard search ai api community; do
    echo "🧪 Testing $subdomain.ackersweldon.com"
    curl -I https://$subdomain.ackersweldon.com | head -2
done
```

---

## 🔧 **DAILY OPERATIONS**

### **Start/Stop Services**
```bash
# Frontend (Next.js)
cd /home/ubuntu/aw/dashboard-aw-main
npm start                    # Start production server
npm run dev                 # Start development server

# Backend (Flask)
sudo systemctl start dashboard-api.service
sudo systemctl stop dashboard-api.service
sudo systemctl restart dashboard-api.service

# Nginx
sudo systemctl reload nginx     # Reload config (safe)
sudo systemctl restart nginx    # Restart (if needed)
```

### **Check Service Status**
```bash
# All services
sudo systemctl status dashboard-api.service
sudo systemctl status mongodb-backup.timer
sudo systemctl status nginx

# Docker containers
docker ps
docker logs aw_scraper-main_mongodb_1
docker logs [container_name]

# Process status
ps aux | grep -E "(next|node|npm|gunicorn)" | grep -v grep
```

---

## 🌐 **SUBDOMAIN MANAGEMENT**

### **All Subdomains Status**
```bash
# Test HTTPS connectivity
for subdomain in dashboard search ai api community; do
    echo "🧪 Testing $subdomain.ackersweldon.com"
    curl -I https://$subdomain.ackersweldon.com
done
```

### **Nginx Configuration**
```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx

# Check configuration files
ls -la /etc/nginx/sites-available/
ls -la /etc/nginx/sites-enabled/
```

### **SSL Certificate Management**
```bash
# List all certificates
sudo certbot certificates

# Test renewal process
sudo certbot renew --dry-run

# Manual renewal
sudo certbot renew
```

---

## 💾 **BACKUP & RECOVERY**

### **Database Backups**
```bash
# Check backup status
sudo systemctl status mongodb-backup.timer
sudo systemctl status mongodb-backup.service

# Manual backup
sudo /home/ubuntu/aw/dashboard-aw-main/scripts/backup-database.sh

# List backups
ls -la /home/ubuntu/backups/mongodb/

# Check backup logs
tail -f /var/log/mongodb-backup.log
```

### **Backup Management**
```bash
# Enable/disable backup timer
sudo systemctl enable mongodb-backup.timer
sudo systemctl disable mongodb-backup.timer

# Check next backup time
sudo systemctl list-timers mongodb-backup.timer
```

---

## 🐛 **TROUBLESHOOTING**

### **Common Issues & Solutions**

#### **1. Frontend Not Loading**
```bash
# Check Next.js process
ps aux | grep next

# Check port 3000
netstat -tlnp | grep :3000

# Restart frontend
cd /home/ubuntu/aw/dashboard-aw-main
npm start
```

#### **2. Backend API Errors**
```bash
# Check Flask service
sudo systemctl status dashboard-api.service

# Check logs
journalctl -fu dashboard-api.service

# Test API directly
curl -I https://api.ackersweldon.com/api/news
```

#### **3. Database Connection Issues**
```bash
# Check MongoDB container
docker ps | grep mongo

# Check MongoDB logs
docker logs aw_scraper-main_mongodb_1

# Test connection
docker exec aw_scraper-main_mongodb_1 mongosh --eval "db.adminCommand('ping')"
```

#### **4. SSL/HTTPS Issues**
```bash
# Check SSL certificates
sudo certbot certificates

# Test nginx config
sudo nginx -t

# Check SSL configuration
openssl s_client -connect dashboard.ackersweldon.com:443 -servername dashboard.ackersweldon.com
```

#### **5. Subdomain Not Working**
```bash
# Check nginx config for specific subdomain
sudo cat /etc/nginx/sites-available/[subdomain].ackersweldon.com

# Test subdomain directly
curl -I https://[subdomain].ackersweldon.com

# Check DNS resolution
nslookup [subdomain].ackersweldon.com
```

---

## 📊 **MONITORING & LOGS**

### **Log Locations**
```bash
# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Systemd logs
journalctl -fu dashboard-api.service
journalctl -fu nginx

# Backup logs
tail -f /var/log/mongodb-backup.log

# Application logs
tail -f /home/ubuntu/aw/dashboard-aw-main/production.log
```

### **Performance Monitoring**
```bash
# Check system resources
htop
free -h
df -h

# Check network connections
netstat -tlnp | grep -E "(3000|5001|27017|8080|8081)"

# Check Docker resource usage
docker stats
```

---

## 🔒 **SECURITY CHECKS**

### **SSL/TLS Verification**
```bash
# Test SSL configuration
curl -I https://dashboard.ackersweldon.com

# Check security headers
curl -I https://dashboard.ackersweldon.com | grep -E "(Strict-Transport-Security|X-Frame-Options|X-XSS-Protection)"

# Test SSL Labs (external)
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=dashboard.ackersweldon.com
```

### **Firewall & Network**
```bash
# Check open ports
sudo netstat -tlnp

# Check UFW status
sudo ufw status

# Check iptables
sudo iptables -L
```

---

## 🚀 **DEPLOYMENT & UPDATES**

### **Application Updates**
```bash
# Pull latest changes
cd /home/ubuntu/aw/dashboard-aw-main
git pull origin main

# Install dependencies
npm install

# Build for production
npm run build

# Restart services
sudo systemctl restart dashboard-api.service
# Frontend will auto-restart with npm start
```

### **Configuration Updates**
```bash
# Update nginx configs
sudo cp nginx-*.conf /etc/nginx/sites-available/
sudo nginx -t
sudo systemctl reload nginx

# Update systemd services
sudo cp *.service *.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable [service].timer
```

---

## 📱 **API TESTING**

### **Quick API Tests**
```bash
# Test main dashboard
curl -I https://dashboard.ackersweldon.com

# Test backend API
curl -I https://api.ackersweldon.com/api/news

# Test chart API
curl "https://dashboard.ackersweldon.com/api/yahoo-finance/simple-chart?ticker=AAPL&range=1Y" | jq '.success, .data.meta.dataPoints'

# Test market data
curl -s "https://dashboard.ackersweldon.com/api/yahoo-finance/market-data" | jq '.success, .metadata.symbolsRetrieved'
```

---

## 🗂️ **FILE LOCATIONS**

### **Critical Directories**
```bash
# Application
/home/ubuntu/aw/dashboard-aw-main/

# Nginx configurations
/etc/nginx/sites-available/
/etc/nginx/sites-enabled/

# SSL certificates
/etc/letsencrypt/live/[subdomain]/

# Systemd services
/etc/systemd/system/

# Backups
/home/ubuntu/backups/mongodb/

# Logs
/var/log/nginx/
/var/log/mongodb-backup.log
```

### **Key Configuration Files**
```bash
# Nginx configs
nginx-dashboard-production-https.conf
nginx-ai-ackersweldon.conf
nginx-community-ackersweldon.conf
nginx-api-ackersweldon.conf

# Systemd services
dashboard-api.service
mongodb-backup.service
mongodb-backup.timer

# Backup script
scripts/backup-database.sh
```

---

## 📞 **SUPPORT INFORMATION**

### **Emergency Contacts**
- **Server Access:** SSH to EC2 instance
- **Domain Management:** DNS provider
- **SSL Certificates:** Let's Encrypt

### **Useful Commands for Support**
```bash
# System information
uname -a
lsb_release -a
docker --version
node --version
npm --version

# Service status summary
sudo systemctl status nginx dashboard-api.service mongodb-backup.timer
docker ps
ps aux | grep -E "(next|node|npm)" | grep -v grep

# Network status
netstat -tlnp | grep -E "(3000|5001|27017|8080|8081)"
curl -I https://dashboard.ackersweldon.com
```

---

## 🎯 **QUICK STATUS CHECK**

### **One-Command Health Check**
```bash
echo "🏥 ACKERS WELDON Health Check" && \
echo "=== Services ===" && \
sudo systemctl is-active nginx dashboard-api.service && \
echo "=== Docker ===" && \
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" && \
echo "=== Ports ===" && \
netstat -tlnp | grep -E "(3000|5001|27017|8080|8081)" && \
echo "=== HTTPS ===" && \
curl -s -o /dev/null -w "%{http_code}" https://dashboard.ackersweldon.com
```

---

## 🎉 **PRODUCTION STATUS: READY** 🎉

**All systems operational with enterprise-grade security, automated backups, and comprehensive monitoring!**

For detailed information, see `project_config.md` and `ackersweldon_project_setup.md`.
