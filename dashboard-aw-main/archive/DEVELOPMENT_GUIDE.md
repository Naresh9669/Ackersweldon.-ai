# Development Guide

## 🚀 Next.js Development Server Setup

This guide covers how to run your Next.js dashboard in development mode with proper environment variable loading.

## 🌍 Environment Configuration

**IMPORTANT:** Your project uses a consolidated `.env` file in the root directory (`/home/ubuntu/.env`). This file contains all environment variables for both backend and frontend services.

**Next.js automatically loads this file** - no additional configuration needed!

## 🛠️ Development Commands

### Option 1: Smart Development Server (Recommended)
```bash
# Navigate to project directory
cd aw/dashboard-aw-main

# Start development server with environment loading
npm run dev:start
```

**Features:**
- ✅ Automatically loads root `.env` file
- ✅ Checks port availability
- ✅ Verifies environment variables
- ✅ Cleans old build cache
- ✅ Interactive port conflict resolution

### Option 2: Standard Development Commands
```bash
# Local development (127.0.0.1 only)
npm run dev

# Local development with specific port
npm run dev:local

# External development (accessible from other machines)
npm run dev:external
```

## 🔧 Development Server Features

### Environment Variable Loading
- **Automatic loading** from `/home/ubuntu/.env`
- **Development mode** (`NODE_ENV=development`)
- **Variable verification** before server start
- **Real-time updates** when `.env` changes

### Port Management
- **Default port:** 3000
- **Port conflict detection** and resolution
- **Interactive conflict resolution** (kill existing process)
- **Alternative port options** (3001, 3002, etc.)

### Build Cache Management
- **Automatic cleanup** of old `.next` directory
- **Fresh development builds** on each start
- **Hot reloading** for code changes
- **Fast refresh** for React components

## 🚫 Common Development Issues

### Issue: Port 3000 already in use
**Solutions:**
```bash
# Kill existing process
pkill -f "next dev"

# Use different port
npm run dev -- --port 3001

# Use external access
npm run dev:external
```

### Issue: Environment variables not loading
**Solutions:**
1. Verify root `.env` file exists at `/home/ubuntu/.env`
2. Check file permissions: `ls -la /home/ubuntu/.env`
3. Restart development server: `npm run dev:start`

### Issue: Build cache problems
**Solutions:**
```bash
# Clean build cache
rm -rf .next

# Clean and reinstall dependencies
rm -rf .next node_modules && npm install
```

## 🔍 Development Environment Verification

### Environment Variables Check
```bash
# Check if critical variables are loaded
echo "NEXT_PUBLIC_API_URL: $NEXT_PUBLIC_API_URL"
echo "MONGODB_URI: $MONGODB_URI"
echo "NODE_ENV: $NODE_ENV"
```

### Port Availability Check
```bash
# Check if port 3000 is available
lsof -Pi :3000 -sTCP:LISTEN

# Check all ports in use
netstat -tulpn | grep :3000
```

### Dependencies Check
```bash
# Verify node_modules exists
ls -la node_modules/

# Check package.json scripts
npm run
```

## 🚀 Development Workflow

### 1. Start Development Server
```bash
npm run dev:start
```

### 2. Make Code Changes
- Edit files in `app/` directory
- Changes automatically reload
- Hot module replacement enabled

### 3. Test Changes
- Open browser to `http://127.0.0.1:3000`
- Check browser console for errors
- Verify API calls work correctly

### 4. Stop Server
- Press `Ctrl+C` in terminal
- Server stops gracefully

## 📱 Development URLs

### Local Development
- **Dashboard:** http://127.0.0.1:3000
- **API Routes:** http://127.0.0.1:3000/api/*
- **Static Assets:** http://127.0.0.1:3000/_next/static/*

### External Development
- **Dashboard:** http://0.0.0.0:3000
- **Accessible from:** Other machines on network
- **Useful for:** Mobile testing, remote development

## 🔧 Development Configuration

### Next.js Development Settings
```javascript
// next.config.mjs (development overrides)
const nextConfig = {
  // Development-specific settings
  ...(process.env.NODE_ENV === 'development' && {
    // Enable source maps
    productionBrowserSourceMaps: false,
    // Faster builds
    swcMinify: false,
  }),
}
```

### Environment-Specific Variables
```bash
# Development overrides (optional)
# Add to root .env if needed
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
```

## 🚀 Quick Start Commands

```bash
# Full development setup
npm run dev:start

# Alternative development modes
npm run dev          # Local only
npm run dev:external # External access
npm run dev:local    # Specific port

# Development utilities
npm run lint         # Code linting
npm run test         # Run tests
npm run test:watch   # Watch mode tests
```

## 📞 Need Help?

If you encounter development issues:
1. Check this guide first
2. Verify root `.env` file exists and is readable
3. Check port availability
4. Clean build cache: `rm -rf .next`
5. Restart development server: `npm run dev:start`

---

**Remember:** Always use `npm run dev:start` for the best development experience with automatic environment loading!
