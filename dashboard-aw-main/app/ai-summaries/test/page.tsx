"use client"
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Minus, Brain, Sparkles, Search, Filter, BarChart3, Target, Zap } from "lucide-react";

export default function AISummariesTestPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [sentimentFilter, setSentimentFilter] = useState<string>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');

    const [mockData] = useState([
        {
            _id: "1",
            title: "Tesla Q4 Earnings Beat Expectations",
            summary: "Tesla reported strong Q4 earnings with revenue growth of 25% year-over-year, exceeding analyst estimates.",
            ai_summary: "Tesla's Q4 performance exceeded market expectations, showing robust revenue growth and strong demand for electric vehicles. The company's strategic positioning in the EV market continues to strengthen, with expanding production capacity and international market penetration.",
            sentiment: 0.8,
            categories: ["Technology", "Automotive", "Earnings"],
            source: "Bloomberg",
            date: Date.now() / 1000,
            url: "#"
        },
        {
            _id: "2",
            title: "Federal Reserve Signals Potential Rate Cuts",
            summary: "The Fed indicated possible interest rate reductions in response to economic data showing cooling inflation.",
            ai_summary: "Federal Reserve officials are considering interest rate cuts as economic indicators suggest a cooling economy. This could provide relief to borrowers and stimulate economic activity, though the timing remains uncertain.",
            sentiment: -0.2,
            categories: ["Economy", "Federal Reserve", "Interest Rates"],
            source: "Reuters",
            date: Date.now() / 1000,
            url: "#"
        },
        {
            _id: "3",
            title: "AI Technology Breakthrough in Healthcare",
            summary: "New AI algorithms show promise in early disease detection with 95% accuracy rates.",
            ai_summary: "Revolutionary AI technology demonstrates exceptional accuracy in early disease detection, potentially transforming healthcare diagnostics and improving patient outcomes significantly. The breakthrough could lead to earlier intervention and better treatment success rates.",
            sentiment: 0.9,
            categories: ["Healthcare", "AI", "Technology"],
            source: "TechCrunch",
            date: Date.now() / 1000,
            url: "#"
        },
        {
            _id: "4",
            title: "Global Supply Chain Disruptions Continue",
            summary: "Ongoing supply chain issues affecting multiple industries worldwide.",
            ai_summary: "Persistent global supply chain disruptions continue to impact various industries, leading to increased costs and delivery delays. Companies are implementing alternative strategies to mitigate these challenges.",
            sentiment: -0.6,
            categories: ["Supply Chain", "Global Trade", "Business"],
            source: "Wall Street Journal",
            date: Date.now() / 1000,
            url: "#"
        },
        {
            _id: "5",
            title: "Renewable Energy Investment Surges",
            summary: "Global investment in renewable energy reached record levels in 2024.",
            ai_summary: "Global renewable energy investment has reached unprecedented levels, driven by climate commitments and technological advancements. This surge reflects a fundamental shift toward sustainable energy solutions.",
            sentiment: 0.7,
            categories: ["Energy", "Sustainability", "Investment"],
            source: "Financial Times",
            date: Date.now() / 1000,
            url: "#"
        }
    ]);

    const getSentimentDisplay = (sentiment: number) => {
        if (sentiment > 0.1) return { 
            icon: TrendingUp, 
            color: "text-green-600", 
            bg: "bg-green-100", 
            text: "Positive"
        };
        if (sentiment < -0.1) return { 
            icon: TrendingDown, 
            color: "text-red-600", 
            bg: "bg-red-100", 
            text: "Negative"
        };
        return { 
            icon: Minus, 
            color: "text-gray-600", 
            bg: "bg-gray-100", 
            text: "Neutral"
        };
    };

    const filteredData = mockData.filter(news => {
        const matchesSearch = news.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            news.ai_summary.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSentiment = sentimentFilter === 'all' || 
            (sentimentFilter === 'positive' && news.sentiment > 0.1) ||
            (sentimentFilter === 'negative' && news.sentiment < -0.1) ||
            (sentimentFilter === 'neutral' && news.sentiment >= -0.1 && news.sentiment <= 0.1);
        const matchesCategory = categoryFilter === 'all' || news.categories.includes(categoryFilter);
        
        return matchesSearch && matchesSentiment && matchesCategory;
    });

    const stats = {
        total: mockData.length,
        positive: mockData.filter(n => n.sentiment > 0.1).length,
        negative: mockData.filter(n => n.sentiment < -0.1).length,
        neutral: mockData.filter(n => n.sentiment >= -0.1 && n.sentiment <= 0.1).length,
        averageSentiment: mockData.reduce((sum, n) => sum + n.sentiment, 0) / mockData.length
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
                        <Brain className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold">AI Summaries Test Page</h1>
                </div>
                <p className="text-gray-600 text-lg">Testing AI summaries and sentiment analysis display with mock data</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Articles</p>
                                <p className="text-2xl font-bold">{stats.total}</p>
                            </div>
                            <Brain className="w-8 h-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Positive</p>
                                <p className="text-2xl font-bold text-green-600">{stats.positive}</p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Negative</p>
                                <p className="text-2xl font-bold text-red-600">{stats.negative}</p>
                            </div>
                            <TrendingDown className="w-8 h-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Neutral</p>
                                <p className="text-2xl font-bold text-gray-600">{stats.neutral}</p>
                            </div>
                            <Minus className="w-8 h-8 text-gray-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Avg Sentiment</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {(stats.averageSentiment * 100).toFixed(1)}%
                                </p>
                            </div>
                            <BarChart3 className="w-8 h-8 text-purple-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        Filters & Search
                    </CardTitle>
                    <CardDescription>Filter and search through AI-processed news</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="Search AI summaries..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
                            <SelectTrigger className="w-40">
                                <Filter className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="Sentiment" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Sentiments</SelectItem>
                                <SelectItem value="positive">Positive</SelectItem>
                                <SelectItem value="negative">Negative</SelectItem>
                                <SelectItem value="neutral">Neutral</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-40">
                                <Filter className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {Array.from(new Set(mockData.flatMap(n => n.categories))).map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Results Count */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">AI-Processed News ({filteredData.length} results)</h2>
                <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Showing filtered results</span>
                </div>
            </div>

            {/* News List */}
            <div className="space-y-4">
                {filteredData.map((news) => {
                    const sentimentInfo = getSentimentDisplay(news.sentiment);
                    return (
                        <Card key={news._id} className="hover:shadow-lg transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-xl mb-3 text-gray-900">{news.title}</h3>
                                        
                                        {/* AI Summary */}
                                        <div className="mb-4">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Sparkles className="w-5 h-5 text-purple-500" />
                                                <span className="text-sm font-medium text-purple-700">AI Summary</span>
                                                <Badge variant="secondary" className="text-xs">AI Generated</Badge>
                                            </div>
                                            <p className="text-gray-700 bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border-l-4 border-purple-400">
                                                {news.ai_summary}
                                            </p>
                                        </div>

                                        {/* Original Summary */}
                                        <div className="mb-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-sm font-medium text-gray-700">Original Summary</span>
                                            </div>
                                            <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                                                {news.summary}
                                            </p>
                                        </div>

                                        {/* Meta Information */}
                                        <div className="flex items-center gap-6 text-sm text-gray-500">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">Source:</span>
                                                <Badge variant="outline">{news.source}</Badge>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">Date:</span>
                                                <span>{new Date(news.date * 1000).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-4 ml-6">
                                        {/* Sentiment Analysis */}
                                        <div className="text-center">
                                            <div className="flex items-center gap-2 mb-2">
                                                <sentimentInfo.icon className={`w-6 h-6 ${sentimentInfo.color}`} />
                                                <Badge className={`${sentimentInfo.bg} ${sentimentInfo.color} text-sm font-medium`}>
                                                    {sentimentInfo.text}
                                                </Badge>
                                            </div>
                                            <div className="text-2xl font-bold text-gray-900">
                                                {(Math.abs(news.sentiment * 100)).toFixed(0)}%
                                            </div>
                                            <div className="text-xs text-gray-500">Intensity</div>
                                        </div>

                                        {/* Categories */}
                                        <div className="text-center">
                                            <div className="text-sm font-medium text-gray-700 mb-2">Categories</div>
                                            <div className="flex flex-col gap-1">
                                                {news.categories.map((category, index) => (
                                                    <Badge key={index} variant="outline" className="text-xs">
                                                        {category}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col gap-2">
                                            <Button size="sm" variant="outline" className="w-full">
                                                <Zap className="w-4 h-4 mr-2" />
                                                AI Insights
                                            </Button>
                                            <Button size="sm" className="w-full">
                                                Read Full Article
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
                
                {filteredData.length === 0 && (
                    <Card>
                        <CardContent className="p-8 text-center">
                            <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
                            <p className="text-gray-500">Try adjusting your search terms or filters</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

