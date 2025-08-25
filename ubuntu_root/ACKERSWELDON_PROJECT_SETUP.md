# 🚀 ACKERSWELDON DASHBOARD PROJECT SETUP

## 📋 PROJECT OVERVIEW
**Project Name**: AckersWeldon Dashboard  
**Type**: Full-stack financial dashboard with AI integration  
**Architecture**: Next.js Frontend + Flask Backend + MongoDB + Docker  
**Domain**: https://dashboard.ackersweldon.com  

---

## 🏗️ INFRASTRUCTURE ARCHITECTURE

### **Server Details**
- **Host**: AWS EC2 Instance
- **Public IP**: `35.173.33.118`
- **OS**: Ubuntu Linux 6.8.0-1021-aws
- **User**: `ubuntu`
- **Root Directory**: `/home/ubuntu`

### **Service Architecture**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   NGINX Proxy  │    │  Next.js App   │    │  Flask Backend │
│   Port: 80/443 │    │   Port: 3000   │    │   Port: 5001   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   MongoDB DB    │
                    │   Port: 27017   │
                    │   (Docker)      │
                    └─────────────────┘
```

---

## 📁 PROJECT STRUCTURE

### **Root Directory** (`/home/ubuntu/`)
```
/home/ubuntu/
├── .env                          # Main environment configuration
├── aw/                           # Main project directory
│   ├── dashboard-aw-main/        # Next.js Frontend
│   └── aw_scraper-main/         # Flask Backend API
├── ACKERSWELDON_PROJECT_SETUP.md # This documentation
├── nginx.conf                    # NGINX configuration
├── setup-nginx-proxy.sh          # NGINX setup script
└── ssl/                         # SSL certificates
```

### **Active Frontend** (`/home/ubuntu/aw/dashboard-aw-main/`)
- **Framework**: Next.js 15.4.6
- **Port**: 3000
- **Environment**: Production
- **Start Script**: `npm run start` (with env loading)

### **Active Backend** (`/home/ubuntu/aw/aw_scraper-main/`)
- **Framework**: Flask + Gunicorn
- **Port**: 5001
- **Workers**: 8 Gunicorn processes
- **Virtual Environment**: `/home/ubuntu/aw/aw_scraper-main/venv/`

---

## 🐳 DOCKER SERVICES

### **Running Containers**
```bash
# MongoDB Database
CONTAINER: aw_mongodb
IMAGE: mongo:7.0
PORT: 27017:27017
STATUS: Up 45 hours

# OpenWebUI (AI Service)
CONTAINER: openwebui
IMAGE: ghcr.io/open-webui/open-webui:main
PORT: 8080:8080
STATUS: Up 2 days (healthy)

# SearXNG (Search Engine)
CONTAINER: searxng
IMAGE: searxng/searxng:latest
PORT: 8081:8080
STATUS: Up 36 hours
```

---

## ⚙️ ENVIRONMENT CONFIGURATION

### **Main Environment File** (`/home/ubuntu/.env`)
```bash
# Server Configuration
PUBLIC_IP=35.173.33.118
BACKEND_URL=http://35.173.33.118:5001
FRONTEND_URL=http://35.173.33.118:3000

# Database
MONGODB_URI=mongodb://127.0.0.1:27017/dashboard_db
MONGO_DATABASE=aw

# API Keys
NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY=WNWGEHCMTH50GSTE
NEXT_PUBLIC_FINNHUB_API_KEY=d2g81tpr01qq1lhtreugd2g81tpr01qq1lhtrev0
NEXT_PUBLIC_POLYGON_API_KEY=hLkQxgibmGtaFCMTXUtFtZq65Q5R1iS1
NEXT_PUBLIC_FMP_API_KEY=JiVmi6hF1OPZEBgHiWI6oyRMsUqrt255

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://35.173.33.118:5001
NEXT_PUBLIC_BASE_URL=http://dashboard.ackersweldon.com
NEXT_PUBLIC_API_BASE_URL=http://dashboard.ackersweldon.com/api

