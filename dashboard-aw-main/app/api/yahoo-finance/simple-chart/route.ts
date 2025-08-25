import { NextRequest, NextResponse } from 'next/server';
import { getHistoricalDataMultiSource } from '@/lib/financialData';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');
    const range = searchParams.get('range') || '1Y';

    console.log(`🔄 Polygon chart API called with: ticker=${ticker}, range=${range}`);

    if (!ticker) {
      return NextResponse.json(
        { error: 'Ticker parameter is required' },
        { status: 400 }
      );
    }

    // Use your existing Polygon.io integration to get real historical data
    console.log(`📊 Fetching historical data from Polygon.io for ${ticker}...`);
    const historicalData = await getHistoricalDataMultiSource(ticker, range);
    
    if (!historicalData || historicalData.length === 0) {
      throw new Error(`No historical data found for ${ticker}`);
    }

    // Transform the data to the format expected by the chart
    const chartData = historicalData.map(point => ({
      date: point.date,
      close: point.price
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
          dataSource: 'polygon_io_historical_data',
          note: 'Real historical data from Polygon.io with fallbacks'
        }
      }
    });

  } catch (error) {
    console.error('Error in Polygon chart API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch chart data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
