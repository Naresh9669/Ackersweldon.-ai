import { NextRequest, NextResponse } from 'next/server';
import { getHistoricalDataMultiSource } from '@/lib/financialData';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');
    const range = searchParams.get('range') || '1Y';

    console.log(`🔄 Polygon Chart API called with: ticker=${ticker}, range=${range}`);

    if (!ticker) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Ticker parameter is required',
          statusCode: 400
        },
        { status: 400 }
      );
    }

    // Use Polygon.io integration to get real historical data
    console.log(`📊 Fetching historical data from Polygon.io for ${ticker}...`);
    const historicalData = await getHistoricalDataMultiSource(ticker, range);
    
    if (!historicalData || historicalData.length === 0) {
      console.warn(`⚠️ No historical data found for ${ticker}`);
      return NextResponse.json({
        success: false,
        error: `No historical data found for ${ticker}`,
        statusCode: 404,
        metadata: {
          ticker,
          range,
          dataSource: 'polygon_io',
          timestamp: new Date().toISOString()
        }
      }, { status: 404 });
    }

    // Transform the data to the format expected by the chart
    const chartData = historicalData.map(point => ({
      date: point.date,
      close: point.price,
      open: point.open || point.price,
      high: point.high || point.price,
      low: point.low || point.price,
      volume: point.volume || 0
    }));
    
    console.log(`✅ Retrieved ${chartData.length} real data points from Polygon.io for ${ticker}`);

    return NextResponse.json({
      success: true,
      data: {
        quotes: chartData,
        meta: {
          symbol: ticker,
          range: range,
          dataPoints: chartData.length,
          dataSource: 'polygon_io',
          provider: 'Polygon.io',
          note: 'Real historical stock data from Polygon.io',
          timestamp: new Date().toISOString()
        }
      }
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      }
    });

  } catch (error) {
    console.error('❌ Error in Polygon Chart API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch chart data from Polygon.io',
        details: error instanceof Error ? error.message : 'Unknown error',
        statusCode: 500,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
