# AckersWeldon Dashboard Project Configuration

## **Project Overview**
Multi-subdomain architecture with Next.js frontend, Flask backend, and external service integration via NGINX reverse proxy.

## **Current Server Details**
- **Server IP**: `35.173.33.118`
- **Domain**: `ackersweldon.com`
- **Architecture**: Multi-subdomain reverse proxy

## **Subdomain Architecture**

### **1. Main Domain (External WordPress)**
- **Domain**: `ackersweldon.com`
- **Target Server**: `54.255.92.158` (external)
- **Service**: WordPress site
- **DNS**: Points to external server (no changes needed)

### **2. Dashboard Subdomain (Our App)**
- **Domain**: `dashboard.ackersweldon.com`
- **Target Server**: `35.173.33.118` (current server)
- **Services**: 
  - Frontend: Next.js on port 3000
  - Backend: Flask API on port 5001
- **DNS**: Needs A record pointing to `35.173.33.118`
- **Status**: ⏳ Waiting for DNS update

### **3. AI Subdomain (OpenWebUI)**
- **Domain**: `ai.ackersweldon.com`
- **Target Server**: `35.173.33.118` (current server)
- **Service**: OpenWebUI Docker container on port 8080
- **DNS**: Needs A record pointing to `35.173.33.118`
- **Status**: ⏳ Waiting for DNS update

### **4. Community Subdomain (Odoo)**
- **Domain**: `community.ackersweldon.com`
- **Target Server**: `35.173.33.118` (current server) → Proxies to `44.211.157.182`
- **Service**: External Odoo server
- **DNS**: Already configured pointing to `35.173.33.118`
- **Status**: ✅ Working (proxied through our server)

## **Service Configuration**

### **Frontend (Next.js)**
- **Port**: 3000 (IPv6 only)
- **Location**: `/home/ubuntu/aw/dashboard-aw-main/`
- **Status**: Running
- **Start Command**: `npm run dev` (development) or `npm run build && npm start` (production)

### **Backend (Flask)**
- **Port**: 5001 (127.0.0.1 only - not publicly accessible)
- **Location**: `/home/ubuntu/aw/aw_scraper-main/`
- **Service**: `dashboard-api` (systemd)
- **Status**: Running
- **Start Command**: `sudo systemctl start dashboard-api`

### **AI Service (OpenWebUI)**
- **Port**: 8080
- **Service**: Docker container
- **Status**: Running
- **Container ID**: `1904835`

### **NGINX**
- **Ports**: 80 (HTTP), 443 (HTTPS)
- **Configuration**: `/etc/nginx/sites-available/dashboard-app`
- **Status**: Running
- **SSL Certificates**: `/etc/nginx/ssl/`

## **NGINX Configuration Files**

### **Main Config**: `/etc/nginx/nginx.conf`
- Minimal configuration
- Includes `sites-enabled/*`
- SSL protocols: TLSv1.2, TLSv1.3

### **Site Config**: `/etc/nginx/sites-available/dashboard-app`
- Multi-subdomain configuration
- SSL termination
- Reverse proxy routing
- Security headers

## **SSL Certificates**
```
/etc/nginx/ssl/
├── fullchain.pem          # Main domain + dashboard
├── privkey.pem            # Main domain + dashboard
├── ai-fullchain.pem       # AI subdomain
├── ai-privkey.pem         # AI subdomain
├── community-fullchain.pem # Community subdomain
└── community-privkey.pem   # Community subdomain
```

## **DNS Records Required**

| Type | Name | Value | TTL | Status |
|------|------|-------|-----|---------|
| A | `ackersweldon.com` | `54.255.92.158` | 3600 | ✅ External |
| A | `dashboard.ackersweldon.com` | `35.173.33.118` | 300 | ⏳ Pending |
| A | `ai.ackersweldon.com` | `35.173.33.118` | 300 | ⏳ Pending |
| A | `community.ackersweldon.com` | `35.173.33.118` | 300 | ✅ Working |

## **File Locations**

### **Project Files**
- **Frontend**: `/home/ubuntu/aw/dashboard-aw-main/`
- **Backend**: `/home/ubuntu/aw/aw_scraper-main/`
- **NGINX Config**: `/etc/nginx/sites-available/dashboard-app`
- **Systemd Service**: `/etc/systemd/system/dashboard-api.service`

### **Configuration Files**
- **Environment**: `/home/ubuntu/aw/dashboard-aw-main/.env.local`
- **API Client**: `/home/ubuntu/aw/dashboard-aw-main/lib/api.ts`
- **Gunicorn Config**: `/home/ubuntu/aw/aw_scraper-main/gunicorn.conf.py`

## **Key Changes Made**

### **Frontend (Next.js)**
- ✅ Removed all hardcoded `IP:5001` fetches
- ✅ Updated to use relative paths `/api/...`
- ✅ Centralized API configuration in `lib/api.ts`
- ✅ Set `NEXT_PUBLIC_API_URL` to empty

### **Backend (Flask)**
- ✅ Bound to `127.0.0.1:5001` (not publicly accessible)
- ✅ Running via systemd service `dashboard-api`
- ✅ Gunicorn configuration updated

### **NGINX**
- ✅ Multi-subdomain reverse proxy
- ✅ SSL termination for all subdomains
- ✅ API routing (`/api/*` → Flask backend)
- ✅ Frontend routing (`/` → Next.js)
- ✅ External service proxying (Odoo)

## **Service Management Commands**

### **Start Services**
```bash
# Start Flask backend
sudo systemctl start dashboard-api

# Start NGINX
sudo systemctl start nginx

# Check status
sudo systemctl status dashboard-api
sudo systemctl status nginx
```

### **Reload Configuration**
```bash
# Test NGINX config
sudo nginx -t

# Reload NGINX
sudo systemctl reload nginx

# Restart NGINX (if needed)
sudo systemctl restart nginx
```

### **View Logs**
```bash
# Flask backend logs
sudo journalctl -u dashboard-api -f

# NGINX logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## **Testing Commands**

### **Local Testing**
```bash
# Test Flask backend directly
curl -s http://127.0.0.1:5001/health

# Test NGINX proxy locally
curl -s -H "Host: dashboard.ackersweldon.com" -k https://localhost/api/health
curl -s -H "Host: ai.ackersweldon.com" -k https://localhost/
curl -s -H "Host: community.ackersweldon.com" -k https://localhost/
```

### **External Testing (after DNS update)**
```bash
# Test dashboard subdomain
curl -I https://dashboard.ackersweldon.com
curl -s https://dashboard.ackersweldon.com/api/health

# Test AI subdomain
curl -I https://ai.ackersweldon.com

# Test community subdomain
curl -I https://community.ackersweldon.com
```

## **Architecture Benefits**

1. **Security**: SSL termination, security headers, no public backend access
2. **Centralized Management**: All subdomains managed from one server
3. **Monitoring**: Centralized logging and monitoring
4. **Flexibility**: Easy to add new services or change routing
5. **Same-Origin**: Frontend and backend communicate via relative paths

## **Next Steps**

1. **Update DNS records** for `dashboard.ackersweldon.com` and `ai.ackersweldon.com`
2. **Wait for DNS propagation** (15 minutes to 2 hours)
3. **Test external access** to all subdomains
4. **Monitor logs** for any issues

## **Maintenance Notes**

- **SSL certificates**: Monitor expiration dates
- **Service logs**: Regular log rotation and monitoring
- **Updates**: Keep Next.js, Flask, and system packages updated
- **Backups**: Regular backups of configuration files and project code

---
**Last Updated**: 2025-08-18
**Configuration Version**: 1.0
**Status**: Ready for DNS update
