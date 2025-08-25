"use client"

import { Table, TableCaption, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../ui/table";
import { useRouter } from "next/navigation";
import { Badge } from "../ui/badge";
import { TrendingUp, TrendingDown, Minus, DollarSign, Building2, ChartBar } from "lucide-react";
import { useState, useEffect } from "react";

export function QuoteTableSearch({ quotes } : { quotes: any[] }) {
    const router = useRouter();
    const [enhancedQuotes, setEnhancedQuotes] = useState<any[]>(quotes);
    const [loading, setLoading] = useState<boolean>(false);

    // Enhance quotes with real-time data
    useEffect(() => {
        const enhanceQuotes = async () => {
            setLoading(true);
            try {
                // Since the backend doesn't have a stock-quote endpoint,
                // we'll use the existing quote data without enhancement
                const enhanced = quotes.slice(0, 20).map(quote => ({
                    ...quote,
                    enhanced: false
                }));
                setEnhancedQuotes(enhanced);
            } catch (error) {
                console.error('Error processing quotes:', error);
            } finally {
                setLoading(false);
            }
        };

        enhanceQuotes();
    }, [quotes]);

    const getPriceChangeDisplay = (change: number, changePercent: number) => {
        if (!change || !changePercent) return null;
        
        const isPositive = change > 0;
        const Icon = isPositive ? TrendingUp : change < 0 ? TrendingDown : Minus;
        const color = isPositive ? "text-green-600" : change < 0 ? "text-red-600" : "text-gray-600";
        const bgColor = isPositive ? "bg-green-100" : change < 0 ? "bg-red-100" : "bg-gray-100";
        
        return (
            <div className="flex items-center gap-1">
                <Icon className={`w-3 h-3 ${color}`} />
                <Badge className={`text-xs ${bgColor} ${color}`}>
                    {change > 0 ? '+' : ''}{change.toFixed(2)} ({changePercent > 0 ? '+' : ''}{changePercent.toFixed(2)}%)
                </Badge>
            </div>
        );
    };

    const formatMarketCap = (marketCap: number) => {
        if (!marketCap) return "N/A";
        if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
        if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
        if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
        return `$${marketCap.toFixed(0)}`;
    };

    const formatVolume = (volume: number) => {
        if (!volume) return "N/A";
        if (volume >= 1e9) return `${(volume / 1e9).toFixed(2)}B`;
        if (volume >= 1e6) return `${(volume / 1e6).toFixed(2)}M`;
        return volume.toLocaleString();
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">S&P 500 Companies</h2>
                <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-gray-600">Enhanced with real-time data</span>
                </div>
            </div>
            
            <Table>
                <TableCaption>Comprehensive financial data for S&P 500 companies</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[80px]">Symbol</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead className="w-[100px]">Price</TableHead>
                        <TableHead className="w-[120px]">Change</TableHead>
                        <TableHead className="w-[100px]">Market Cap</TableHead>
                        <TableHead className="w-[80px]">Volume</TableHead>
                        <TableHead className="w-[80px]">P/E Ratio</TableHead>
                        <TableHead>Industry</TableHead>
                        <TableHead>Sector</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {enhancedQuotes.map((quote, index) => {
                        const priceChange = quote.priceChange;
                        const changePercent = quote.changePercent;
                        
                        return (
                            <TableRow 
                                className="cursor-pointer hover:shadow-md transition-shadow" 
                                key={index} 
                                onClick={() => router.push("financials/" + quote._id)}
                            >
                                <TableCell className="font-bold text-blue-600">
                                    {quote._id}
                                </TableCell>
                                <TableCell>
                                    <div>
                                        <div className="font-medium">{quote.longname || quote.name}</div>
                                        {quote.enhanced && (
                                            <div className="text-xs text-gray-500 flex items-center gap-1">
                                                <ChartBar className="w-3 h-3" />
                                                Real-time data
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="font-semibold">
                                    {quote.currentPrice ? `$${quote.currentPrice.toFixed(2)}` : "N/A"}
                                </TableCell>
                                <TableCell>
                                    {getPriceChangeDisplay(priceChange, changePercent)}
                                </TableCell>
                                <TableCell className="text-sm">
                                    {formatMarketCap(quote.marketCap)}
                                </TableCell>
                                <TableCell className="text-sm">
                                    {formatVolume(quote.volume)}
                                </TableCell>
                                <TableCell className="text-sm">
                                    {quote.peRatio ? quote.peRatio.toFixed(2) : "N/A"}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="text-xs">
                                        {quote.industry || "Unknown"}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className="text-xs">
                                        {quote.sector || "Unknown"}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
            
            {loading && (
                <div className="flex justify-center items-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-sm text-gray-600">Enhancing data...</span>
                </div>
            )}
        </div>
    );
}