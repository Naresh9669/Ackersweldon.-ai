# 📰 News System Setup Guide

## Overview
The news system now automatically fetches news from multiple sources and stores metadata in the database. News is displayed on the dashboard without requiring manual search.

## 🚀 New Features

### 1. **Automatic News Fetching**
- **Alpha Vantage**: Financial news with sentiment analysis
- **NewsAPI**: Business, technology, science, and health news
- **SearXNG**: General web search news
- **CryptoCompare**: Cryptocurrency news

### 2. **Database Storage**
- News metadata stored in MongoDB (`news_metadata` collection)
- Automatic deduplication based on title and source
- News is retained indefinitely for historical reference

### 3. **New API Endpoints**
- `POST /api/news/fetch` - Fetch news from all sources
- `GET /api/news/latest` - Get latest news from database
- `GET /api/news/categories` - Get news categories and counts
- `GET /api/news/sources` - Get news sources and counts

## 🔧 Setup Instructions

### 1. **Environment Variables**
Make sure these are set in your `.env.dashboard` file:
```bash
ALPHA_VANTAGE_API_KEY=your_key_here
NEWSAPI_KEY=your_key_here
SEARX_BASE_URL=http://localhost:8081
MONGO_URI=mongodb://localhost:27017/
```

### 2. **Initial News Fetch**
Run this command to fetch initial news:
```bash
cd aw/aw_scraper-main
source venv/bin/activate
python fetch_news_cron.py
```

### 3. **Automatic Updates**
Set up a cron job to fetch news every 4 hours:
```bash
# Edit crontab
crontab -e

# Add this line (fetches news every 4 hours)
0 */4 * * * cd /home/ubuntu/aw/aw_scraper-main && /home/ubuntu/aw/aw_scraper-main/venv/bin/python fetch_news_cron.py
```

## 📊 News Categories Available

- **Financial**: Stock market, forex, economic news
- **Technology**: Tech industry updates
- **Business**: Business and corporate news
- **Science**: Scientific discoveries and research
- **Health**: Health and medical news
- **Cryptocurrency**: Crypto market updates
- **General**: Other news categories

## 🎯 How It Works

1. **Automatic Fetching**: News is fetched from multiple APIs every 4 hours
2. **Database Storage**: Metadata is stored with deduplication
3. **Dashboard Display**: News appears automatically on the news page
4. **Search Functionality**: Users can still search for specific topics
5. **Real-time Updates**: Fresh news can be fetched manually via the "Fetch Fresh News" button

## 🔍 Troubleshooting

### Check News Fetch Logs
```bash
tail -f aw/aw_scraper-main/logs/news_fetch.log
```

### Test API Endpoints
```bash
# Test health
curl http://localhost:5001/health

# Test news fetch
curl -X POST http://localhost:5001/api/news/fetch

# Test latest news
curl http://localhost:5001/api/news/latest?limit=5
```

### Manual News Fetch
```bash
cd aw/aw_scraper-main
source venv/bin/activate
python fetch_news_cron.py
```

## 📈 Monitoring

- Check MongoDB for stored news: `db.news_metadata.find().count()`
- Monitor fetch logs: `tail -f logs/news_fetch.log`
- View API statistics: `curl http://localhost:5001/api/news/categories`

## 🎉 Result

Your news page will now:
- ✅ **Automatically load news** on page visit
- ✅ **Show real-time data** from multiple sources
- ✅ **Store news metadata** in the database
- ✅ **Update automatically** every 4 hours
- ✅ **Allow manual refresh** via the fetch button
- ✅ **Provide search functionality** for specific topics

No more mock data - just real, fresh news from multiple sources! 🚀
