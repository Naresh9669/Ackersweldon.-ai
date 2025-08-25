export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { fetchQuote } from '@/lib/yahoo-finance/fetchQuote';
import { getMarketDataMultiSource } from '@/lib/marketData';

// Define proper interface for Yahoo Finance quote data
interface YahooFinanceQuote {
  regularMarketPrice?: number;
  previousClose?: number;
  regularMarketVolume?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  // Add other properties as needed
}

interface MarketDataItem {
  price: number;
  change: number;
  volume: number;
  symbol: string;
  name: string;
  changePercent: number;
}

interface MarketDataResponse {
  [key: string]: MarketDataItem;
}

// Centralized error handler following Node.js best practices
class MarketDataError extends Error {
  public readonly isOperational: boolean;
  public readonly statusCode: number;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.name = 'MarketDataError';
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, MarketDataError);
  }
}

// Enhanced error handling with proper logging
async function handleMarketDataError(error: unknown, symbol: string): Promise<never> {
  if (error instanceof MarketDataError) {
    console.error(`Market data error for ${symbol}:`, error.message);
    throw error;
  }
  
  if (error instanceof Error) {
    console.error(`Unexpected error fetching market data for ${symbol}:`, error.message);
    throw new MarketDataError(`Failed to fetch data for ${symbol}: ${error.message}`, 500, false);
  }
  
  console.error(`Unknown error type for ${symbol}:`, error);
  throw new MarketDataError(`Unknown error occurred for ${symbol}`, 500, false);
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Market data API called - using multi-source strategy...');
    
    // Use the multi-source market data function with fallbacks
    const marketData = await getMarketDataMultiSource();
    
    if (!marketData || Object.keys(marketData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No market data could be retrieved from any source',
          statusCode: 503,
          metadata: {
            timestamp: new Date().toISOString(),
            symbolsRequested: 4,
            symbolsRetrieved: 0,
          },
        },
        { status: 200, headers: { 'Cache-Control': 'no-store' } }
      );
    }
    
    console.log(`✅ Market data retrieved successfully: ${Object.keys(marketData).length} symbols`);
    
    return NextResponse.json(
      {
        success: true,
        data: marketData,
        metadata: {
          timestamp: new Date().toISOString(),
          symbolsRequested: 4,
          symbolsRetrieved: Object.keys(marketData).length,
        },
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );



  } catch (error) {
    // Centralized error handling following Node.js best practices
    if (error instanceof MarketDataError) {
      console.error('Market data API error:', error.message);
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          statusCode: error.statusCode,
          timestamp: new Date().toISOString(),
        },
        { status: 200, headers: { 'Cache-Control': 'no-store' } }
      );
    }
    
    // Handle unexpected errors
    console.error('Unexpected error in market data API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error occurred while fetching market data',
        statusCode: 500,
        timestamp: new Date().toISOString(),
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
