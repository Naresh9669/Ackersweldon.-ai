import { unstable_noStore as noStore } from "next/cache";
import yahooFinance from "yahoo-finance2";

export async function fetchQuote(ticker: string) {
  noStore();

  try {
    console.log(`🔍 fetchQuote: Calling yahoo-finance2 for ${ticker}`);
    const quote = await yahooFinance.quote(ticker);
    console.log(`✅ fetchQuote: Success for ${ticker}:`, quote);
    return { ok: true, data: quote } as const;
  } catch (err: any) {
    console.error(`❌ fetchQuote: Error for ${ticker}:`, err?.message);
    return { ok: false, error: err?.message || "Failed to fetch stock quote" } as const;
  }
}
