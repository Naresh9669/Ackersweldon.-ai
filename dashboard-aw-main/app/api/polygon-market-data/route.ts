import { NextRequest, NextResponse } from 'next/server';

// Define the response interface
interface MarketDataItem {
  price: number;
  change: number;
  volume: number;
  symbol: string;
  name: string;
}

interface MarketDataResponse {
  [key: string]: MarketDataItem;
}

export async function GET(request: NextRequest) {
  try {
    const POLYGON_API_KEY = process.env.NEXT_PUBLIC_POLYGON_API_KEY;
    
    if (!POLYGON_API_KEY) {
      console.error('❌ Polygon API key not found');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Polygon API key not configured' 
        },
        { status: 500 }
      );
    }

    console.log('🔄 Fetching market indices from Polygon.io...');
    
    // Market indices symbols (using SPY, DIA, QQQ as proxies for S&P 500, Dow, NASDAQ)
    const symbols = ['SPY', 'DIA', 'QQQ', 'VIX'];
    const marketData: MarketDataResponse = {};
    const errors: string[] = [];

    // Fetch data for each symbol
    for (const symbol of symbols) {
      try {
        console.log(`🔄 Fetching data for ${symbol}...`);
        
        // Get previous close for change calculation
        const prevCloseResponse = await fetch(
          `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${POLYGON_API_KEY}`
        );
        
        if (!prevCloseResponse.ok) {
          throw new Error(`Failed to fetch previous close for ${symbol}: ${prevCloseResponse.status}`);
        }
        
        const prevCloseData = await prevCloseResponse.json();
        
        if (!prevCloseData.results || prevCloseData.results.length === 0) {
          throw new Error(`No previous close data for ${symbol}`);
        }
        
        const prevClose = prevCloseData.results[0];
        
        // Get current snapshot
        const snapshotResponse = await fetch(
          `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/${symbol}?apiKey=${POLYGON_API_KEY}`
        );
        
        if (!snapshotResponse.ok) {
          throw new Error(`Failed to fetch snapshot for ${symbol}: ${snapshotResponse.status}`);
        }
        
        const snapshotData = await snapshotResponse.json();
        
        if (!snapshotData.results || !snapshotData.results.ticker) {
          throw new Error(`No snapshot data for ${symbol}`);
        }
        
        const ticker = snapshotData.results.ticker;
        const currentPrice = ticker.day?.c || prevClose.c; // Use current or previous close
        const previousClose = prevClose.c;
        const change = currentPrice - previousClose;
        const changePercent = (change / previousClose) * 100;
        
        // Map symbol to display name
        const displayName = symbol === 'SPY' ? 'S&P 500' : 
                           symbol === 'DIA' ? 'Dow Jones' : 
                           symbol === 'QQQ' ? 'NASDAQ' : 
                           symbol === 'VIX' ? 'VIX' : symbol;
        
        const displaySymbol = symbol === 'SPY' ? 'GSPC' : 
                             symbol === 'DIA' ? 'DJI' : 
                             symbol === 'QQQ' ? 'IXIC' : 'VIX';

        marketData[displaySymbol] = {
          price: currentPrice,
          change: change,
          volume: ticker.day?.v || 0,
          symbol: displaySymbol,
          name: displayName
        };
        
        console.log(`✅ Successfully fetched data for ${symbol}: $${currentPrice.toFixed(2)} (${change >= 0 ? '+' : ''}${change.toFixed(2)})`);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${symbol}: ${errorMessage}`);
        console.error(`❌ Error fetching ${symbol}:`, errorMessage);
      }
    }

    // Check if we have any valid data
    if (Object.keys(marketData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No market data could be retrieved from Polygon.io',
          details: errors.length > 0 ? errors : undefined,
        },
        { status: 500 }
      );
    }

    console.log(`📊 Market data summary: ${Object.keys(marketData).length}/${symbols.length} symbols retrieved successfully`);
    if (errors.length > 0) {
      console.warn(`⚠️ Partial failures:`, errors);
    }

    return NextResponse.json({
      success: true,
      data: marketData,
      metadata: {
        timestamp: new Date().toISOString(),
        symbolsRequested: symbols.length,
        symbolsRetrieved: Object.keys(marketData).length,
        dataSource: 'polygon_io',
        errors: errors.length > 0 ? errors : undefined,
      },
    });

  } catch (error) {
    console.error('Unexpected error in Polygon market data API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error occurred while fetching market data',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
