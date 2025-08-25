'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { AgCharts } from 'ag-charts-react'
import { AgChartOptions } from 'ag-charts-community'

interface StockChartProps {
  ticker: string
  range: string
  interval?: string
  height?: number
}

interface ChartData {
  date: Date
  close: number
  dateString: string
}

export default function AGStockChart({ ticker, range, interval = '1d', height = 400 }: StockChartProps) {
  const [data, setData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dataPoints, setDataPoints] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        console.log(`🔄 Fetching chart data for ${ticker} (${range})...`)
        
        // Use the proper Polygon API route for chart data
        const response = await fetch(`/api/polygon/chart?ticker=${ticker}&range=${range}`)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Failed to fetch chart data`)
        }
        
        const result = await response.json()
        
        if (!result.success) {
          throw new Error(result.error || 'API returned error')
        }
        
        console.log(`✅ Chart API response:`, result.data?.meta)
        
        // Transform the Polygon data for AG Charts
        if (result.data && result.data.quotes && Array.isArray(result.data.quotes)) {
          const chartData: ChartData[] = result.data.quotes
            .filter((quote: any) => quote.date && quote.close != null)
            .map((quote: any) => ({
              date: new Date(quote.date),
              close: parseFloat(quote.close) || 0,
              dateString: quote.date
            }))
            .filter((item: ChartData) => item.close > 0)
            .sort((a, b) => a.date.getTime() - b.date.getTime()) // Ensure chronological order
          
          console.log(`📊 Processed ${chartData.length} data points for ${ticker}`)
          setData(chartData)
          setDataPoints(chartData.length)
        } else {
          console.warn('⚠️ No quotes data in API response')
          setData([])
          setDataPoints(0)
        }
        
      } catch (err) {
        console.error('❌ Error fetching chart data:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setData([])
        setDataPoints(0)
      } finally {
        setLoading(false)
      }
    }

    if (ticker) {
      fetchData()
    }
  }, [ticker, range, interval])

  // AG Charts configuration
  const chartOptions: AgChartOptions = useMemo(() => ({
    data: data,
    title: {
      text: `${ticker} - ${range}`,
      fontSize: 18,
      fontWeight: 'bold',
      color: '#1f2937',
    },
    subtitle: {
      text: `${dataPoints} data points from Polygon.io`,
      fontSize: 12,
      color: '#6b7280',
    },
    series: [
      {
        type: 'line',
        xKey: 'date',
        yKey: 'close',
        yName: 'Price',
        stroke: '#3b82f6',
        strokeWidth: 2,
        marker: {
          enabled: false, // Disable markers for cleaner look with many data points
        },
        tooltip: {
          renderer: ({ datum, yKey }) => {
            const date = new Date(datum.date)
            const formattedDate = date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })
            const price = datum[yKey]
            return {
              title: `${ticker}`,
              content: `${formattedDate}: $${price?.toFixed(2) || 'N/A'}`,
            }
          },
        },
      },
    ],
    axes: [
      {
        type: 'time',
        position: 'bottom',
        title: {
          text: 'Date',
          fontSize: 12,
          color: '#6b7280',
        },
        label: {
          fontSize: 10,
          color: '#6b7280',
          rotation: 0,
        },
        line: {
          color: '#e5e7eb',
        },
        tick: {
          color: '#e5e7eb',
        },
        gridLine: {
          style: [
            {
              stroke: '#f3f4f6',
              lineDash: [2, 2],
            },
          ],
        },
      },
      {
        type: 'number',
        position: 'left',
        title: {
          text: 'Price ($)',
          fontSize: 12,
          color: '#6b7280',
        },
        label: {
          fontSize: 10,
          color: '#6b7280',
          formatter: ({ value }) => `$${value?.toFixed(2) || '0.00'}`,
        },
        line: {
          color: '#e5e7eb',
        },
        tick: {
          color: '#e5e7eb',
        },
        gridLine: {
          style: [
            {
              stroke: '#f3f4f6',
              lineDash: [2, 2],
            },
          ],
        },
      },
    ],
    background: {
      fill: '#ffffff',
    },
    padding: {
      top: 20,
      right: 20,
      bottom: 40,
      left: 60,
    },
    height: height,
  }), [data, ticker, range, dataPoints, height])

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-gray-50 rounded-lg border" style={{ height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <div className="text-gray-600 font-medium">Loading {ticker} chart...</div>
          <div className="text-gray-500 text-sm mt-1">Fetching data from Polygon.io</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center bg-red-50 rounded-lg border-2 border-dashed border-red-300" style={{ height }}>
        <div className="text-center p-6">
          <div className="text-red-500 text-2xl mb-2">⚠️</div>
          <div className="text-red-600 font-semibold mb-1">Chart Error</div>
          <div className="text-red-500 text-sm mb-3">{error}</div>
          <div className="text-gray-500 text-xs">
            Unable to load chart data for {ticker}
          </div>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300" style={{ height }}>
        <div className="text-center p-6">
          <div className="text-gray-400 text-2xl mb-2">📊</div>
          <div className="text-gray-600 font-semibold mb-1">No Data Available</div>
          <div className="text-gray-500 text-sm mb-3">
            No chart data found for {ticker} ({range})
          </div>
          <div className="text-gray-400 text-xs">
            Try selecting a different time range or symbol
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow-sm border">
        <AgCharts options={chartOptions} />
      </div>
      
      {/* Chart Info Footer */}
      <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
        <div>
          📈 {dataPoints} data points • Real-time data from Polygon.io
        </div>
        <div>
          Range: {range} • Symbol: {ticker}
        </div>
      </div>
    </div>
  )
}
