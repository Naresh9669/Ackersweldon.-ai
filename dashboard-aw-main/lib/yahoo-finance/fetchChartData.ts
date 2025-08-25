import { unstable_noStore as noStore } from "next/cache"
import type {
  ChartOptions,
  ChartResultArray,
} from "@/node_modules/yahoo-finance2/dist/esm/src/modules/chart"
import type { Interval, Range } from "@/types/yahoo-finance"
import { DEFAULT_RANGE, INTERVALS_FOR_RANGE, VALID_RANGES } from "./constants"
import { CalculateRange } from "@/lib/utils"
import yahooFinance from "yahoo-finance2"

export const validateRange = (range: string): Range =>
  VALID_RANGES.includes(range as Range) ? (range as Range) : DEFAULT_RANGE

export const validateInterval = (range: Range, interval: Interval): Interval =>
  INTERVALS_FOR_RANGE[range].includes(interval)
    ? interval
    : INTERVALS_FOR_RANGE[range][0]

export async function fetchChartData(
  ticker: string,
  range: Range,
  interval: Interval
) {
  noStore()

  const queryOptions = {
    period1: CalculateRange(range),
    interval: interval,
  }

  try {
    console.log(`🔍 fetchChartData: Calling yahoo-finance2.historical with ticker=${ticker}, options=`, queryOptions)
    const historicalData = await (yahooFinance as any).historical(
      ticker,
      queryOptions
    )
    console.log(`✅ fetchChartData: Success, got ${historicalData?.length || 0} data points`)
    
    // Transform the data to match the expected format
    const chartData = {
      quotes: historicalData?.map((item: any) => ({
        date: item.date,
        close: item.close,
        open: item.open,
        high: item.high,
        low: item.low,
        volume: item.volume
      })) || [],
      meta: {
        symbol: ticker,
        range: range,
        interval: interval
      }
    }
    
    return chartData
  } catch (error) {
    console.error("❌ fetchChartData error:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      ticker,
      queryOptions
    })
    throw new Error(`Failed to fetch chart data for ${ticker}: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
