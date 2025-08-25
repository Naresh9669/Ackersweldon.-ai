# 📋 Project Rules & Architecture Constraints

## **🏗️ Architecture Rules**

### **1. Multi-Subdomain Architecture**
- **Rule**: Each service gets its own subdomain
- **Reason**: Clean separation, independent scaling, better security
- **Implementation**: NGINX reverse proxy with SSL termination

### **2. Backend Security**
- **Rule**: Flask backend NEVER exposed publicly
- **Binding**: `127.0.0.1:5001` only
- **Access**: Only via NGINX proxy from same server
- **Reason**: Security, no direct external access to API

### **3. Frontend-Backend Communication**
- **Rule**: Use relative paths only (`/api/...`)
- **No Hardcoded IPs**: Never use `http://IP:PORT` in frontend
- **Environment**: `NEXT_PUBLIC_API_URL` should be empty
- **Reason**: Same-origin policy, no CORS issues

### **4. SSL/TLS Requirements**
- **Rule**: All subdomains must use HTTPS
- **HTTP**: Automatically redirect to HTTPS
- **Certificates**: Separate SSL certs for each subdomain
- **Reason**: Security, browser compatibility

## **🔒 Security Rules**

### **1. Port Exposure**
- **Public Ports**: Only 80 (HTTP) and 443 (HTTPS)
- **Internal Ports**: 3000 (Next.js), 5001 (Flask), 8080 (OpenWebUI)
- **Rule**: Internal services never directly accessible from internet

### **2. Service Binding**
- **NGINX**: `0.0.0.0:80/443` (public)
- **Next.js**: `::3000` (IPv6 localhost)
- **Flask**: `127.0.0.1:5001` (IPv4 localhost only)
- **OpenWebUI**: `0.0.0.0:8080` (Docker internal)

### **3. Headers & Security**
- **Rule**: All subdomains get security headers
- **Headers**: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection
- **Reason**: Prevent common web vulnerabilities

## **📡 DNS Rules**

### **1. Subdomain Routing**
- **Main Domain**: `ackersweldon.com` → External WordPress
- **Dashboard**: `dashboard.ackersweldon.com` → Our server
- **AI**: `ai.ackersweldon.com` → Our server  
- **Community**: `community.ackersweldon.com` → Our server (proxied to external)

### **2. DNS Record Types**
- **Rule**: Use A records for all subdomains
- **TTL**: 300 seconds (5 minutes) for quick updates
- **Reason**: Simple, reliable, fast propagation

## **⚙️ Service Management Rules**

### **1. Systemd Services**
- **Flask Backend**: `dashboard-api.service`
- **NGINX**: `nginx.service`
- **Rule**: Always use systemd for service management
- **Reason**: Automatic startup, logging, monitoring

### **2. Service Dependencies**
- **Order**: NGINX depends on Flask backend
- **Startup**: Flask must be running before NGINX can proxy to it
- **Health Check**: `/health` endpoint for monitoring

### **3. Logging & Monitoring**
- **Rule**: Centralized logging via systemd and NGINX
- **Logs**: `/var/log/nginx/` and `journalctl -u dashboard-api`
- **Monitoring**: Regular health checks and status monitoring

## **🔧 Configuration Rules**

### **1. NGINX Configuration**
- **Main Config**: Minimal `/etc/nginx/nginx.conf`
- **Site Config**: `/etc/nginx/sites-available/dashboard-app`
- **Rule**: Keep main config simple, put complexity in site configs
- **Reason**: Easy maintenance, clear separation

### **2. Environment Variables**
- **Frontend**: `.env.local` for Next.js
- **Backend**: Environment variables in systemd service
- **Rule**: No hardcoded values, use environment variables
- **Reason**: Flexibility, security, deployment ease

### **3. File Organization**
- **Frontend**: `/home/ubuntu/aw/dashboard-aw-main/`
- **Backend**: `/home/ubuntu/aw/aw_scraper-main/`
- **Configs**: `/etc/nginx/sites-available/`
- **Services**: `/etc/systemd/system/`

## **🚫 What NOT to Do**

### **1. Never Expose Backend Publicly**
```bash
# ❌ WRONG - Don't bind Flask to 0.0.0.0:5001
bind = "0.0.0.0:5001"

# ✅ CORRECT - Bind to localhost only
bind = "127.0.0.1:5001"
```

### **2. Never Use Hardcoded IPs in Frontend**
```javascript
// ❌ WRONG - Don't use hardcoded IPs
fetch('http://35.173.33.118:5001/api/data')

// ✅ CORRECT - Use relative paths
fetch('/api/data')
```

### **3. Never Skip SSL for Subdomains**
```nginx
# ❌ WRONG - Don't skip SSL
server {
    listen 80;
    server_name dashboard.ackersweldon.com;
    # ... no SSL
}

# ✅ CORRECT - Always redirect to HTTPS
server {
    listen 80;
    server_name dashboard.ackersweldon.com;
    return 301 https://$server_name$request_uri;
}
```

## **✅ What TO Do**

### **1. Always Test Configuration**
```bash
# Test NGINX config before reloading
sudo nginx -t

# Test services after changes
sudo systemctl status dashboard-api
curl -s http://127.0.0.1:5001/health
```

### **2. Always Use Relative Paths**
```javascript
// Use relative paths for all API calls
const response = await fetch('/api/health');
const data = await fetch('/api/users');
```

### **3. Always Monitor Services**
```bash
# Regular health checks
sudo systemctl is-active dashboard-api
sudo systemctl is-active nginx

# Monitor logs
sudo journalctl -u dashboard-api -f
sudo tail -f /var/log/nginx/error.log
```

## **🔄 Update Procedures**

### **1. Code Updates**
1. Update code in respective directories
2. Restart affected services
3. Test functionality
4. Monitor logs for errors

### **2. Configuration Updates**
1. Edit configuration files
2. Test configuration (`nginx -t`)
3. Reload services (`systemctl reload`)
4. Verify changes took effect

### **3. Service Updates**
1. Stop service
2. Update code/config
3. Start service
4. Verify health check passes

## **📊 Health Monitoring**

### **1. Service Health**
- **Flask Backend**: `curl -s http://127.0.0.1:5001/health`
- **NGINX**: `sudo systemctl is-active nginx`
- **Ports**: `sudo netstat -tlnp | grep -E ":(80|443|3000|5001|8080)"`

### **2. Subdomain Health**
- **Dashboard**: `curl -s -H "Host: dashboard.ackersweldon.com" -k https://localhost/api/health`
- **AI**: `curl -s -H "Host: ai.ackersweldon.com" -k https://localhost/`
- **Community**: `curl -s -H "Host: community.ackersweldon.com" -k https://localhost/`

---
**Rules Version**: 1.0  
**Last Updated**: 2025-08-18  
**Status**: Active and Enforced 🎯
