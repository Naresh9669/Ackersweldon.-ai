# 🔧 Environment Variable Management

## Overview

This project uses a **single source of truth** for all environment variables located at `/home/ubuntu/.env` (the root directory). This ensures consistency between development, production, and all deployment environments.

## 🏗️ Architecture

```
/home/ubuntu/.env                    ← Single source of truth
    ↓ (symlink)
/home/ubuntu/aw/dashboard-aw-main/.env  ← Project symlink
    ↓ (Next.js auto-loads)
Application Environment Variables
```

## 📁 File Structure

- **`/home/ubuntu/.env`** - Consolidated environment file (MASTER)
- **`/home/ubuntu/aw/dashboard-aw-main/.env`** - Symlink to master (AUTO-GENERATED)
- **`scripts/ensure-env.sh`** - Environment management script
- **`.123.local`** - ❌ REMOVED (was duplicate)

## 🚀 How It Works

### 1. Automatic Environment Loading

Next.js automatically loads environment variables from `.env` files in the project root. The symlink ensures the root `.env` file is accessible.

### 2. Script Integration

All npm scripts now automatically run `./scripts/ensure-env.sh` before executing, ensuring:
- Environment variables are loaded
- Symlink is correct
- No duplicate files exist

### 3. Build Process

The build scripts (`build-prod.sh`, `dev.sh`) explicitly load from `/home/ubuntu/.env` and create runtime environment files.

## 📋 Available Commands

### Environment Management
```bash
# Check environment setup
npm run env:check

# Verify environment variables
source scripts/ensure-env.sh && echo $NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY
```

### Development
```bash
# Start development server (auto-loads env)
npm run dev

# Start with specific port (auto-loads env)
npm run dev:local

# Start with external access (auto-loads env)
npm run dev:external
```

### Production
```bash
# Build application (auto-loads env)
npm run build

# Start production server (auto-loads env)
npm run start

# Production build (auto-loads env)
npm run build:production
```

## 🔍 Environment Variables

### Critical Variables (Required)
- `NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY` - Financial data API
- `NEXT_PUBLIC_FINNHUB_API_KEY` - Company profile API
- `NEXT_PUBLIC_FMP_API_KEY` - Financial metrics API
- `MONGODB_URI` - Database connection

### Optional Variables
- `NEXT_PUBLIC_POLYGON_API_KEY` - Market data API
- `NEXT_PUBLIC_OLLAMA_BASE_URL` - AI service URL
- `NEXT_PUBLIC_API_URL` - Backend API URL

## 🛠️ Troubleshooting

### Environment Variables Not Loading

1. **Check symlink:**
   ```bash
   ls -la .env
   # Should show: .env -> /home/ubuntu/.env
   ```

2. **Verify root file exists:**
   ```bash
   ls -la /home/ubuntu/.env
   ```

3. **Run environment check:**
   ```bash
   npm run env:check
   ```

4. **Manual fix:**
   ```bash
   rm -f .env
   ln -sf /home/ubuntu/.env .env
   ```

### Duplicate Environment Files

The `ensure-env.sh` script automatically removes:
- `.env.*` files (except the symlink)
- `.*.local` files containing environment variables
- Any other potential environment file duplicates

### API Keys Not Working

1. **Check rate limits:**
   - Alpha Vantage: 25 requests/day (free tier)
   - Finnhub: 60 requests/minute (free tier)
   - FMP: Varies by plan

2. **Verify API keys:**
   ```bash
   npm run env:check
   ```

3. **Test individual APIs:**
   ```bash
   node test-env.js
   ```

## 🔄 Adding New Environment Variables

### 1. Add to Root File
Edit `/home/ubuntu/.env`:
```bash
# New API key
NEW_API_KEY=your_key_here

# New service URL
NEW_SERVICE_URL=https://example.com
```

### 2. Update Build Scripts
If needed, add to `scripts/build-prod.sh`:
```bash
NEW_API_KEY=${NEW_API_KEY}
NEW_SERVICE_URL=${NEW_SERVICE_URL}
```

### 3. Restart Services
```bash
# Development
npm run dev

# Production
pm2 restart dashboard-aw
```

## 🚨 Important Notes

### Never Create Local .env Files
- ❌ Don't create `.env.local` in the project
- ❌ Don't create `.env.development` or `.env.production`
- ❌ Don't add environment variables to package.json scripts
- ✅ Always use the root `/home/ubuntu/.env` file

### Symlink Management
- The symlink is automatically managed by `ensure-env.sh`
- If you delete the symlink, run `npm run env:check` to restore it
- The symlink ensures Next.js can find the environment file

### Production Deployment
- Production builds automatically include environment variables
- The standalone build contains a runtime `.env` file
- PM2 and other process managers use the same environment

## 📚 Related Files

- **`/home/ubuntu/.env`** - Master environment file
- **`scripts/ensure-env.sh`** - Environment management script
- **`scripts/build-prod.sh`** - Production build script
- **`scripts/dev.sh`** - Development startup script
- **`ecosystem.config.js`** - PM2 configuration
- **`next.config.mjs`** - Next.js configuration

## 🎯 Best Practices

1. **Single Source of Truth** - Always edit `/home/ubuntu/.env`
2. **Automatic Loading** - Let scripts handle environment management
3. **Regular Checks** - Run `npm run env:check` before deployments
4. **No Duplicates** - Never create multiple environment files
5. **Version Control** - Keep `/home/ubuntu/.env` in version control (with sensitive data removed)

## 🔗 Quick Reference

```bash
# Check environment setup
npm run env:check

# Start development (auto-loads env)
npm run dev

# Build production (auto-loads env)
npm run build

# Start production (auto-loads env)
npm run start

# Manual environment check
./scripts/ensure-env.sh
```
