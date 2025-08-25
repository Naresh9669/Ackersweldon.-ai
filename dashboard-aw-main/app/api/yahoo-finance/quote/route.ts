import { NextRequest, NextResponse } from 'next/server';
import { fetchQuote } from '@/lib/yahoo-finance/fetchQuote';
import { fetchQuoteSummary } from '@/lib/yahoo-finance/fetchQuoteSummary';

// Define proper interfaces for Yahoo Finance data
interface YahooFinanceQuote {
  currency?: string;
  regularMarketTime?: Date;
  regularMarketPrice?: number;
  typeDisp?: string;
  quoteSourceName?: string;
  lastMarket: string;
  // Add other properties as needed
}

interface SummaryDetail {
  sector?: string;
  industry?: string;
  fullTimeEmployees?: number;
  longBusinessSummary?: string;
  enterpriseValue?: number;
  returnOnEquity?: number;
  returnOnAssets?: number;
  debtToEquity?: number;
}

interface DefaultKeyStatistics {
  beta?: number;
  priceToBook?: number;
  enterpriseToRevenue?: number;
  enterpriseToEbitda?: number;
}

interface QuoteSummary {
  summaryDetail?: SummaryDetail;
  defaultKeyStatistics?: DefaultKeyStatistics;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');

    if (!ticker) {
      return NextResponse.json(
        { error: 'Ticker parameter is required' },
        { status: 400 }
      );
    }

    // Fetch both quote and quoteSummary data for comprehensive information
    const [quoteData, summaryData] = await Promise.all([
      fetchQuote(ticker),
      fetchQuoteSummary(ticker)
    ]);

    if (!quoteData) {
      return NextResponse.json(
        { error: 'Failed to fetch quote data' },
        { status: 500 }
      );
    }

    // Type guard to ensure summaryData has the expected structure
    const typedSummaryData = summaryData as QuoteSummary | null;
    const summaryDetail = typedSummaryData?.summaryDetail;
    const defaultKeyStats = typedSummaryData?.defaultKeyStatistics;

    // Combine the data for comprehensive company information with safe property access
    const enhancedData = {
      ...quoteData,
      // Additional company details from summary with safe access
      sector: summaryDetail?.sector || null,
      industry: summaryDetail?.industry || null,
      fullTimeEmployees: summaryDetail?.fullTimeEmployees || null,
      businessSummary: summaryDetail?.longBusinessSummary || null,
      
      // Financial metrics with safe access
      enterpriseValue: summaryDetail?.enterpriseValue || null,
      returnOnEquity: summaryDetail?.returnOnEquity || null,
      returnOnAssets: summaryDetail?.returnOnAssets || null,
      debtToEquity: summaryDetail?.debtToEquity || null,
      
      // Key statistics with safe access
      beta: defaultKeyStats?.beta || null,
      priceToBook: defaultKeyStats?.priceToBook || null,
      enterpriseToRevenue: defaultKeyStats?.enterpriseToRevenue || null,
      enterpriseToEbitda: defaultKeyStats?.enterpriseToEbitda || null
    };
    
    return NextResponse.json({
      success: true,
      data: enhancedData
    });

  } catch (error) {
    console.error('Error fetching quote:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch quote data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
