# Production Deployment Guide

## 🚨 Critical: Static Asset Loading Issues - SOLVED

This guide ensures your Next.js dashboard deploys correctly without the static asset 404 errors.

## 🔧 What Was Fixed

1. **Removed `assetPrefix`** - This was causing static assets to be requested from wrong URLs
2. **Removed dynamic `generateBuildId`** - This was breaking caching and causing 404s
3. **Added proper static asset headers** - Ensures correct MIME types and caching
4. **Implemented Context7 best practices** - Following Next.js official recommendations

## 🌍 Environment Configuration

**IMPORTANT:** Your project uses a consolidated `.env` file in the root directory (`/home/ubuntu/.env`). This file contains all environment variables for both backend and frontend services.

**Next.js automatically loads this file** - no additional configuration needed!

## 🚀 Production Build Process

### Option 1: Automated Build (Recommended)
```bash
# Navigate to project directory
cd aw/dashboard-aw-main

# Run production build script
npm run build:prod
```

### Option 2: Manual Build
```bash
# Clean previous builds
rm -rf .next

# Set production environment
export NODE_ENV=production

# Build application
npm run build:production

# Copy static assets to standalone directory (CRITICAL STEP)
cp -r public .next/standalone/ 2>/dev/null || echo "No public directory"
cp -r .next/static .next/standalone/.next/ 2>/dev/null || echo "No static assets"
```

## 🏃‍♂️ Starting Production Server

### Option 1: Standalone Server (Recommended)
```bash
npm run start:standalone
```

### Option 2: Manual Start
```bash
cd .next/standalone
node server.js
```

## 📁 Build Output Structure

After successful build, you should see:
```
.next/standalone/
├── server.js                    # Main server file
├── .next/
│   └── static/                 # Static assets (JS, CSS, fonts)
│       ├── chunks/             # JavaScript chunks
│       ├── css/                # CSS files
│       └── media/              # Font files and media
└── public/                     # Public assets (if any)
```

## 🔍 Verification Steps

1. **Check build output:**
   ```bash
   ls -la .next/standalone/
   ls -la .next/standalone/.next/static/
   ```

2. **Verify static assets exist:**
   ```bash
   find .next/standalone/.next/static -type f | wc -l
   # Should show > 0 files
   ```

3. **Check server.js exists:**
   ```bash
   test -f .next/standalone/server.js && echo "✅ server.js found" || echo "❌ server.js missing"
   ```

## 🚫 Common Issues & Solutions

### Issue: Static assets return 404
**Solution:** Ensure you copied static assets to standalone directory
```bash
cp -r .next/static .next/standalone/.next/
```

### Issue: Font files not loading
**Solution:** Check that media files are in `.next/standalone/.next/static/media/`

### Issue: Build fails with standalone output
**Solution:** Verify `output: 'standalone'` in `next.config.mjs`

### Issue: Environment variables not loading
**Solution:** Ensure your root `.env` file exists at `/home/ubuntu/.env`

## 🔄 Deployment Workflow

1. **Build:** `npm run build:prod`
2. **Verify:** Check build output structure
3. **Deploy:** Copy `.next/standalone/` to your server
4. **Start:** Run `node server.js` in the standalone directory

## 📋 Environment Variables

Your consolidated `.env` file at `/home/ubuntu/.env` already contains all necessary variables:
- `NODE_ENV=production` (set during build)
- `MONGODB_URI` (your database connection)
- All `NEXT_PUBLIC_*` variables for client-side features
- API keys and service URLs

**No additional environment setup needed!**

## 🎯 Why This Fixes the Problem

1. **No more assetPrefix conflicts** - Static assets load from correct paths
2. **Stable build IDs** - Caching works properly
3. **Proper static asset copying** - All assets available in standalone build
4. **Correct MIME types** - Browsers handle assets properly
5. **Immutable caching** - Better performance and fewer 404s
6. **Consolidated environment** - Single source of truth for all variables

## 🚀 Quick Start Commands

```bash
# Full production deployment
npm run build:prod
npm run start:standalone

# Or manually
rm -rf .next && NODE_ENV=production npm run build
cp -r .next/static .next/standalone/.next/
cd .next/standalone && node server.js
```

## 📞 Need Help?

If you still see static asset 404 errors:
1. Check this guide again
2. Verify build output structure
3. Ensure static assets were copied to standalone directory
4. Check nginx configuration (if using reverse proxy)
5. Verify root `.env` file exists and is readable

---

**Remember:** Always use `npm run build:prod` for production builds to ensure proper static asset handling!
