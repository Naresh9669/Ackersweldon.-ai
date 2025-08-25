# Dashboard AW - Production Deployment Guide

## 🚀 **Quick Start (Production)**

### **1. Install PM2 Process Manager**
```bash
npm install -g pm2
```

### **2. Start the Application**
```bash
# Make startup script executable
chmod +x start-server.sh

# Start with production configuration
./start-server.sh
```

### **3. Verify Deployment**
```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs dashboard-aw

# Monitor in real-time
pm2 monit
```

---

## 🔧 **Manual Deployment Steps**

### **Step 1: Environment Setup**
```bash
cd /home/ubuntu/aw/dashboard-aw-main

# Set production environment
export NODE_ENV=production
export PORT=3000
```

### **Step 2: Install Dependencies**
```bash
# Clean install production dependencies only
npm ci --production

# Clear npm cache
npm cache clean --force
```

### **Step 3: Build Application**
```bash
# Build for production
npm run build

# Verify build output
ls -la .next/
```

### **Step 4: Start with PM2**
```bash
# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
```

---

## 📊 **Monitoring & Health Checks**

### **Health Endpoint**
- **URL**: `/api/health`
- **Purpose**: Real-time system health monitoring
- **Response**: JSON with system status, memory usage, and API health

### **Status Dashboard**
- **URL**: `/status`
- **Features**: 
  - Real-time health monitoring
  - Memory usage tracking
  - API connectivity status
  - System uptime display

### **PM2 Monitoring**
```bash
# Real-time monitoring
pm2 monit

# View logs
pm2 logs dashboard-aw

# Check status
pm2 show dashboard-aw
```

---

## 🛠️ **Troubleshooting**

### **Application Won't Start**
```bash
# Check PM2 logs
pm2 logs dashboard-aw --lines 50

# Check if port is in use
netstat -tlnp | grep :3000

# Restart application
pm2 restart dashboard-aw
```

### **Memory Issues**
```bash
# Check memory usage
pm2 show dashboard-aw

# Restart if memory usage is high
pm2 restart dashboard-aw

# Monitor memory in real-time
pm2 monit
```

### **API Endpoints Not Working**
```bash
# Check nginx configuration
sudo nginx -t

# Check nginx status
sudo systemctl status nginx

# Restart nginx
sudo systemctl restart nginx
```

---

## 🔄 **Maintenance & Updates**

### **Deploy Updates**
```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm ci --production

# Build application
npm run build

# Reload PM2
pm2 reload ecosystem.config.js --env production
```

### **Rollback Deployment**
```bash
# List PM2 processes
pm2 list

# Restart with previous version
pm2 restart dashboard-aw

# Or delete and restart
pm2 delete dashboard-aw
pm2 start ecosystem.config.js --env production
```

---

## 📋 **Configuration Files**

### **PM2 Ecosystem Config** (`ecosystem.config.js`)
- **Process Management**: Auto-restart, memory limits
- **Error Handling**: Logging, crash recovery
- **Health Monitoring**: Grace periods, restart conditions
- **Memory Management**: V8 heap size optimization

### **Health Check API** (`/api/health`)
- **Database Connectivity**: MongoDB connection status
- **External APIs**: Yahoo Finance, Alpha Vantage health
- **Memory Usage**: Heap and RSS memory monitoring
- **Response Time**: API performance metrics

---

## 🚨 **Emergency Procedures**

### **Application Crash**
```bash
# Immediate restart
pm2 restart dashboard-aw

# Check crash logs
pm2 logs dashboard-aw --lines 100

# If persistent issues, full restart
pm2 delete dashboard-aw
pm2 start ecosystem.config.js --env production
```

### **High Memory Usage**
```bash
# Check memory usage
pm2 show dashboard-aw

# Restart to free memory
pm2 restart dashboard-aw

# Monitor for memory leaks
pm2 monit
```

### **API Rate Limits**
- **Yahoo Finance**: Monitor `/api/health` for API status
- **Alpha Vantage**: Check daily request limits
- **Fallback Strategy**: Multiple API sources for redundancy

---

## 📈 **Performance Optimization**

### **Memory Management**
- **Heap Size**: Optimized with `--max-old-space-size=1024`
- **Garbage Collection**: Automatic memory cleanup
- **Memory Monitoring**: Real-time usage tracking

### **Process Management**
- **Auto-restart**: Automatic recovery from crashes
- **Health Checks**: Proactive monitoring and alerts
- **Graceful Shutdown**: Proper signal handling

### **Load Balancing**
- **Nginx Proxy**: Reverse proxy configuration
- **Port Management**: Consistent port allocation
- **Health Monitoring**: Upstream health checks

---

## 🔐 **Security Considerations**

### **Environment Variables**
- **API Keys**: Stored in environment variables
- **Database URLs**: Secure connection strings
- **Production Flags**: NODE_ENV=production

### **Process Isolation**
- **Non-root User**: PM2 runs with limited privileges
- **Port Binding**: Restricted to localhost for nginx proxy
- **Memory Limits**: Prevent memory exhaustion attacks

---

## 📞 **Support & Monitoring**

### **Real-time Alerts**
- **Health Status**: Continuous monitoring via `/api/health`
- **Memory Alerts**: Automatic alerts for high usage
- **API Status**: External API connectivity monitoring

### **Log Management**
- **PM2 Logs**: Application and error logs
- **Nginx Logs**: Access and error logs
- **System Logs**: OS-level monitoring

### **Performance Metrics**
- **Response Times**: API performance tracking
- **Memory Usage**: Resource utilization monitoring
- **Uptime Tracking**: System reliability metrics

---

## ✅ **Deployment Checklist**

- [ ] PM2 installed globally
- [ ] Environment variables set
- [ ] Dependencies installed (`npm ci --production`)
- [ ] Application built (`npm run build`)
- [ ] PM2 process started
- [ ] Health check endpoint working (`/api/health`)
- [ ] Status dashboard accessible (`/status`)
- [ ] Nginx proxy configured
- [ ] PM2 startup script configured
- [ ] Monitoring and logging verified

---

## 🎯 **Success Indicators**

- **Health Status**: `/api/health` returns `"status": "healthy"`
- **PM2 Status**: Process shows as "online"
- **Memory Usage**: Below 80% of allocated heap
- **Response Time**: Health checks under 1000ms
- **Uptime**: Continuous operation without crashes

---

*For additional support, check the logs with `pm2 logs dashboard-aw` or visit the status dashboard at `/status`*
