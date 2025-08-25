# Financial Data Setup Guide

This guide will help you set up the financial data service to get real-time stock data instead of mock data.

## Required API Keys

### 1. Alpha Vantage API Key (Recommended - Free)
- **Website**: https://www.alphavantage.co/support/#api-key
- **Free Tier**: 5 API calls per minute, 500 per day
- **Features**: Company overview, real-time quotes, historical data
- **Setup**: Sign up for free, get API key instantly

### 2. Finnhub API Key (Alternative - Free)
- **Website**: https://finnhub.io/register
- **Free Tier**: 60 API calls per minute
- **Features**: Company profiles, quotes, historical data
- **Setup**: Free registration, API key provided immediately

### 3. Polygon.io API Key (Premium - Free tier available)
- **Website**: https://polygon.io/
- **Free Tier**: 5 API calls per minute
- **Features**: High-quality market data
- **Setup**: Sign up for free tier

## Environment Configuration

Create a `.env.local` file in your project root with the following variables:

```bash
# Financial Data API Keys
NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key_here
NEXT_PUBLIC_FINNHUB_API_KEY=your_finnhub_api_key_here
NEXT_PUBLIC_POLYGON_API_KEY=your_polygon_api_key_here

# Backend API URL (optional)
NEXT_PUBLIC_API_URL=http://localhost:5001
```

## How It Works

The financial data service uses a **fallback strategy** to ensure reliability:

1. **Priority 1**: Alpha Vantage API (most reliable)
2. **Priority 2**: Finnhub API (good alternative)
3. **Priority 3**: Yahoo Finance (free, no API key needed)
4. **Priority 4**: Backend API (if you have custom backend)

If one API fails, it automatically tries the next one, ensuring you always get data.

## Features

✅ **Real-time stock quotes** with price changes  
✅ **Company information** (sector, industry, employees)  
✅ **Financial metrics** (P/E ratio, market cap, dividend yield)  
✅ **Historical price data** with interactive charts  
✅ **Multi-timeframe support** (1M, 3M, 6M, 1Y, 2Y, 5Y)  
✅ **Automatic fallbacks** for reliability  
✅ **Rate limiting protection** with caching  

## Testing

1. Set up your API keys in `.env.local`
2. Restart your development server
3. Go to the Financial Data page
4. Search for a stock ticker (e.g., AAPL, TSLA, MSFT)
5. You should see real data instead of random numbers

## Troubleshooting

### "All APIs failed" Error
- Check your API keys are correct
- Verify your API keys have sufficient quota
- Check browser console for specific error messages

### No Data Displayed
- Ensure at least one API key is configured
- Check network tab for failed API calls
- Verify the stock ticker exists

### Rate Limiting
- The service includes 5-minute caching to prevent rate limiting
- If you hit limits, wait a few minutes and try again

## Support

If you continue to have issues:
1. Check the browser console for error messages
2. Verify your API keys are working with the provider's test endpoints
3. Ensure you're not hitting API rate limits
