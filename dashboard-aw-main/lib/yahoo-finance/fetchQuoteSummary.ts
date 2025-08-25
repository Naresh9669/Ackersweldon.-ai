import { unstable_noStore as noStore } from "next/cache"

// Dynamic import to avoid module resolution issues
let yahooFinance: any = null;

async function getYahooFinance() {
  if (!yahooFinance) {
    try {
      const YahooFinance = await import('yahoo-finance2');
      yahooFinance = new YahooFinance.default();
    } catch (error) {
      console.error('Failed to import yahoo-finance2:', error);
      throw error;
    }
  }
  return yahooFinance;
}

export async function fetchQuoteSummary(ticker: string) {
  noStore()

  try {
    console.log(`🔍 fetchQuoteSummary: Using quote method for ${ticker} (quoteSummary not available)`);
    const yf = await getYahooFinance();
    // Yahoo Finance v2 class only has quote and autoc methods
    // So we'll use the quote method to get basic company information
    const response = await yf.quote(ticker);

    console.log(`✅ fetchQuoteSummary: Success for ${ticker}`, !!response);
    return response
  } catch (error) {
    console.error(`❌ fetchQuoteSummary: Error for ${ticker}:`, error);
    return null;
  }
}
