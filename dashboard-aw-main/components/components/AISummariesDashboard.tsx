"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
    RefreshCw, 
    ExternalLink, 
    TrendingUp, 
    TrendingDown, 
    Minus, 
    Search, 
    Filter, 
    Calendar, 
    Globe, 
    Brain, 
    BarChart3,
    Eye,
    Clock,
    Zap,
    Loader2,
    AlertCircle,
    CheckCircle
} from "lucide-react";

interface NewsArticle {
    _id: string;
    title: string;
    summary: string;
    source: string;
    category: string;
    sentiment_score: number;
    sentiment_label: string;
    published_at: string;
    url: string;
    ai_summary?: string;
    ai_sentiment_analysis?: string;
    // AI-specific fields
    ai_sentiment_score?: number;
    ai_sentiment_label?: string;
    ai_summary_timestamp?: string;
    ai_sentiment_timestamp?: string;
}

interface DashboardStats {
    totalArticles: number;
    positiveSentiment: number;
    negativeSentiment: number;
    neutralSentiment: number;
    averageSentiment: number;
    topCategories: Array<{ name: string; count: number }>;
    aiProcessed: number;
}

type TimeFilter = '1d' | '3d' | '1m' | '3m' | '6m' | '1y' | 'all';

export function AISummariesDashboard() {
    // News data state - following news page pattern
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Filter states
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedSentiment, setSelectedSentiment] = useState("all");
    const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [hasSearched, setHasSearched] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    
    // Pagination state - exactly like news page
    const [currentPage, setCurrentPage] = useState(1);
    const [totalArticles, setTotalArticles] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const MAX_RETRIES = 3;
    
    // Spinner state for stable loading indicator
    const [showFetchSpinner, setShowFetchSpinner] = useState(false);
    useEffect(() => {
        if (isLoadingMore) {
            setShowFetchSpinner(true);
            return;
        }
        const t = setTimeout(() => setShowFetchSpinner(false), 400);
        return () => clearTimeout(t);
    }, [isLoadingMore]);
    
    // Refs for infinite scroll - exactly like news page
    const newsRef = useRef(news);
    const hasMoreRef = useRef(hasMore);
    const currentPageRef = useRef(currentPage);
    const loadMoreRef = useRef<HTMLDivElement>(null);
    
    // Update refs when state changes
    useEffect(() => {
        newsRef.current = news;
    }, [news]);
    
    useEffect(() => {
        hasMoreRef.current = hasMore;
    }, [hasMore]);
    
    useEffect(() => {
        currentPageRef.current = currentPage;
    }, [currentPage]);
    
    const isInfiniteScrollReady = hasMore && !hasSearched && news.length > 0 && !loading;

    // Fetch AI-processed news from API - exactly like news page
    const fetchAINews = useCallback(async (pageSize: number, nextPageNumber: number, cursorParam?: any): Promise<{ articles: NewsArticle[], pagination: any } | null> => {
        try {
            const params = new URLSearchParams({ 
                limit: pageSize.toString(), 
                page: nextPageNumber.toString() 
            });

            // Add cursor if available
            if (cursorParam) {
                if (typeof cursorParam === 'string') {
                    params.append('cursor', cursorParam);
                } else if (typeof cursorParam === 'object' && cursorParam.cursor) {
                    params.append('cursor', cursorParam.cursor);
                }
            }

            const response = await fetch(`/api/news?${params.toString()}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (result && result.success && result.data) {
                // Transform and filter for AI-processed articles only
                const allArticles = result.data.map((article: any) => ({
                    _id: article._id || article.unique_id || Math.random().toString(36).substr(2, 9),
                    title: article.title || 'Untitled',
                    summary: article.summary || '',
                    source: article.source || article.api_source || 'Unknown',
                    category: article.category || 'general',
                    sentiment_score: article.sentiment_score || 0,
                    sentiment_label: article.sentiment_label || '',
                    published_at: article.published_at || article.fetched_at || new Date().toISOString(),
                    url: article.url || '#',
                    ai_summary: article.ai_summary || '',
                    ai_sentiment_analysis: article.ai_sentiment_analysis || '',
                    ai_sentiment_score: article.ai_sentiment_score || article.sentiment_score || 0,
                    ai_sentiment_label: article.ai_sentiment_label || article.sentiment_label || '',
                    ai_summary_timestamp: article.ai_summary_timestamp || '',
                    ai_sentiment_timestamp: article.ai_sentiment_timestamp || ''
                }));

                // Sort articles to prioritize AI-processed ones, but include all
                const sortedArticles = allArticles.sort((a: NewsArticle, b: NewsArticle) => {
                    // AI-processed articles first
                    const aHasAI = (a.ai_summary && a.ai_summary.trim() !== '') || 
                                   (a.ai_sentiment_analysis && a.ai_sentiment_analysis.trim() !== '') ||
                                   (a.ai_sentiment_score && Math.abs(a.ai_sentiment_score) > 0.1);
                    const bHasAI = (b.ai_summary && b.ai_summary.trim() !== '') || 
                                   (b.ai_sentiment_analysis && b.ai_sentiment_analysis.trim() !== '') ||
                                   (b.ai_sentiment_score && Math.abs(b.ai_sentiment_score) > 0.1);
                    
                    if (aHasAI && !bHasAI) return -1;
                    if (!aHasAI && bHasAI) return 1;
                    
                    // Then by date (newest first)
                    return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
                });

                return {
                    articles: sortedArticles,
                    pagination: result.pagination || {}
                };
            }
        } catch (error) {
            console.error('Error fetching AI news:', error);
        }
        return null;
    }, []);

    // Load more AI news - exactly like news page
    const loadMoreNews = useCallback(async () => {
        if (isLoadingMore || !hasMoreRef.current) return;

        if (searchTerm.trim() && hasSearched) {
            setHasMore(false);
            return;
        }

        if (!Array.isArray(newsRef.current) || newsRef.current.length === 0) {
            return;
        }

        try {
            setIsLoadingMore(true);
            setLoadMoreError(null);
            const nextPage = currentPageRef.current + 1;
            const pageSize = 100;

            const results = await fetchAINews(pageSize, nextPage, nextCursor);

            if (results && results.articles.length > 0) {
                const newArticles = results.articles;
                
                setNews(prevNews => {
                    const existingIds = new Set(prevNews.map(a => a._id));
                    const uniqueNewArticles = newArticles.filter(a => !existingIds.has(a._id));
                    return [...prevNews, ...uniqueNewArticles];
                });

                setNextCursor(results.pagination?.nextCursor ?? null);
                setCurrentPage(nextPage);
                setRetryCount(0);

                // Determine if there are more articles
                const totalFromBackend = results.pagination?.totalArticles ?? totalArticles;
                const backendHasMore = results.pagination?.hasMore;
                const heuristicMore = newArticles.length === pageSize;
                setHasMore(backendHasMore ?? heuristicMore);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error('Error loading more AI news:', error);
            if (retryCount < MAX_RETRIES) {
                const newRetryCount = retryCount + 1;
                setRetryCount(newRetryCount);
                setLoadMoreError(`Failed to load more articles. Retrying... (${newRetryCount}/${MAX_RETRIES})`);
                setTimeout(() => {
                    if (hasMoreRef.current && !isLoadingMore) {
                        loadMoreNews();
                    }
                }, 2000 * newRetryCount);
            } else {
                setLoadMoreError('Failed to load more articles after multiple attempts. Please try refreshing the page.');
                setHasMore(false);
            }
        } finally {
            setIsLoadingMore(false);
        }
    }, [isLoadingMore, searchTerm, hasSearched, nextCursor, totalArticles, retryCount, fetchAINews]);

    // Handle refresh - exactly like news page
    const handleRefresh = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            setNews([]);
            setCurrentPage(1);
            setHasSearched(false);
            setNextCursor(null);
            
            const results = await fetchAINews(100, 1);
            if (results && results.articles.length > 0) {
                setNews(results.articles);
                setLastUpdated(new Date());
                setTotalArticles(results.pagination?.totalArticles || results.articles.length);
                setNextCursor(results.pagination?.nextCursor ?? null);
                
                const backendHasMore = results.pagination?.hasMore;
                const heuristicMore = results.articles.length === 100;
                setHasMore(backendHasMore ?? heuristicMore);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error('Error refreshing AI news:', error);
            setError('Failed to refresh articles. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [fetchAINews]);

    // Initial data fetch - only run once on mount
    useEffect(() => {
        handleRefresh();
    }, []);

    // Infinite scroll setup - exactly like news page
    useEffect(() => {
        if (!isInfiniteScrollReady || !loadMoreRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry.isIntersecting && !isLoadingMore && hasMoreRef.current) {
                    loadMoreNews();
                }
            },
            {
                root: null,
                rootMargin: '0px 0px 400px 0px',
                threshold: 0,
            }
        );

        observer.observe(loadMoreRef.current);

        return () => {
            observer.disconnect();
        };
    }, [isInfiniteScrollReady, isLoadingMore, hasMore, hasSearched, news.length, loadMoreNews]);

    // Format date function to handle various date formats - exactly like news page
    const formatDate = (dateString: string) => {
        try {
            let date: Date;
            
            // Handle compact format like "20250820T162849"
            if (/^\d{8}T\d{6}$/.test(dateString)) {
                const year = dateString.substring(0, 4);
                const month = dateString.substring(4, 6);
                const day = dateString.substring(6, 8);
                const hour = dateString.substring(9, 11);
                const minute = dateString.substring(11, 13);
                const second = dateString.substring(13, 15);
                
                date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second));
            } else {
                // Handle standard ISO format
                date = new Date(dateString);
            }
            
            if (isNaN(date.getTime())) {
                return "Date unavailable";
            }
            
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short'
            });
        } catch (error) {
            console.error('Date parsing error:', error, 'for dateString:', dateString);
            return "Date unavailable";
        }
    };

    // Calculate statistics based on AI sentiment analysis
    const stats = useMemo((): DashboardStats | null => {
        if (!news || news.length === 0) return null;

        const articles = news;
        const totalArticles = articles.length;
        
        // Use AI sentiment scores when available, fall back to original sentiment
        const getAISentimentScore = (article: NewsArticle) => {
            return article.ai_sentiment_score ?? article.sentiment_score ?? 0;
        };

        const positiveSentiment = articles.filter(a => getAISentimentScore(a) > 0.1).length;
        const negativeSentiment = articles.filter(a => getAISentimentScore(a) < -0.1).length;
        const neutralSentiment = articles.filter(a => {
            const score = getAISentimentScore(a);
            return score >= -0.1 && score <= 0.1;
        }).length;
        
        const averageSentiment = articles.reduce((sum, a) => sum + getAISentimentScore(a), 0) / totalArticles;
        const aiProcessed = articles.filter(a => 
            (a.ai_summary && a.ai_summary.trim() !== '') || 
            (a.ai_sentiment_analysis && a.ai_sentiment_analysis.trim() !== '')
        ).length;

        // Count categories
        const categoryCounts: { [key: string]: number } = {};
        articles.forEach(article => {
            const category = article.category || 'general';
            categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });

        const topCategories = Object.entries(categoryCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return {
            totalArticles,
            positiveSentiment,
            negativeSentiment,
            neutralSentiment,
            averageSentiment,
            topCategories,
            aiProcessed
        };
    }, [news]);

    // Filter articles - client-side filtering for search and categories
    const filteredArticles = useMemo(() => {
        if (!news || news.length === 0) return [];

        let filtered = news;

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(article =>
                article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                article.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (article.ai_summary && article.ai_summary.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (article.ai_sentiment_analysis && article.ai_sentiment_analysis.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        // Apply category filter
        if (selectedCategory !== "all") {
            filtered = filtered.filter(article => article.category === selectedCategory);
        }

        // Apply sentiment filter using AI sentiment when available
        if (selectedSentiment !== "all") {
            filtered = filtered.filter(article => {
                const sentimentScore = article.ai_sentiment_score ?? article.sentiment_score ?? 0;
                switch (selectedSentiment) {
                    case "positive":
                        return sentimentScore > 0.1;
                    case "negative":
                        return sentimentScore < -0.1;
                    case "neutral":
                        return sentimentScore >= -0.1 && sentimentScore <= 0.1;
                    default:
                        return true;
                }
            });
        }

        return filtered;
    }, [news, searchTerm, selectedCategory, selectedSentiment]);

    // Get unique categories for filter
    const categories = useMemo(() => {
        if (!news || news.length === 0) return [];
        const uniqueCategories = new Set(news.map((article: NewsArticle) => article.category || 'general'));
        return ['all', ...Array.from(uniqueCategories).sort()] as string[];
    }, [news]);

    const getSentimentColor = (score: number) => {
        if (score > 0.1) return "bg-green-100 text-green-800 border-green-200";
        if (score < -0.1) return "bg-red-100 text-red-800 border-red-200";
        return "bg-gray-100 text-gray-800 border-gray-200";
    };

    const getSentimentIcon = (score: number) => {
        if (score > 0.1) return <TrendingUp className="w-4 h-4" />;
        if (score < -0.1) return <TrendingDown className="w-4 h-4" />;
        return <Minus className="w-4 h-4" />;
    };

    const getTimeFilterLabel = (filter: TimeFilter): string => {
        switch (filter) {
            case '1d': return '1 Day';
            case '3d': return '3 Days';
            case '1m': return '1 Month';
            case '3m': return '3 Months';
            case '6m': return '6 Months';
            case '1y': return '1 Year';
            case 'all': return 'All Time';
            default: return 'All Time';
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center py-16">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <RefreshCw className="w-10 h-10 text-blue-600 animate-spin" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Loading AI-Processed News...</h3>
                    <p className="text-lg text-gray-600">Gathering latest AI-analyzed articles</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center py-16">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-10 h-10 text-red-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Error Loading AI News</h3>
                    <p className="text-lg text-gray-600 mb-6">{error}</p>
                    <Button onClick={handleRefresh} className="gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    if (!news || news.length === 0) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center py-16">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Brain className="w-10 h-10 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">No AI-Processed Articles Found</h3>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
                        No articles with AI summaries or sentiment analysis are currently available. 
                        Check back later as articles are continuously being processed.
                    </p>
                    <Button onClick={handleRefresh} className="gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Statistics Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-blue-800">Total Articles</CardTitle>
                            <BarChart3 className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-900">{stats.totalArticles}</div>
                            <p className="text-xs text-blue-700">Available for analysis</p>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-green-800">Positive Sentiment</CardTitle>
                            <TrendingUp className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-900">{stats.positiveSentiment}</div>
                            <p className="text-xs text-green-700">
                                {((stats.positiveSentiment / stats.totalArticles) * 100).toFixed(1)}% of total
                            </p>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-red-800">Negative Sentiment</CardTitle>
                            <TrendingDown className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-900">{stats.negativeSentiment}</div>
                            <p className="text-xs text-red-700">
                                {((stats.negativeSentiment / stats.totalArticles) * 100).toFixed(1)}% of total
                            </p>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-purple-800">AI Processed</CardTitle>
                            <Brain className="h-4 w-4 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-900">{stats.aiProcessed}</div>
                            <p className="text-xs text-purple-700">
                                {((stats.aiProcessed / stats.totalArticles) * 100).toFixed(1)}% of total
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters and Search */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filters & Search
                    </CardTitle>
                    <CardDescription>
                        Filter articles by category, sentiment, time range, or search terms
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-4">
                        {/* Search and basic filters */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search articles..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {categories.map((category) => (
                                        <SelectItem key={category} value={category}>
                                            {category.charAt(0).toUpperCase() + category.slice(1)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={selectedSentiment} onValueChange={setSelectedSentiment}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Sentiment" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Sentiments</SelectItem>
                                    <SelectItem value="positive">Positive</SelectItem>
                                    <SelectItem value="negative">Negative</SelectItem>
                                    <SelectItem value="neutral">Neutral</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        {/* Time filter and view mode */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Select value={timeFilter} onValueChange={(value: TimeFilter) => setTimeFilter(value)}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Time Range" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1d">1 Day</SelectItem>
                                    <SelectItem value="3d">3 Days</SelectItem>
                                    <SelectItem value="1m">1 Month</SelectItem>
                                    <SelectItem value="3m">3 Months</SelectItem>
                                    <SelectItem value="6m">6 Months</SelectItem>
                                    <SelectItem value="1y">1 Year</SelectItem>
                                    <SelectItem value="all">All Time</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="flex gap-2">
                                <Button
                                    variant={viewMode === "grid" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setViewMode("grid")}
                                >
                                    Grid
                                </Button>
                                <Button
                                    variant={viewMode === "list" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setViewMode("list")}
                                >
                                    List
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Status Indicator */}
            {!loading && news.length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">
                                Loaded {news.length} of {totalArticles} AI-processed articles
                            </span>
                        </div>
                        <div className="text-xs text-blue-600">
                            {hasSearched ? 'Search Results' : 'All AI Articles'}
                            {!hasMore && ' • All articles loaded'}
                        </div>
                    </div>
                </div>
            )}

            {/* Results Summary */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Brain className="w-5 h-5 text-blue-600" />
                        AI-Processed Articles ({filteredArticles.length})
                    </h2>
                    {searchTerm || selectedCategory !== "all" || selectedSentiment !== "all" ? (
                        <Badge variant="secondary" className="gap-2">
                            <Filter className="w-3 h-3" />
                            Filtered
                        </Badge>
                    ) : null}
                    {lastUpdated && (
                        <Badge variant="outline" className="gap-2">
                            <Clock className="w-3 h-3" />
                            Updated {formatDate(lastUpdated.toISOString())}
                        </Badge>
                    )}
                </div>
                <Button onClick={handleRefresh} variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Articles Display */}
            {filteredArticles.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Brain className="h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-500 text-lg">No AI-processed articles found matching your criteria.</p>
                        <p className="text-gray-400 text-sm">Try adjusting your filters or search terms, or check back later for newly processed articles.</p>
                    </CardContent>
                </Card>
            ) : (
                <Tabs defaultValue="articles" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="articles">Articles ({filteredArticles.length})</TabsTrigger>
                        <TabsTrigger value="insights">AI Insights</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="articles" className="space-y-4">
                        {viewMode === "grid" ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredArticles.map((article) => (
                                    <Card key={article._id} className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <Badge variant="outline" className="text-xs">
                                                    {article.category}
                                                </Badge>
                                                <div className="flex items-center gap-1">
                                                    {getSentimentIcon(article.sentiment_score)}
                                                    <Badge 
                                                        variant="outline" 
                                                        className={`text-xs ${getSentimentColor(article.sentiment_score)}`}
                                                    >
                                                        {article.sentiment_label}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <CardTitle className="text-base leading-tight line-clamp-2">
                                                {article.title}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                                {article.summary}
                                            </p>
                                            {article.ai_summary && article.ai_summary.trim() !== '' && (
                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                                                    <div className="flex items-center gap-1 mb-2">
                                                        <Brain className="w-3 h-3 text-blue-600" />
                                                        <span className="text-xs font-medium text-blue-700">AI Summary</span>
                                                    </div>
                                                    <p className="text-xs text-blue-800 line-clamp-3">
                                                        {article.ai_summary}
                                                    </p>
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between text-xs text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <Globe className="w-3 h-3" />
                                                    {article.source}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDate(article.published_at)}
                                                </div>
                                            </div>
                                            <div className="mt-3 flex gap-2">
                                                <Button size="sm" variant="outline" className="flex-1" asChild>
                                                    <a href={article.url} target="_blank" rel="noopener noreferrer">
                                                        <ExternalLink className="w-3 h-3 mr-1" />
                                                        Read Original
                                                    </a>
                                                </Button>
                                                {article.ai_summary && (
                                                    <Button size="sm" variant="secondary" className="flex-1" title="View AI Analysis">
                                                        <Brain className="w-3 h-3 mr-1" />
                                                        AI Details
                                                    </Button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredArticles.map((article) => (
                                    <Card key={article._id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-6">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        <Badge variant="outline">
                                                            {article.category}
                                                        </Badge>
                                                        <div className="flex items-center gap-1">
                                                            {getSentimentIcon(article.sentiment_score)}
                                                            <Badge 
                                                                variant="outline" 
                                                                className={getSentimentColor(article.sentiment_score)}
                                                            >
                                                                {article.sentiment_label}
                                                            </Badge>
                                                        </div>
                                                        {article.ai_summary && (
                                                            <Badge variant="secondary" className="gap-1">
                                                                <Brain className="w-3 h-3" />
                                                                AI Processed
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <h3 className="text-lg font-semibold leading-tight">
                                                        {article.title}
                                                    </h3>
                                                    <p className="text-gray-600 line-clamp-2 mb-2">
                                                        {article.summary}
                                                    </p>
                                                    {article.ai_summary && article.ai_summary.trim() !== '' && (
                                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                                                            <div className="flex items-center gap-1 mb-2">
                                                                <Brain className="w-4 h-4 text-blue-600" />
                                                                <span className="text-sm font-medium text-blue-700">AI Summary</span>
                                                            </div>
                                                            <p className="text-sm text-blue-800 line-clamp-2">
                                                                {article.ai_summary}
                                                            </p>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                                        <div className="flex items-center gap-1">
                                                            <Globe className="w-4 h-4" />
                                                            {article.source}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="w-4 h-4" />
                                                            {formatDate(article.published_at)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button size="sm" variant="outline" asChild>
                                                    <a href={article.url} target="_blank" rel="noopener noreferrer">
                                                        <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                        
                        {/* Infinite Scroll Sentinel and Load More Button - exactly like news page */}
                        {hasMore && !hasSearched && (
                            <>
                                {/* Hidden sentinel for intersection observer */}
                                <div 
                                    ref={loadMoreRef} 
                                    className="h-1 w-full bg-transparent" 
                                    aria-hidden="true"
                                    style={{ marginTop: '-100px' }}
                                />
                                
                                {/* Visible load more button as fallback */}
                                <div className="text-center py-8" aria-live="polite">
                                    <button
                                        onClick={loadMoreNews}
                                        disabled={isLoadingMore}
                                        aria-busy={showFetchSpinner}
                                        className={`px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors inline-flex items-center gap-2 ${
                                            showFetchSpinner ? 'cursor-wait' : 'disabled:opacity-50 disabled:cursor-not-allowed'
                                        }`}
                                    >
                                        {showFetchSpinner ? (
                                            <>
                                                <svg
                                                    className="w-6 h-6 animate-spin"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    aria-hidden="true"
                                                >
                                                    <circle className="opacity-30" cx="12" cy="12" r="10" stroke="white" strokeWidth="3" />
                                                    <path d="M22 12a10 10 0 0 1-10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                                                </svg>
                                                <span>Loading…</span>
                                            </>
                                        ) : (
                                            'Load More AI Articles'
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                        
                        {/* Error Display */}
                        {loadMoreError && (
                            <div className="text-center py-4">
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
                                    <div className="flex items-center gap-2 text-red-800 mb-2">
                                        <AlertCircle className="w-5 h-5" />
                                        <span className="font-medium">Error Loading Articles</span>
                                    </div>
                                    <p className="text-red-700 text-sm mb-3">{loadMoreError}</p>
                                    <div className="flex gap-2 justify-center">
                                        {retryCount < MAX_RETRIES && (
                                            <button
                                                onClick={() => {
                                                    setLoadMoreError(null);
                                                    loadMoreNews();
                                                }}
                                                className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                                            >
                                                Retry Now
                                            </button>
                                        )}
                                        <button
                                            onClick={() => {
                                                setLoadMoreError(null);
                                                setRetryCount(0);
                                                setHasMore(true);
                                            }}
                                            className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
                                        >
                                            Reset
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* End of Articles Indicator */}
                        {!hasMore && news.length > 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <p>You've reached the end of all AI-processed articles!</p>
                                <p className="text-sm mt-2">
                                    Check back later for newly processed articles or use the refresh button above.
                                </p>
                            </div>
                        )}
                    </TabsContent>
                    
                    <TabsContent value="insights" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Brain className="w-5 h-5" />
                                    AI Processing Insights
                                </CardTitle>
                                <CardDescription>
                                    Overview of AI-processed articles and sentiment analysis
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {stats && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                                            <div className="text-2xl font-bold text-blue-600">{stats.aiProcessed}</div>
                                            <div className="text-sm text-blue-600">AI Processed</div>
                                        </div>
                                        <div className="text-center p-4 bg-green-50 rounded-lg">
                                            <div className="text-2xl font-bold text-green-600">
                                                {stats.averageSentiment.toFixed(2)}
                                            </div>
                                            <div className="text-sm text-green-600">Avg Sentiment</div>
                                        </div>
                                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                                            <div className="text-2xl font-bold text-purple-600">
                                                {stats.topCategories[0]?.count || 0}
                                            </div>
                                            <div className="text-sm text-purple-600">Top Category</div>
                                        </div>
                                    </div>
                                )}
                                
                                <Separator />
                                
                                <div>
                                    <h4 className="font-medium mb-3">Top Categories</h4>
                                    <div className="space-y-2">
                                        {stats?.topCategories.map((category) => (
                                            <div key={category.name} className="flex items-center justify-between">
                                                <span className="text-sm">{category.name}</span>
                                                <Badge variant="outline">{category.count}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}

