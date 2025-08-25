import { NextRequest, NextResponse } from 'next/server';

const FMP_API_KEY = process.env.NEXT_PUBLIC_FMP_API_KEY;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');
    const endpoint = searchParams.get('endpoint'); // profile, quote, ratios-ttm, key-metrics-ttm
    
    if (!ticker || !endpoint) {
      return NextResponse.json(
        { error: 'Missing required parameters: ticker and endpoint' },
        { status: 400 }
      );
    }
    
    if (!FMP_API_KEY) {
      return NextResponse.json(
        { error: 'FMP API key not configured' },
        { status: 500 }
      );
    }
    
    // Validate endpoint to prevent abuse
    const validEndpoints = ['profile', 'quote', 'ratios-ttm', 'key-metrics-ttm'];
    if (!validEndpoints.includes(endpoint)) {
      return NextResponse.json(
        { error: 'Invalid endpoint specified' },
        { status: 400 }
      );
    }
    
    console.log(`🔍 FMP Proxy: Fetching ${endpoint} for ${ticker}`);
    
    // Make the FMP API call from the backend
    const fmpUrl = `https://financialmodelingprep.com/api/v3/${endpoint}/${ticker}?apikey=${FMP_API_KEY}`;
    
    const response = await fetch(fmpUrl, {
      headers: {
        'User-Agent': 'Dashboard-AW/1.0',
        'Accept': 'application/json',
      },
      // Add timeout
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });
    
    if (!response.ok) {
      console.error(`❌ FMP Proxy: ${endpoint} failed with status ${response.status}`);
      return NextResponse.json(
        { error: `FMP API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log(`✅ FMP Proxy: ${endpoint} for ${ticker} successful`);
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('❌ FMP Proxy error:', error);
    
    if (error instanceof Error && error.name === 'TimeoutError') {
      return NextResponse.json(
        { error: 'Request timeout - FMP API took too long to respond' },
        { status: 408 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
