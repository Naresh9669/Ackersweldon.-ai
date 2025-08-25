import { NavBar } from "@/components/components/NavBarFinancials";
import { SideBar } from "@/components/components/SideBar";
import { SidebarProvider } from "@/components/ui/sidebar";
import StockChart from "@/components/components/chart/StockChart"
import CompanySummaryCard from "@/app/financials/[symbol]/components/CompanySummaryCard"
import FinanceSummary from "@/app/financials/[symbol]/components/FinanceSummary"
import News from "@/app/financials/[symbol]/components/News"
import { Card, CardContent } from "@/components/ui/card"
import { DEFAULT_INTERVAL, DEFAULT_RANGE } from "@/lib/yahoo-finance/constants"
import {
  validateInterval,
  validateRange,
} from "@/lib/yahoo-finance/fetchChartData"
import { Interval } from "@/types/yahoo-finance"
import { Suspense } from "react"
import type { Metadata } from "next"
import { fetchQuote } from "@/lib/yahoo-finance/fetchQuote"

type Props = {
  params: {
    symbol: string
  }
  searchParams?: {
    range?: string
    interval?: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {

  const {symbol} = await params;

  const quoteData = await fetchQuote(symbol)
  const regularMarketPrice = quoteData.regularMarketPrice?.toLocaleString(
    "en-US",
    {
      style: "currency",
      currency: "USD",
    }
  )

  return {
    title: `${symbol} ${regularMarketPrice}`,
    description: `Stocks page for ${symbol}`,
    keywords: [symbol, "stocks"],
  }
}

export default async function StocksPage({ params, searchParams }: Props) {
  
  //const ticker = params.symbol
  const _params = await params;
  const _searchParams = await searchParams;
  
  const ticker = _params.symbol
  const range = validateRange(_searchParams?.range || DEFAULT_RANGE)
  const interval = validateInterval(
    range,
    (_searchParams?.interval as Interval) || DEFAULT_INTERVAL
  )

  return (

    
    <SidebarProvider defaultOpen>
    <SideBar />
    <div className="p-3 w-full">
        <NavBar symbol={ticker} category={"Summary"}/>
        <div className="w-full p-4 ">
            <div>
            <Card>
              <CardContent className="space-y-10 pt-6 lg:px-40 lg:py-14">
                <Suspense
                  fallback={
                    <div className="flex h-[27.5rem] items-center justify-center text-muted-foreground ">
                      Loading...
                    </div>
                  }
                >
                  <StockChart ticker={ticker} range={range} interval={interval} />
                </Suspense>
                <Suspense
                  fallback={
                    <div className="flex h-[10rem] items-center justify-center text-muted-foreground ">
                      Loading...
                    </div>
                  }
                >
                  <FinanceSummary ticker={ticker} />
                </Suspense>
                <Suspense
                  fallback={
                    <div className="flex h-[10rem] items-center justify-center text-muted-foreground ">
                      Loading...
                    </div>
                  }
                >
                  <CompanySummaryCard ticker={ticker} />
                </Suspense>
                <Suspense
                  fallback={
                    <div className="flex h-[20rem] items-center justify-center text-muted-foreground ">
                      Loading...
                    </div>
                  }
                >
                  <News ticker={ticker} />
                </Suspense>
              </CardContent>
            </Card>
          </div>
            
        </div>
    </div>
    </SidebarProvider>
    
  )
}
