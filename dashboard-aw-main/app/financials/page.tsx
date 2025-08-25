'use client'

import React, { useState, useEffect, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { SideBar } from '@/components/components/SideBar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { NavBar } from '@/components/components/NavBar'
// Import the modern AG Charts component
import AGStockChart from '@/components/AGStockChart'
import { fetchComprehensiveCompanyData, getHistoricalDataMultiSource } from '@/lib/financialData'
import { getMarketDataMultiSource } from '@/lib/marketData'
import type { CompanyData } from '@/lib/financialData'

// ---------- Format helpers ----------
const fmtCurrency = (n?: number, currency: string = 'USD') =>
  typeof n === 'number' ? n.toLocaleString(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }) : '—'

const fmtCompact = (n?: number) =>
  typeof n === 'number' ? Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 2 }).format(n) : '—'

const fmtPercent = (n?: number) =>
  typeof n === 'number' ? `${(n <= 1 ? n * 100 : n).toFixed(2)}%` : '—'

const fmtDate = (d?: string | number | Date) => {
  if (!d) return '—'
  const dt = new Date(d)
  return isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString()
}

// Simple helpers for conditional rendering for missing values
const hasNum = (n?: number) => typeof n === 'number' && isFinite(n) && n !== 0;
const hasStr = (s?: string) => typeof s === 'string' && s.trim().length > 0;

// Error boundary component for the financials page
function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 max-w-md mx-4 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-gray-600 mb-4">We encountered an error while loading the financial data.</p>
        <div className="space-y-2">
          <button
            onClick={resetErrorBoundary}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">Error Details</summary>
            <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}

