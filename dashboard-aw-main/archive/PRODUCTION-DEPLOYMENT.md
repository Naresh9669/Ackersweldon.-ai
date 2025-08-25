# AI Dashboard - Production Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Python backend running on port 5001
- Nginx (optional, for reverse proxy)

### 1. Deploy to Production

```bash
# Run the deployment script
./deploy-production.sh

# Or manually:
npm install
npm run build
./start-production.sh
```

### 2. Services Status

- **Frontend**: http://localhost:3000 (Next.js)
- **Backend**: http://localhost:5001 (Python/Flask)
- **AI Summaries**: http://localhost:3000/ai-summaries

## 📋 Build Status

✅ **Build Successful** - The application builds without errors
⚠️  **Warnings Present** - Some D3/Visx import warnings (non-critical)
✅ **TypeScript Issues Resolved** - All missing dependencies installed

## 🛠️ Production Scripts

### Start Production Server
```bash
./start-production.sh
```

### Deploy with Systemd (Auto-start)
```bash
./deploy-production.sh
# Follow prompts to set up systemd service

# Then manage with:
sudo systemctl start ai-dashboard
sudo systemctl status ai-dashboard
sudo systemctl stop ai-dashboard
```

### Clean Up Unused Dependencies
```bash
./cleanup-unused.sh
```

## 🔧 Configuration

### Environment Variables
- Managed by `./scripts/ensure-env.sh`
- Uses symlinked `.env` from `/home/ubuntu/.env`
- Production environment automatically set

### Next.js Configuration
- **Output**: Standalone build for production
- **Port**: 3000 (configurable)
- **Host**: 0.0.0.0 (accepts all connections)

## 🌐 Nginx Setup (Optional)

1. Copy nginx configuration:
```bash
sudo cp nginx-ai-dashboard.conf /etc/nginx/sites-available/ai-dashboard
sudo ln -s /etc/nginx/sites-available/ai-dashboard /etc/nginx/sites-enabled/
```

2. Update domain name in config file:
```bash
sudo nano /etc/nginx/sites-available/ai-dashboard
# Change 'your-domain.com' to your actual domain
```

3. Test and reload nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 🎯 Core Features Working

### ✅ AI Summaries Page
- **URL**: `/ai-summaries`
- **Features**: 
  - Infinite scroll pagination (loads 100 articles at a time)
  - AI sentiment analysis metrics
  - Proper date formatting
  - Production-ready error handling
  - Filters and search functionality

### ✅ News Page
- **URL**: `/news`
- **Features**: Working pagination and infinite scroll

### ✅ API Endpoints
- `/api/news` - News data with pagination
- `/api/ai-news` - AI-processed news (if needed)
- All other API routes functional

## 🧹 Cleanup Options

### Remove Unused Features (Optional)
If you don't need certain features, you can remove them:

```bash
# Remove financials page (saves ~112kB)
rm -rf app/financials components/components/chart

# Remove KYC functionality
rm -rf app/KYC services/kyc

# Remove general search
rm -rf app/general-search

# Clean up documentation
rm *.md (keep this file and README.md)
```

### Dependencies Status
- ✅ All required dependencies installed
- ✅ TypeScript types resolved
- ⚠️  Some dev dependencies can be removed (use cleanup script)

## 📊 Build Output

```
Route (app)                                 Size     First Load JS    
├ ○ /                                    2.93 kB         163 kB
├ ○ /ai-summaries                        9.51 kB         176 kB  ← Main feature
├ ○ /news                                10.6 kB         170 kB
├ ○ /financials                           112 kB         277 kB  ← Optional
├ ○ /KYC/enhanced                        7.06 kB         196 kB  ← Optional
└ ... (other routes)

○  (Static)   - Pre-rendered at build time
ƒ  (Dynamic)  - Server-rendered on demand
```

## 🔍 Monitoring

### Check Application Status
```bash
# Frontend status
curl -I http://localhost:3000

# Backend status  
curl -I http://localhost:5001/api/news?limit=1

# AI Summaries page
curl -I http://localhost:3000/ai-summaries
```

### View Logs
```bash
# If using systemd
sudo journalctl -u ai-dashboard -f

# If using manual start
tail -f server.log
```

## 🚨 Troubleshooting

### Common Issues

1. **Port 3000 already in use**
   ```bash
   pkill -f "next start"
   ./start-production.sh
   ```

2. **Backend not responding**
   - Ensure Python backend is running on port 5001
   - Check backend logs

3. **Build errors**
   - Run `npm install` to ensure all dependencies
   - Check Node.js version (requires 18+)

4. **Permission issues**
   - Ensure scripts are executable: `chmod +x *.sh`
   - Run as ubuntu user, not root

## 📈 Performance

- **Build time**: ~13-15 seconds
- **Bundle size**: Optimized for production
- **Caching**: Static assets cached for 1 year
- **Compression**: Gzip enabled in nginx config

## 🔒 Security

- Security headers configured in nginx
- No sensitive data in client bundle
- Environment variables properly managed
- HTTPS ready (uncomment nginx SSL section)

---

**🎉 Your AI Dashboard is now production-ready!**

Access your application at: http://your-server:3000
AI Summaries: http://your-server:3000/ai-summaries