# AI Services
OLLAMA_BASE_URL=http://3.80.91.238:11434
OLLAMA_DEFAULT_MODEL=llama3.1:8b
```

---

## 🚀 SERVICE STARTUP COMMANDS

### **Frontend (Next.js Dashboard)**
```bash
cd /home/ubuntu/aw/dashboard-aw-main
npm run start  # Automatically loads environment variables
```

### **Backend (Flask API)**
```bash
cd /home/ubuntu/aw/aw_scraper-main
# Service is managed by Gunicorn with 8 workers
# Auto-starts on system boot
```

### **Database (MongoDB)**
```bash
# MongoDB runs in Docker container
docker start aw_mongodb  # If stopped
```

---

## 🌐 NETWORK CONFIGURATION

### **Port Mappings**
- **80/443**: NGINX (HTTP/HTTPS)
- **3000**: Next.js Dashboard
- **5001**: Flask Backend API
- **27017**: MongoDB Database
- **8080**: OpenWebUI (AI Service)
- **8081**: SearXNG (Search Engine)

### **Domain Configuration**
- **Main Dashboard**: https://dashboard.ackersweldon.com
- **API Base**: http://35.173.33.118:5001
- **External Access**: All services accessible via public IP

---

## 🔧 TROUBLESHOOTING COMMANDS

### **Check Service Status**
```bash
# Check running processes
ps aux | grep -E "(next|flask|gunicorn|mongod)" | grep -v grep

# Check ports in use
netstat -tlnp | grep -E "(3000|5001|27017|8080|8081)"

# Check Docker containers
docker ps
```

### **Check Logs**
```bash
# Frontend logs
tail -f /home/ubuntu/aw/dashboard-aw-main/dashboard.log

# Backend logs
tail -f /home/ubuntu/aw/aw_scraper-main/logs/scraper.log

# NGINX logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### **Restart Services**
```bash
# Restart frontend
cd /home/ubuntu/aw/dashboard-aw-main
pkill -f "next start"
npm run start

# Restart backend (if needed)
cd /home/ubuntu/aw/aw_scraper-main
pkill -f gunicorn
./start_production.sh

# Restart NGINX
sudo systemctl restart nginx
```

---

## 📊 CURRENT STATUS (as of setup documentation)

### **✅ Running Services**
- ✅ Next.js Dashboard (Port 3000)
- ✅ Flask Backend API (Port 5001, 8 workers)
- ✅ MongoDB Database (Port 27017)
- ✅ NGINX Reverse Proxy
- ✅ OpenWebUI AI Service (Port 8080)
- ✅ SearXNG Search (Port 8081)

### **🌐 External Access**
- ✅ Dashboard: https://dashboard.ackersweldon.com
- ✅ Backend API: http://35.173.33.118:5001
- ✅ All services responding correctly

---

## 🚨 IMPORTANT NOTES

### **Environment Variables**
- **ALWAYS** use the root `.env` file at `/home/ubuntu/.env`
- **NEVER** use `.env123.local` or other local files
- Frontend automatically loads environment via `load-env.js`

### **Service Management**
- Frontend: Use `npm run start` (auto-loads env)
- Backend: Managed by Gunicorn (auto-starts)
- Database: Docker container (auto-starts)
- NGINX: System service (auto-starts)

### **File Locations**
- **Active Frontend**: `/home/ubuntu/aw/dashboard-aw-main/`
- **Active Backend**: `/home/ubuntu/aw/aw_scraper-main/`
- **Legacy directories have been cleaned up** ✅

---

## 🔄 DEPLOYMENT WORKFLOW

### **For Updates**
1. **Frontend**: Update code in `/home/ubuntu/aw/dashboard-aw-main/`
2. **Backend**: Update code in `/home/ubuntu/aw/aw_scraper-main/`
3. **Rebuild**: `npm run build` (frontend) or restart backend
4. **Restart**: Use appropriate restart commands above

### **For New Deployments**
1. **Environment**: Update `/home/ubuntu/.env`
2. **Code**: Deploy to appropriate active directory
3. **Services**: Restart affected services
4. **Verify**: Check all endpoints and functionality

---

## 🧹 CLEANUP COMPLETED

### **Legacy Directories Removed** ✅
- ❌ `/home/ubuntu/dashboard-aw-main/` (1.5MB)
- ❌ `/home/ubuntu/aw_scraper-main/` (324KB)
- ❌ Old configuration files (dashboard-api.service, dashboard-app-fixed, etc.)

### **Current Clean Structure**
- ✅ Only active code directories remain in `/home/ubuntu/aw/`
- ✅ Root directory is now clean and organized
- ✅ All legacy files have been removed

---

*This documentation was created on: August 20, 2025*  
*Last updated by: AI Assistant*  
*Project: AckersWeldon Dashboard Infrastructure*  
*Status: Legacy cleanup completed* ✅