// Main financials page component with error handling
export default function FinancialsPage() {
  const [ticker, setTicker] = useState("")
  const [chartPeriod, setChartPeriod] = useState("1Y")
  const [companyData, setCompanyData] = useState<CompanyData | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [marketData, setMarketData] = useState<{[key: string]: { price: number; change: number; volume: number; symbol: string; name: string }} | null>(null)
  const [marketDataLoading, setMarketDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load market data on component mount with error handling
  useEffect(() => {
    console.log('🔄 FinancialsPage: Loading market data...')
    // Add a small delay to ensure component is fully mounted
    const timer = setTimeout(() => {
      loadMarketData()
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Refresh chart data when period changes
  useEffect(() => {
    if (companyData && hasSearched) {
      refreshChartData()
    }
  }, [chartPeriod])

  const loadMarketData = async () => {
    try {
      console.log('🔄 FinancialsPage: Starting market data fetch...')
      setError(null)
      setMarketDataLoading(true)
      const data = await getMarketDataMultiSource()
      console.log('✅ FinancialsPage: Market data received:', data)
      console.log('✅ FinancialsPage: Market data type:', typeof data)
      console.log('✅ FinancialsPage: Market data keys:', data ? Object.keys(data) : 'null')
      setMarketData(data)
    } catch (error) {
      console.error('❌ FinancialsPage: Error loading market data:', error)
      setError('Failed to load market data. Please try again later.')
    } finally {
      setMarketDataLoading(false)
    }
  }

  const refreshChartData = async () => {
    if (!companyData?.symbol) return
    
    try {
      setError(null)
      const historicalData = await getHistoricalDataMultiSource(companyData.symbol, chartPeriod)
      if (historicalData && historicalData.length > 0) {
        setCompanyData(prev => prev ? { ...prev, historicalData } : null)
      }
    } catch (error) {
      console.error('Error refreshing chart data:', error)
      setError('Failed to refresh chart data. Please try again.')
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticker.trim()) return

    try {
      setError(null)
      setLoading(true)
      setHasSearched(true)

      console.log('🔍 FinancialsPage: About to call fetchComprehensiveCompanyData for:', ticker.trim().toUpperCase())
      const data = await fetchComprehensiveCompanyData(ticker.trim().toUpperCase())
      console.log('🔍 FinancialsPage: fetchComprehensiveCompanyData returned:', data)
      if (data) {
        console.log('🔍 FinancialsPage: Data received, structure:', {
          symbol: data.symbol,
          name: data.name,
          price: data.price,
          forwardPE: data.forwardPE,
          revenueTTM: data.revenueTTM || 0,
          totalDebt: data.totalDebt || 0,
          hasEnhancedFMP: (data.revenueTTM || 0) > 0 || (data.totalDebt || 0) > 0,
          allKeys: Object.keys(data)
        })
        setCompanyData(data)
        
        // Also fetch historical data for the chart
        try {
          console.log('🔄 Fetching historical data for chart...')
          const historicalData = await getHistoricalDataMultiSource(data.symbol, chartPeriod)
          if (historicalData && historicalData.length > 0) {
            console.log('✅ Historical data fetched:', historicalData.length, 'points')
            setCompanyData(prev => prev ? { ...prev, historicalData } : null)
          } else {
            console.log('⚠️ No historical data available for chart')
          }
        } catch (historicalError) {
          console.error('Error fetching historical data:', historicalError)
          // Don't show error to user, just log it
        }
      } else {
        setError('No data found for this ticker. Please check the symbol and try again.')
      }
    } catch (error) {
      console.error('Error searching for ticker:', error)
      setError('An error occurred while searching. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // If there's an error, show error UI
  if (error && !companyData) {
    return (
      <SidebarProvider defaultOpen>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex overflow-x-hidden [scrollbar-gutter:stable]">
          <div className="flex-shrink-0">
            <SideBar />
          </div>
          <div className="flex-1">
            <Suspense fallback={<div className="h-16 bg-gray-100 animate-pulse rounded-lg"></div>}>
              <NavBar />
            </Suspense>
            <main className="px-4 sm:px-6 lg:py-8 overflow-x-hidden [scrollbar-gutter:stable]">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium text-red-800 mb-2">Error Loading Data</h4>
                    <p className="text-sm text-red-700 mb-3">{error}</p>
                    <button
                      onClick={() => {
                        setError(null)
                        loadMarketData()
                      }}
                      className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
              {/* Rest of the form */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Stock Ticker</label>
                    <input
                      type="text"
                      placeholder="Enter stock ticker (e.g. AAPL, TSLA, MSFT)"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={ticker}
                      onChange={(e) => setTicker(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Chart Period</label>
                    <select
                      className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={chartPeriod}
                      onChange={(e) => setChartPeriod(e.target.value)}
                    >
                      <option value="1M">1 Month</option>
                      <option value="3M">3 Months</option>
                      <option value="6M">6 Months</option>
                      <option value="1Y">1 Year</option>
                      <option value="2Y">2 Years</option>
                      <option value="5Y">5 Years</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      disabled={loading}
                    >
                      <div className="flex items-center gap-2">
                        {loading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        )}
                        {loading ? 'Searching...' : 'Search'}
                      </div>
                    </button>
                  </div>
                </form>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider defaultOpen>
      <div className="sidebar-layout bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <SideBar />
        <div className="sidebar-content flex flex-col">
          <Suspense fallback={<div className="h-16 bg-gray-100 animate-pulse rounded-lg"></div>}>
            <NavBar />
          </Suspense>
          
          <main className="main-content content-area force-full-width">
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">💹 Company & Stock Data</h1>
                  <p className="text-lg text-gray-600">Comprehensive financial data with multi-API fallbacks</p>
                </div>
                  </div>
                  
                  {/* Market Data Status */}
                {marketData && Object.keys(marketData).length > 0 && (
                  <div className="mt-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(marketData).map(([symbol, data]) => (
                        <div key={symbol} className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                          <div className="font-medium text-gray-800 text-center mb-2">{symbol}</div>
                          <div className="text-lg font-bold text-gray-900 text-center mb-1">${data.price.toFixed(2)}</div>
                          <div className={`text-sm text-center ${data.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {data.change >= 0 ? '+' : ''}{data.change.toFixed(2)} ({data.change >= 0 ? '+' : ''}{(() => {
                              const denom = data.price - data.change;
                              const pct = denom ? (data.change / denom) * 100 : 0;
                              return pct.toFixed(2);
                            })()}%)
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            {/* Search Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
              <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stock Ticker</label>
                  <input
                    type="text"
                    placeholder="Enter stock ticker (e.g. AAPL, TSLA, MSFT)"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Chart Period</label>
                  <select
                    className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={chartPeriod}
                    onChange={(e) => setChartPeriod(e.target.value)}
                  >
                    <option value="1M">1 Month</option>
                    <option value="3M">3 Months</option>
                    <option value="6M">6 Months</option>
                    <option value="1Y">1 Year</option>
                    <option value="2Y">2 Years</option>
                    <option value="5Y">5 Years</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    disabled={loading}
                  >
                    <div className="flex items-center gap-2">
                    {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      )}
                      {loading ? 'Searching...' : 'Search'}
                    </div>
                  </button>
                </div>
              </form>
            </div>

            {/* Company Data Display */}
            {companyData && (
              <div className="space-y-8">
                {/* Company Header - Enhanced with beautiful styling */}
                <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl shadow-lg border border-blue-200 p-8">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-2xl">{companyData.symbol?.charAt(0)}</span>
                        </div>
                        <div>
                          <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                            {companyData.name}
                          </h2>
                          <p className="text-2xl text-gray-600 font-semibold">{companyData.symbol}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm">
                        {companyData.sector && companyData.sector !== null && (
                          <span className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-blue-200 shadow-sm font-medium">
                            📊 {companyData.sector}
                          </span>
                        )}
                        {companyData.industry && companyData.industry !== null && (
                          <span className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-blue-200 shadow-sm font-medium">
                            🏭 {companyData.industry}
                          </span>
                        )}
                        {companyData.employees && companyData.employees !== null && (
                          <span className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-blue-200 shadow-sm font-medium">
                            👥 {companyData.employees.toLocaleString()} employees
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Enhanced Price Display */}
                    <div className="text-right bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-blue-100">
                              <div className="text-5xl font-bold text-gray-900 mb-3">
          {typeof companyData.price === 'number' ? `$${companyData.price.toFixed(2)}` : '—'}
        </div>
                      {companyData.change !== undefined && (
                        <div className={`text-2xl font-bold ${companyData.change >= 0 ? 'text-green-600' : 'text-red-600'} mb-2`}>
                          {companyData.change >= 0 ? '↗' : '↘'} {companyData.change >= 0 ? '+' : ''}{companyData.change.toFixed(2)}
                                                      <span className="text-xl ml-2">({fmtPercent(companyData.changePercent)})</span>
                        </div>
                      )}
                      {companyData.volume && (
                        <div className="text-lg text-gray-600 font-medium">
                          📈 Volume: {companyData.volume >= 1e6 ? `${(companyData.volume / 1e6).toFixed(1)}M` : companyData.volume >= 1e3 ? `${(companyData.volume / 1e3).toFixed(1)}K` : companyData.volume.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Company Description - Enhanced */}
                  {companyData.description && (
                    <div className="mt-8 p-6 bg-white/80 backdrop-blur-sm rounded-xl border border-blue-100 shadow-sm">
                      <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <span className="w-2 h-6 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></span>
                        About {companyData.name}
                      </h4>
                      <p className="text-gray-700 leading-relaxed text-lg">{companyData.description}</p>
                </div>
                  )}
                  
                  {/* Enhanced Website Link */}
                  {companyData.website && (
                    <div className="mt-6">
                      <a
                        href={companyData.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-xl border border-blue-200 text-blue-700 hover:text-blue-900 font-semibold hover:shadow-lg transition-all duration-200 hover:scale-105"
                      >
                        🌐 Visit Company Website
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
              </div>
            )}
                </div>

                {/* Stock Chart */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-gray-900">Price Chart</h3>
                    <div className="text-sm text-gray-600">
                      Real-time data powered by Polygon.io
                    </div>
                  </div>
                  <div className="h-96">
                    <AGStockChart 
                      ticker={companyData.symbol} 
                      range={chartPeriod === '1M' ? '1M' : chartPeriod === '3M' ? '3M' : chartPeriod === '1Y' ? '1Y' : '1Y'} 
                      height={384}
                    />
                  </div>
                  

                </div>

                {/* Financial Metrics Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Valuation & Ratios */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="w-2 h-6 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></span>
                      Valuation & Ratios
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Market Cap</span>
                        <span className="font-semibold">{fmtCompact(companyData.marketCap)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">P/E Ratio</span>
                        <span className="font-semibold">{companyData.pe ? companyData.pe.toFixed(2) : '—'}</span>
                      </div>
                      {hasNum(companyData.forwardPE) && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600">Forward P/E</span>
                          <span className="font-semibold">{companyData.forwardPE!.toFixed(2)}</span>
                        </div>
                      )}
                      {hasNum(companyData.peg) && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600">PEG Ratio</span>
                          <span className="font-semibold">{companyData.peg!.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Price to Book</span>
                        <span className="font-semibold">{companyData.priceToBook ? companyData.priceToBook.toFixed(2) : '—'}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600">Price to Sales (TTM)</span>
                        <span className="font-semibold">{companyData.priceToSales ? companyData.priceToSales.toFixed(2) : '—'}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Financials TTM */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="w-2 h-6 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></span>
                      Financials TTM
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Revenue (TTM)</span>
                        <span className="font-semibold">{fmtCurrency(companyData.revenueTTM)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Gross Profit (TTM)</span>
                        <span className="font-semibold">{fmtCurrency(companyData.grossProfitTTM)}</span>
                      </div>
                      {hasNum(companyData.ebitdaTTM) && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600">EBITDA (TTM)</span>
                          <span className="font-semibold">{fmtCurrency(companyData.ebitdaTTM)}</span>
                        </div>
                      )}
                      {hasNum(companyData.netIncomeTTM) && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600">Net Income (TTM)</span>
                          <span className="font-semibold">{fmtCurrency(companyData.netIncomeTTM)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Free Cash Flow (TTM)</span>
                        <span className="font-semibold">{fmtCurrency(companyData.freeCashFlowTTM)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600">Operating Cash Flow (TTM)</span>
                        <span className="font-semibold">{fmtCurrency(companyData.operatingCashFlowTTM)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Financial Metrics */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Profitability & Margins */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Profitability & Margins</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Gross Margin</span>
                        <span className="font-semibold">{companyData.grossMargin ? fmtPercent(companyData.grossMargin) : '—'}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Operating Margin</span>
                        <span className="font-semibold">{companyData.operatingMargin ? fmtPercent(companyData.operatingMargin) : '—'}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600">Net Margin</span>
                        <span className="font-semibold">{companyData.netMargin ? fmtPercent(companyData.netMargin) : '—'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Balance Sheet & Liquidity */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Balance Sheet & Liquidity</h3>
                    <div className="space-y-3">
                      {hasNum(companyData.totalDebt) && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600">Total Debt</span>
                          <span className="font-semibold">{fmtCurrency(companyData.totalDebt)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Debt to Equity</span>
                        <span className="font-semibold">{companyData.debtToEquity ? companyData.debtToEquity.toFixed(2) : '—'}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600">Current Ratio</span>
                        <span className="font-semibold">{companyData.currentRatio ? companyData.currentRatio.toFixed(2) : '—'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Dividends */}
                  {((hasNum(companyData.dividendYield) && companyData.dividendYield! > 0) || (hasNum(companyData.annualDividend) && companyData.annualDividend! > 0) || (hasNum(companyData.payoutRatio) && companyData.payoutRatio! > 0)) && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Dividends</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Dividend Yield</span>
                        <span className="font-semibold">{companyData.dividendYield ? fmtPercent(companyData.dividendYield) : '—'}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Annual Dividend</span>
                        <span className="font-semibold">{fmtCurrency(typeof companyData.annualDividend === 'number' && companyData.annualDividend > 0 ? companyData.annualDividend : companyData.dividend)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600">Payout Ratio</span>
                        <span className="font-semibold">{companyData.payoutRatio ? fmtPercent(companyData.payoutRatio) : '—'}</span>
                      </div>
                    </div>
                  </div>
                  )}
                </div>

                {/* Performance & Technical */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Performance */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Performance</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">52 Week High</span>
                        <span className="font-semibold">{fmtCurrency(companyData.fiftyTwoWeekHigh)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">52 Week Low</span>
                        <span className="font-semibold">{fmtCurrency(companyData.fiftyTwoWeekLow)}</span>
                      </div>
                      {hasNum(companyData.ytdReturn) && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600">YTD Return</span>
                          <span className="font-semibold">{fmtPercent(companyData.ytdReturn)}</span>
                        </div>
                      )}
                      {hasNum(companyData.oneYearReturn) && (
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-600">1 Year Return</span>
                          <span className="font-semibold">{fmtPercent(companyData.oneYearReturn)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Company Details */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Company Details</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Country</span>
                        <span className="font-semibold">{companyData.country || '—'}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Exchange</span>
                        <span className="font-semibold">{companyData.exchange || '—'}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Currency</span>
                        <span className="font-semibold">{companyData.currency || '—'}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600">IPO Date</span>
                        <span className="font-semibold">{companyData.ipoDate ? fmtDate(companyData.ipoDate) : '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Advanced Metrics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Advanced Valuation */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Advanced Valuation</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">EV to EBITDA</span>
                        <span className="font-semibold">{companyData.evToEbitda ? companyData.evToEbitda.toFixed(2) : '—'}</span>
                      </div>
                      {hasNum(companyData.bookValuePerShare) && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600">Book Value Per Share</span>
                          <span className="font-semibold">{fmtCurrency(companyData.bookValuePerShare)}</span>
                        </div>
                      )}
                       <div className="flex justify-between items-center py-2 border-b border-gray-100">
                         <span className="text-gray-600">Enterprise Value Multiple</span>
                         <span className="font-semibold">{companyData.enterpriseValueMultiple ? companyData.enterpriseValueMultiple.toFixed(2) : '—'}</span>
                       </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600">Beta</span>
                        <span className="font-semibold">{companyData.beta ? companyData.beta.toFixed(2) : '—'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Financial Ratios */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Financial Ratios</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Quick Ratio</span>
                        <span className="font-semibold">{companyData.quickRatio ? companyData.quickRatio.toFixed(2) : '—'}</span>
                      </div>
                      {hasNum(companyData.cashRatio) && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600">Cash Ratio</span>
                          <span className="font-semibold">{companyData.cashRatio!.toFixed(2)}</span>
                        </div>
                      )}
                                             <div className="flex justify-between items-center py-2 border-b border-gray-100">
                         <span className="text-gray-600">Interest Coverage</span>
                         <span className="font-semibold">{companyData.interestCoverageRatio ? companyData.interestCoverageRatio.toFixed(2) : '—'}</span>
                       </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600">Asset Turnover</span>
                        <span className="font-semibold">{companyData.assetTurnover ? companyData.assetTurnover.toFixed(2) : '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                                 {/* Company Details - Additional Info */}
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   {/* Company Details */}
                   <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                     <h3 className="text-xl font-bold text-gray-900 mb-4">Company Details</h3>
                     <div className="space-y-3">
                       <div className="flex justify-between items-center py-2 border-b border-gray-100">
                         <span className="text-gray-600">CEO</span>
                         <span className="font-semibold">{companyData.ceo || '—'}</span>
                       </div>
                       <div className="flex justify-between items-center py-2 border-b border-gray-100">
                         <span className="text-gray-600">Phone</span>
                         <span className="font-semibold">{companyData.phone || '—'}</span>
                       </div>
                       <div className="flex justify-between items-center py-2 border-b border-gray-100">
                         <span className="text-gray-600">Address</span>
                         <span className="font-semibold">{companyData.address || '—'}</span>
                       </div>
                       <div className="flex justify-between items-center py-2">
                         <span className="text-gray-600">City, State</span>
                         <span className="font-semibold">{companyData.cityState || '—'}</span>
                       </div>
                     </div>
                   </div>

                   {/* Additional Metrics */}
                   <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                     <h3 className="text-xl font-bold text-gray-900 mb-4">Additional Metrics</h3>
                     <div className="space-y-3">
                       <div className="flex justify-between items-center py-2 border-b border-gray-100">
                         <span className="text-gray-600">Average Volume</span>
                         <span className="font-semibold">{companyData.averageVolume ? fmtCompact(companyData.averageVolume) : '—'}</span>
                       </div>
                       <div className="flex justify-between items-center py-2 border-b border-gray-100">
                         <span className="text-gray-600">CIK</span>
                         <span className="font-semibold">{companyData.cik || '—'}</span>
                       </div>
                       <div className="flex justify-between items-center py-2 border-b border-gray-100">
                         <span className="text-gray-600">ISIN</span>
                         <span className="font-semibold">{companyData.isin || '—'}</span>
                       </div>
                       <div className="flex justify-between items-center py-2">
                         <span className="text-gray-600">CUSIP</span>
                         <span className="font-semibold">{companyData.cusip || '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* No Data State */}
            {!companyData && hasSearched && (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No data found</h3>
                <p className="text-gray-600">Try searching for a different stock ticker.</p>
              </div>
            )}

            {/* Initial State */}
            {!companyData && !hasSearched && (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Search for a stock</h3>
                <p className="text-gray-600">Enter a stock ticker above to get started.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}