import { NextRequest, NextResponse } from 'next/server';
import { fetchChartData } from '@/lib/yahoo-finance/fetchChartData';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');
    const range = searchParams.get('range') || '1y';
    const interval = searchParams.get('interval') || '1d';

    console.log(`🔄 Chart API called with: ticker=${ticker}, range=${range}, interval=${interval}`);

    if (!ticker) {
      return NextResponse.json(
        { error: 'Ticker parameter is required' },
        { status: 400 }
      );
    }

    console.log(`📊 Fetching chart data for ${ticker}...`);
    const chartData = await fetchChartData(ticker, range as any, interval as any);
    console.log(`✅ Chart data fetched:`, JSON.stringify(chartData).substring(0, 200) + '...');
    
    return NextResponse.json({
      success: true,
      data: chartData
    });

  } catch (error) {
    console.error('Error fetching chart data:', error);
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
