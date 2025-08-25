# 🚀 Quick Start Reference Guide

## 📍 **SAVE THIS FILE - Your Go-To Reference for Server Commands**

This guide contains everything you need to start your Next.js dashboard servers quickly and correctly.

---

## 🏠 **Current Location**
```bash
# You are here:
cd /home/ubuntu/aw/dashboard-aw-main
```

---

## 🚀 **DEVELOPMENT SERVER**

### **Smart Development Server (RECOMMENDED)**
```bash
npm run dev:start
```
**What it does:**
- ✅ Loads environment from `/home/ubuntu/.env`
- ✅ Checks port availability
- ✅ Verifies environment variables
- ✅ Cleans old build cache
- ✅ Starts with hot reloading

### **Alternative Development Commands**
```bash
npm run dev              # Local development (127.0.0.1:3000)
npm run dev:external     # External access (0.0.0.0:3000)
npm run dev:local        # Specific port configuration
```

### **Development URLs**
- **Local:** http://127.0.0.1:3000
- **External:** http://0.0.0.0:3000
- **API Routes:** http://127.0.0.1:3000/api/*

---

## 🏭 **PRODUCTION SERVER**

### **Step 1: Build for Production**
```bash
npm run build:prod
```
**What it does:**
- ✅ Loads environment from `/home/ubuntu/.env`
- ✅ Builds with NODE_ENV=production
- ✅ Copies static assets to standalone directory
- ✅ Creates runtime environment file
- ✅ Verifies build integrity

### **Step 2: Verify Build**
```bash
npm run verify
```
**What it checks:**
- ✅ Static asset structure (should have >50 assets)
- ✅ JavaScript chunks, CSS, fonts
- ✅ Build readiness for deployment

### **Step 3: Start Production Server**
```bash
npm run start:standalone
```
**What it does:**
- ✅ Starts production server from `.next/standalone/`
- ✅ Serves all static assets correctly
- ✅ Environment variables available
- ✅ Production-optimized performance

---

## 🔧 **TROUBLESHOOTING COMMANDS**

### **Port Conflicts**
```bash
# Check if port 3000 is in use
lsof -Pi :3000 -sTCP:LISTEN

# Kill existing Next.js processes
pkill -f "next dev"

# Use different port
npm run dev -- --port 3001
```

### **Build Issues**
```bash
# Clean build cache
rm -rf .next

# Clean and reinstall dependencies
rm -rf .next node_modules && npm install

# Rebuild production
npm run build:prod
```

### **Environment Issues**
```bash
# Check if .env is loaded
echo "NEXT_PUBLIC_API_URL: $NEXT_PUBLIC_API_URL"
echo "MONGODB_URI: $MONGODB_URI"

# Verify root .env exists
ls -la /home/ubuntu/.env
```

---

## 📁 **IMPORTANT DIRECTORIES**

### **Build Output**
```bash
.next/standalone/          # Production build output
.next/standalone/.env      # Runtime environment file
.next/standalone/server.js # Production server file
```

### **Static Assets**
```bash
.next/standalone/.next/static/  # All static assets (JS, CSS, fonts)
.next/standalone/.next/static/chunks/  # JavaScript chunks
.next/standalone/.next/static/css/     # CSS files
.next/standalone/.next/static/media/   # Font files
```

---

## 🌍 **ENVIRONMENT CONFIGURATION**

### **Root Environment File**
```bash
# Location: /home/ubuntu/.env
# Contains ALL environment variables for both backend and frontend
# Next.js automatically loads this file
```

### **Key Environment Variables**
```bash
NODE_ENV=development          # Set automatically by scripts
NEXT_PUBLIC_API_URL=https://dashboard.ackersweldon.com
MONGODB_URI=mongodb://127.0.0.1:27017/dashboard_db
NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY=WNWGEHCMTH50GSTE
# ... and many more
```

---

## 🚨 **EMERGENCY COMMANDS**

### **Stop All Servers**
```bash
# Kill all Next.js processes
pkill -f "next"

# Kill specific port
fuser -k 3000/tcp
```

### **Reset Everything**
```bash
# Clean everything and start fresh
rm -rf .next node_modules
npm install
npm run build:prod
npm run start:standalone
```

---

## 📋 **DAILY WORKFLOW**

### **Development Workflow**
```bash
# 1. Start development server
npm run dev:start

# 2. Make code changes (auto-reloads)
# 3. Test in browser at http://127.0.0.1:3000
# 4. Stop with Ctrl+C when done
```

### **Production Deployment Workflow**
```bash
# 1. Build for production
npm run build:prod

# 2. Verify build
npm run verify

# 3. Start production server
npm run start:standalone

# 4. Access at your production URL
```

---

## 🔍 **VERIFICATION COMMANDS**

### **Check Server Status**
```bash
# Check if development server is running
curl -s http://127.0.0.1:3000 > /dev/null && echo "✅ Dev server running" || echo "❌ Dev server not running"

# Check if production server is running
curl -s http://127.0.0.1:3000 > /dev/null && echo "✅ Prod server running" || echo "❌ Prod server not running"
```

### **Check Build Health**
```bash
# Verify static assets
find .next/standalone/.next/static -type f | wc -l
# Should show >50 files

# Check critical files
test -f .next/standalone/server.js && echo "✅ server.js found" || echo "❌ server.js missing"
test -d .next/standalone/.next/static && echo "✅ Static assets found" || echo "❌ Static assets missing"
```

---

## 📚 **FULL DOCUMENTATION**

- **`PRODUCTION_DEPLOYMENT.md`** - Complete production guide
- **`DEVELOPMENT_GUIDE.md`** - Complete development guide
- **`README.md`** - Project overview

---

## 🎯 **REMEMBER**

- **Development:** `npm run dev:start` (loads .env automatically)
- **Production:** `npm run build:prod` → `npm run verify` → `npm run start:standalone`
- **Environment:** All variables loaded from `/home/ubuntu/.env`
- **Static Assets:** Automatically copied and served correctly
- **No More 404s:** Static asset loading issues are permanently fixed!

---

**💡 Pro Tip:** Bookmark this file or keep it open in a tab for quick access to all server commands!
