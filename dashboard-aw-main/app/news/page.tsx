"use client"
import { Suspense } from "react";
import dynamicImport from 'next/dynamic';
import { RefreshCw } from "lucide-react";
import React from "react";
import { fetchNewsMultiSource } from "@/lib/newsService";
import { SidebarProvider } from "@/components/ui/sidebar";
import { SideBar } from "@/components/components/SideBar";
import { NavBar } from "@/components/components/NavBar";
import { Search, TrendingUp, Clock, ExternalLink, Brain, MessageSquare, Tag, Zap, AlertCircle, CheckCircle } from "lucide-react";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";


// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Dynamic import with SSR disabled - the PROPER Next.js way
const NewsPageContent = dynamicImport(() => Promise.resolve(NewsPageContentComponent), { 
  ssr: false,
  loading: () => (
    <div className="sidebar-layout bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="w-64 bg-white border-r border-gray-200 p-4">
        <div className="text-gray-500">Loading sidebar...</div>
      </div>
      <div className="sidebar-content flex flex-col">
        <div className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm" />
        <main className="main-content content-area force-full-width">
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <RefreshCw className="w-10 h-10 text-blue-600 animate-spin" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Loading News Dashboard...</h3>
              <p className="text-lg text-gray-600">Initializing client-side components</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
});

// Define interfaces outside component
interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  url: string;
  score: number;
  category: string;
  sentiment?: string;
  sentiment_score?: number;
}

interface NewsSource {
  name: string;
  url: string;
  category: string;
  priority: number;
}

// Wrapper component for NavBar to handle useSearchParams Suspense boundary
function NavBarWrapper() {
  return (
    <Suspense fallback={<div className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm" />}>
      <NavBar />
    </Suspense>
  );
}

// Error boundary component for context issues
class SidebarErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Sidebar error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-64 bg-white border-r border-gray-200 p-4">
          <div className="text-gray-500">Sidebar error - please refresh</div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Add error boundary for context issues
const SidebarWrapper = () => {
  const [isReady, setIsReady] = React.useState(false);
  
  React.useEffect(() => {
    // Ensure the context is ready before rendering
    setIsReady(true);
  }, []);

  if (!isReady) {
    return (
      <div className="w-64 bg-white border-r border-gray-200 p-4">
        <div className="text-gray-500">Sidebar loading...</div>
      </div>
    );
  }

  return (
    <SidebarErrorBoundary>
      <SideBar />
    </SidebarErrorBoundary>
  );
};

// Client-only component - this will ONLY run on the client after hydration
function NewsPageContentComponent() {
  
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSources, setSelectedSources] = useState<string[]>(["all"]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAllSources, setShowAllSources] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isFetchingNews, setIsFetchingNews] = useState(false);
  const [aiInsights, setAiInsights] = useState<{[key: string]: any}>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalArticles, setTotalArticles] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  // Spinner state for stable loading indicator on Load More
  const [showFetchSpinner, setShowFetchSpinner] = useState(false);
  // Keep Load More spinner visible for a short time after fetch for stability
  useEffect(() => {
    if (isLoadingMore) {
      setShowFetchSpinner(true);
      return;
    }
    // keep spinner visible a bit after finish to make it noticeable
    const t = setTimeout(() => setShowFetchSpinner(false), 400);
    return () => clearTimeout(t);
  }, [isLoadingMore]);
  
  // State for error handling
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  
  // Safety effect to ensure loading states are reset if component unmounts/remounts
  useEffect(() => {
    return () => {
      // Cleanup function to reset states
      setLoading(false);
      setIsFetchingNews(false);
    };
  }, []);

  
  // Extract sources and categories dynamically from actual news data
  const { sources: newsSources, categories } = useMemo(() => {
    if (!news || news.length === 0) {
      return { sources: [], categories: [] };
    }
    
    // Extract unique sources from actual news data
    const uniqueSources = [...new Set(news.map(article => article.source))];
    const sources = uniqueSources.map((sourceName, index) => ({
      name: sourceName,
      url: '',
      category: 'general',
      priority: index + 1
    }));
    
    // Extract unique categories from actual news data
    const uniqueCategories = [...new Set(news.map(article => article.category).filter(Boolean))];
    const categories = ['all', ...uniqueCategories];
    
    return { sources, categories };
  }, [news]);
  
  // Dynamic filtering based on actual data
  const filteredNews = useMemo(() => {
    if (!news || news.length === 0) return [];
    
    return news.filter(article => {
      // Source filtering - check if article source matches selected sources
      const matchesSource = selectedSources.includes("all") || 
                           selectedSources.includes(article.source);
      
      // Category filtering - check if article category matches selected category
      const matchesCategory = selectedCategory === "all" || 
                             article.category === selectedCategory;
      
      // Search filtering - check if article matches search query
      const matchesSearch = searchQuery === "" || 
                           article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           article.summary.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesSource && matchesCategory && matchesSearch;
    });
  }, [news, selectedSources, selectedCategory, searchQuery]);

  // Use refs to get current state values and prevent stale closures
  const newsRef = useRef(news);
  const hasMoreRef = useRef(hasMore);
  const currentPageRef = useRef(currentPage);
  
  // Simplified infinite scroll refs
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isInfiniteScrollReady = hasMore && !hasSearched && news.length > 0 && !loading;

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



  // Simplified infinite scroll implementation using Intersection Observer
  useEffect(() => {
    if (!isInfiniteScrollReady || !loadMoreRef.current) return;

    // Create a simple intersection observer
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isLoadingMore && hasMoreRef.current) {
          // Trigger load when sentinel intersects
          loadMoreNews();
        }
      },
      {
        root: null, // Use viewport as root
        rootMargin: '0px 0px 400px 0px', // Trigger 400px before element is visible
        threshold: 0,
      }
    );

    // Observe the load more sentinel
    observer.observe(loadMoreRef.current);

    return () => {
      observer.disconnect();
    };
  }, [isInfiniteScrollReady, isLoadingMore, hasMore, hasSearched, news.length]);

  // Helper: try multiple pagination strategies to get the next batch
  const fetchNextBatch = async (pageSize: number, nextPageNumber: number) => {
    const lastArticle = newsRef.current[newsRef.current.length - 1];
    const fallbackCursor = (lastArticle as any)?.cursor || lastArticle?.id || null;
    const cursorToUse = nextCursor ?? fallbackCursor;

    // Strategy 1: pass cursor as 3rd positional arg (existing behavior)
    try {
      if (cursorToUse) {
        const res = await fetchNewsMultiSource(["all"], pageSize, cursorToUse);
        if (res?.articles?.length) return { res, strategy: '#1-positional-cursor' };
      }
    } catch (e) {}

    // Strategy 2: pass an options object with { cursor }
    try {
      if (cursorToUse) {
        const res = await (fetchNewsMultiSource as any)(["all"], pageSize, { cursor: cursorToUse });
        if (res?.articles?.length) return { res, strategy: '#2-opts-cursor' };
      }
    } catch (e) {}

    // Strategy 3: page-based (if backend supports page numbers)
    try {
      const res = await (fetchNewsMultiSource as any)(["all"], pageSize, { page: nextPageNumber });
      if (res?.articles?.length) return { res, strategy: '#3-opts-page' };
    } catch (e) {}

    // Strategy 4: offset-based (common fallback)
    try {
      const offset = newsRef.current.length;
      const res = await (fetchNewsMultiSource as any)(["all"], pageSize, { offset });
      if (res?.articles?.length) return { res, strategy: '#4-opts-offset' };
    } catch (e) {}

    // Strategy 5: plain fetch without pagination args (sometimes returns next window)
    try {
      const res = await fetchNewsMultiSource(["all"], pageSize);
      if (res?.articles?.length) return { res, strategy: '#5-plain' };
    } catch (e) {}

    return { res: null, strategy: 'none-worked' };
  };

  // Load more news function with improved error handling and state management
  async function loadMoreNews() {
    if (isLoadingMore || !hasMoreRef.current) {
      return;
    }

    // If we're in search mode, don't load more - search results are already loaded
    if (searchQuery.trim() && hasSearched) {
      setHasMore(false);
      return;
    }

    // Additional safety check - ensure we have articles before proceeding
    if (!Array.isArray(newsRef.current) || newsRef.current.length === 0) {
      return;
    }

    try {
      setIsLoadingMore(true);
      setLoadMoreError(null);
      const nextPage = currentPageRef.current + 1;
      const pageSize = 100;

      // Try to fetch next batch using multi-strategy helper
      let { res: results, strategy } = await fetchNextBatch(pageSize, nextPage);

      // Process results with better error handling
      const processResults = (incoming: any) => {
        if (!incoming?.articles?.length) return { added: 0 };
        
        const transformedArticles = incoming.articles.map((article: any) => ({
          ...article,
          score: (article as any).score || 0,
        }));

        // Update next cursor if provided by backend
        setNextCursor(incoming.pagination?.nextCursor ?? null);

        // Append with de-duplication and compute hasMore
        let addedCount = 0;
        setNews(prevNews => {
          const existingIds = new Set(prevNews.map(a => a.id));
          const newArticles = transformedArticles.filter(a => !existingIds.has(a.id));
          addedCount = newArticles.length;
          const combined = [...prevNews, ...newArticles];



          const totalFromBackend = incoming.pagination?.totalArticles ?? totalArticles;
          const backendHasMore = typeof incoming.pagination?.hasMore === 'boolean' ? incoming.pagination!.hasMore! : null;
          const hasCursor = !!incoming.pagination?.nextCursor;
          const heuristicMore = newArticles.length === pageSize && (totalFromBackend === 0 || totalFromBackend > combined.length);
          const nextHasMore = backendHasMore ?? hasCursor ?? heuristicMore;
          
          setHasMore(!!nextHasMore);
          return combined;
        });
        return { added: addedCount };
      };

      let added = 0;
      if (results) {
        const r = processResults(results);
        added = r.added;
      }

      // Fallback strategy if no results or no new articles
      if (!results || added === 0) {
        const fallback = await (fetchNewsMultiSource as any)(["all"], pageSize, { page: nextPage, avoidCursor: true });
        strategy = `${strategy} -> fallback#page`;
        if (fallback) {
          const r2 = processResults(fallback);
          added = r2.added;
          results = fallback;
        }
      }

      if (results && added > 0) {
        setCurrentPage(nextPage);
        setRetryCount(0);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more news:', error);
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
  }

  // Only create the infinite scroll hook when we're actually ready


  // Load news on component mount
  useEffect(() => {
    const loadInitialNews = async () => {
      try {
        setLoading(true);
        // Load only 100 articles initially for better performance and faster page load
        // Users can then scroll to load more articles as needed
        const results = await fetchNewsMultiSource(["all"], 100);
        if (results && results.articles) {
          const transformedArticles = results.articles.map(article => ({
            ...article,
            score: (article as any).score || 0
          }));
          setNews(transformedArticles);
          setHasSearched(false); // Not a search result
          setLastUpdated(new Date());
          // Update total articles count from backend
          if (results.pagination && results.pagination.totalArticles) {
            setTotalArticles(results.pagination.totalArticles);
          }
          // Track backend-provided cursor/hasMore if available
          setNextCursor(results.pagination?.nextCursor ?? null);
          // Set hasMore based on backend hints first, then fall back to size-based heuristics
          const totalFromBackend = results.pagination?.totalArticles ?? 0;
          const backendHasMore = typeof results.pagination?.hasMore === 'boolean' ? results.pagination!.hasMore! : null;
          const hasCursor = !!results.pagination?.nextCursor;
          const hasMoreArticles = backendHasMore ?? hasCursor ?? (transformedArticles.length === 100 && (totalFromBackend === 0 || totalFromBackend > transformedArticles.length));
          setHasMore(hasMoreArticles);
          if (transformedArticles.length < 100) {
            setHasMore(false);
          }
          

        }
      } catch (error) {
        console.error('Error loading initial news:', error);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };
    loadInitialNews();
  }, []);

  // Reset to all sources when page is refreshed/loaded
  useEffect(() => {
    // Ensure we always start with all sources
    if (selectedSources.length === 0 || !selectedSources.includes("all")) {
      setSelectedSources(["all"]);
    }
  }, [selectedSources]);

  // Handle refresh - fetch fresh news
  const handleRefresh = async () => {
    try {
      setIsFetchingNews(true);
      // Clear existing news to prevent duplicates
      setNews([]);
      setCurrentPage(1);
      setHasSearched(false);
      // Try to fetch fresh news from API
      const results = await fetchNewsMultiSource(["all"], 100);
      if (results && results.articles && results.articles.length > 0) {
        const transformedArticles = results.articles.map(article => ({
          ...article,
          score: (article as any).score || 0
        }));
        setNews(transformedArticles);
        setHasSearched(false);
        setLastUpdated(new Date());
        // Reset next cursor from backend
        setNextCursor(results.pagination?.nextCursor ?? null);
        // Update total articles count from backend
        if (results.pagination && results.pagination.totalArticles) {
          setTotalArticles(results.pagination.totalArticles);
        }
        // Robust hasMore calculation
        const totalFromBackend = results.pagination?.totalArticles ?? 0;
        const backendHasMore = typeof results.pagination?.hasMore === 'boolean' ? results.pagination!.hasMore! : null;
        const hasCursor = !!results.pagination?.nextCursor;
        const hasMoreArticles = backendHasMore ?? hasCursor ?? (transformedArticles.length === 100 && (totalFromBackend === 0 || totalFromBackend > transformedArticles.length));
        setHasMore(hasMoreArticles);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setIsFetchingNews(false);
    }
  };

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      setLoading(true);
      setIsFetchingNews(true);
      // Reset pagination for new search
      setCurrentPage(1);
      setHasMore(false); // Disable load more during search to prevent duplicates
      // Always fetch from all sources for search, let frontend filtering handle the rest
      const results = await fetchNewsMultiSource(["all"], 500);
      if (results && results.articles) {
        // Transform articles to match our local interface
        const transformedArticles = results.articles.map(article => ({
          ...article,
          score: (article as any).score || 0
        }));
        setNews(transformedArticles);
        setHasSearched(true);
        setLastUpdated(new Date());
        // Update total articles count from backend
        if (results.pagination && results.pagination.totalArticles) {
          setTotalArticles(results.pagination.totalArticles);
        }
      }
    } catch (error) {
      console.error('Error searching news:', error);
    } finally {
      setLoading(false);
      setIsFetchingNews(false);
    }
  };

  // Handle source selection - intuitive single selection behavior
  const handleSourceChange = (source: string) => {
    if (source === "all") {
      setSelectedSources(["all"]);
      handleRefresh();
    } else {
      setSelectedSources([source]);
      handleRefresh();
    }
  };

  // Handle category selection
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  // Format date function to handle various date formats
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

  // AI Functions with proper caching and state management
  const aiSummarize = useCallback(async (articleId: string, title: string, summary: string) => {
    const insightKey = `summary_${articleId}`;
    // If user clicks again, clear the old cached data and regenerate
    if (aiInsights[insightKey] && aiInsights[insightKey].cached) {
      setAiInsights(prev => ({ ...prev, [insightKey]: undefined }));
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    // Set loading state
    setAiInsights(prev => {
      return { ...prev, [insightKey]: { loading: true, content: 'Generating AI summary...' } };
    });
    try {
      // First, check if we already have a cached AI summary
      const cachedResponse = await fetch(`http://127.0.0.1:5001/api/ai/cache?articleId=${articleId}&type=summary`);
      if (cachedResponse.ok) {
        const cachedData = await cachedResponse.json();
        if (cachedData.success && cachedData.result && cachedData.result.content) {
          setAiInsights(prev => {
            return { 
              ...prev, 
              [insightKey]: { 
                loading: false, 
                content: `AI Summary: ${cachedData.result.content}`,
                type: 'summary',
                cached: true,
                timestamp: cachedData.result.timestamp
              } 
            };
          });
          return;
        }
      }
      // If no cached result, call the backend AI summary endpoint
      const response = await fetch('http://127.0.0.1:5001/api/ai/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `${title}. ${summary}`
        })
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Store the successful AI result for future use
          try {
            await fetch('http://127.0.0.1:5001/api/ai/cache', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                articleId,
                type: 'summary',
                content: result.summary,
                success: true,
                metadata: { model: result.model, tone: result.tone }
              })
            });
          } catch (storeError) {}
          setAiInsights(prev => ({ 
            ...prev, 
            [insightKey]: { 
              loading: false, 
              content: `AI Summary: ${result.summary}`,
              type: 'summary',
              cached: false,
              timestamp: new Date().toISOString()
            } 
          }));
        } else {
          throw new Error('AI summary generation failed');
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Summary generation error:', error);
      // Fallback: Show existing summary
      setAiInsights(prev => ({ 
        ...prev, 
        [insightKey]: { 
          loading: false, 
          content: `Existing Summary: ${summary}`,
          type: 'summary',
          cached: true,
          error: true
        } 
      }));
    }
  }, []);

  const aiAnalyzeSentiment = useCallback(async (articleId: string, title: string, summary: string) => {
    const insightKey = `sentiment_${articleId}`;
    // If user clicks again, clear the old cached data and regenerate
    if (aiInsights[insightKey] && aiInsights[insightKey].cached) {
      setAiInsights(prev => ({ ...prev, [insightKey]: undefined }));
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    // Set loading state
    setAiInsights(prev => {
      return { ...prev, [insightKey]: { loading: true, content: 'Analyzing sentiment...' } };
    });
    try {
      // First, check if we already have a cached AI sentiment analysis
      const cachedResponse = await fetch(`http://127.0.0.1:5001/api/ai/cache?articleId=${articleId}&type=sentiment`);
      if (cachedResponse.ok) {
        const cachedData = await cachedResponse.json();
        if (cachedData.success && cachedData.result && cachedData.result.content) {
          setAiInsights(prev => {
            return { 
              ...prev, 
              [insightKey]: { 
                loading: false, 
                content: `AI Sentiment: ${cachedData.result.content}`,
                type: 'sentiment',
                cached: true,
                timestamp: cachedData.result.timestamp
              } 
            };
          });
          return;
        }
      }
      // If no cached result, call the backend AI sentiment analysis endpoint
      const response = await fetch('http://127.0.0.1:5001/api/ai/sentiment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `${title}. ${summary}`
        })
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Store the successful AI result for future use
          try {
            await fetch('http://127.0.0.1:5001/api/ai/cache', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                articleId,
                type: 'sentiment',
                content: `${result.sentiment} (Confidence: ${result.confidence})`,
                success: true,
                metadata: { 
                  model: result.model, 
                  confidence: result.confidence,
                  reasoning: result.reasoning 
                }
              })
            });
          } catch (storeError) {}
          setAiInsights(prev => ({ 
            ...prev, 
            [insightKey]: { 
              loading: false, 
              content: `AI Sentiment: ${result.sentiment} (Confidence: ${result.confidence})`,
              type: 'sentiment',
              cached: false,
              timestamp: new Date().toISOString()
            } 
          }));
        } else {
          throw new Error('AI sentiment analysis failed');
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      // Fallback: Show existing sentiment data if available
      const currentArticle = news.find(article => article.id === articleId);
      if (currentArticle && currentArticle.sentiment) {
        setAiInsights(prev => ({ 
          ...prev, 
          [insightKey]: { 
            loading: false, 
            content: `Existing Sentiment: ${currentArticle.sentiment}`,
            type: 'summary',
            cached: true,
            error: true
          } 
        }));
      } else {
        setAiInsights(prev => ({ 
          ...prev, 
          [insightKey]: { 
            loading: false, 
            content: 'Unable to analyze sentiment at this time. Please try again later.',
            type: 'error',
            error: true
          } 
        }));
      }
    }
  }, [aiInsights]);

  // Preload AI results for better UX
  const preloadAIResults = useCallback(async (articles: NewsArticle[]) => {
    for (const article of articles) {
      try {
        // Check for cached AI summary
        const summaryResponse = await fetch(`http://127.0.0.1:5001/api/ai/cache?articleId=${article.id}&type=summary`);
        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          if (summaryData.success && summaryData.result?.content) {
            const insightKey = `summary_${article.id}`;
            setAiInsights(prev => ({ 
              ...prev, 
              [insightKey]: { 
                loading: false, 
                content: `AI Summary: ${summaryData.result.content}`,
                type: 'summary',
                cached: true,
                timestamp: summaryData.result.timestamp
              } 
            }));
          }
        }
        // Check for cached AI sentiment
        const sentimentResponse = await fetch(`http://127.0.0.1:5001/api/ai/cache?articleId=${article.id}&type=sentiment`);
        if (sentimentResponse.ok) {
          const sentimentData = await sentimentResponse.json();
          if (sentimentData.success && sentimentData.result?.content) {
            const insightKey = `sentiment_${article.id}`;
            setAiInsights(prev => ({ 
              ...prev, 
              [insightKey]: { 
                loading: false, 
                content: `AI Sentiment: ${sentimentData.result.content}`,
                type: 'sentiment',
                cached: true,
                timestamp: sentimentData.result.timestamp
              } 
            }));
          }
        }
      } catch (error) {
        // Ignore preload errors
      }
    }
  }, []);

  return (
    <SidebarProvider defaultOpen>
      <div className="sidebar-layout bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <SideBar />
        <div className="sidebar-content flex flex-col">
          <NavBarWrapper />
          <main className="main-content content-area force-full-width">
              {/* Header */}
              <div className="mb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">News & Media</h1>
                    <p className="text-lg text-gray-600">Multi-source news with RSS fallbacks and AI sentiment analysis</p>
                  </div>
                  {/* (Removed header Fetch/Reset buttons; only bottom Load More News remains) */}
                </div>
              </div>



              {/* Search and Filters */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search for news, topics, or keywords..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setHasSearched(false);
                          handleRefresh(); // Reload all articles
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-gray-600"
                        title="Clear search"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <select
                    className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={selectedCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                  >
                    {categories.length === 0 ? (
                      <option>No categories available yet</option>
                    ) : (
                      categories.map(cat => (
                        <option key={cat} value={cat}>
                          {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </option>
                      ))
                    )}
                  </select>

                  <button
                    onClick={handleSearch}
                    disabled={loading || !searchQuery.trim()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Searching...' : 'Search'}
                  </button>
                </div>
                
                {/* Search Status */}
                {hasSearched && searchQuery && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Search className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          Search results for "{searchQuery}"
                        </span>
                        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                          {filteredNews.length} articles found
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setHasSearched(false);
                          handleRefresh();
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        Clear search & show all articles
                      </button>
                    </div>
                  </div>
                )}
                
                {/* News Sources Filter */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">News Sources:</label>
                  

                  
                  <div className="flex flex-wrap gap-2">
                    {newsSources.length === 0 ? (
                      <div className="flex items-center gap-2 text-gray-500">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span className="text-sm">No sources available yet. Load some news first.</span>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleSourceChange("all")}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            selectedSources.includes("all")
                              ? "bg-blue-100 text-blue-700 border border-blue-300"
                              : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                          }`}
                        >
                          All Sources
                        </button>

                        {(newsSources.slice(0, 5)).map((source) => (
                          <button
                            key={source.name}
                            onClick={() => handleSourceChange(source.name)}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                              selectedSources.includes(source.name)
                                ? "bg-blue-100 text-blue-700 border border-blue-300"
                                : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                            }`}
                          >
                            {source.name.replace("_", " ").split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                          </button>
                        ))}

                        {newsSources.length > 5 && (
                          <details className="relative">
                            <summary className="list-none px-3 py-1 rounded-lg text-sm font-medium transition-colors bg-gray-50 text-gray-700 border border-gray-300 hover:bg-gray-100 cursor-pointer">
                              Show more sources (+{newsSources.length - 5})
                            </summary>
                            <div className="absolute z-20 mt-2 w-64 max-h-80 overflow-auto bg-white border border-gray-200 rounded-lg shadow-lg p-2 grid grid-cols-1 gap-2">
                              {newsSources.slice(5).map((source) => (
                                <button
                                  key={source.name}
                                  onClick={() => handleSourceChange(source.name)}
                                  className={`text-left w-full px-3 py-2 rounded-md text-sm transition-colors ${
                                    selectedSources.includes(source.name)
                                      ? "bg-blue-100 text-blue-700 border border-blue-300"
                                      : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                                  }`}
                                >
                                  {source.name.replace("_", " ").split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                                </button>
                              ))}
                              <button
                                onClick={(e) => {
                                  const details = (e.currentTarget.closest('details') as HTMLDetailsElement);
                                  if (details) details.open = false;
                                }}
                                className="mt-2 w-full px-3 py-2 rounded-md text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
                              >
                                Show fewer sources
                              </button>
                            </div>
                          </details>
                        )}
                      </>
                    )}
                  </div>
                  

                </div>
              </div>

                  {/* News Content */}
                  <div>
                    {/* News Status Indicator */}
                    {!loading && news.length > 0 && (
                      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">
                              Loaded {news.length} of {totalArticles} total articles
                            </span>
                          </div>
                          <div className="text-xs text-blue-600">
                            {hasSearched ? 'Search Results' : 'All Articles'}
                            {!hasMore && ' • All articles loaded'}
                            {hasMore && !hasSearched && ''}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {loading ? (
                      <div className="min-h-[60vh] flex items-center justify-center">
                        <div className="text-center py-16">
                          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <RefreshCw className="w-10 h-10 text-blue-600 animate-spin" />
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-4">Fetching Fresh News...</h3>
                          <p className="text-lg text-gray-600">Gathering latest articles from all sources</p>
                        </div>
                      </div>
                    ) : (news || []).length === 0 ? (
                      <div className="min-h-[60vh] flex items-center justify-center">
                        <div className="text-center py-16">
                          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search className="w-10 h-10 text-blue-600" />
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-4">Multi-Source News Dashboard</h3>
                          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
                            This news page automatically loads articles from multiple sources including financial data providers, news APIs, RSS feeds, and more. 
                            Use the search above to find specific topics, or browse the latest news below.
                          </p>
                          <div className="flex flex-wrap justify-center gap-3">
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">Financial News</span>
                            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">Business</span>
                            <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full">Technology</span>
                            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">RSS Feeds</span>
                          </div>
                          <div className="mt-6 text-center">
                            <button 
                              onClick={handleRefresh}
                              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                            >
                              <RefreshCw className="w-4 h-4" />
                              Load News Now
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {filteredNews.length > 0 ? (
                          <>
                            {lastUpdated && (
                              <div className="text-sm text-gray-500 mb-4">
                                Last updated: {formatDate(lastUpdated.toISOString())}
                              </div>
                            )}
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                              {filteredNews.map((article) => (
                                <div key={article.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                                  <div className="flex items-start justify-between mb-4">
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                      {article.source.replace("_", " ").split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                                    </span>
                                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                      {article.category}
                                    </span>
                                  </div>
                                  <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
                                    {article.title}
                                  </h3>
                                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                                    {article.summary}
                                  </p>
                                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                                    <span>{formatDate(article.publishedAt)}</span>
                                    {article.sentiment && (
                                      <span className={`px-2 py-1 rounded ${
                                        article.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                                        article.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                                        'bg-gray-100 text-gray-700'
                                      }`}>
                                        {article.sentiment}
                                      </span>
                                    )}
                                  </div>
                                  {/* AI Action Buttons */}
                                  <div className="mb-4">
                                    <div className="flex flex-wrap gap-2">
                                      <button 
                                        onClick={() => aiSummarize(article.id, article.title, article.summary)}
                                        disabled={aiInsights[`summary_${article.id}`]?.loading}
                                        className={`px-3 py-1 text-sm rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                                          aiInsights[`summary_${article.id}`]?.cached 
                                            ? 'bg-green-200 text-green-800 hover:bg-green-300' 
                                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                                        }`}
                                      >
                                        <Brain className="w-3 h-3" />
                                        {aiInsights[`summary_${article.id}`]?.loading 
                                          ? 'Processing...' 
                                          : aiInsights[`summary_${article.id}`]?.cached 
                                            ? 'Regenerate Summary' 
                                            : 'AI Summary'
                                        }
                                      </button>
                                      <button 
                                        onClick={() => aiAnalyzeSentiment(article.id, article.title, article.summary)}
                                        disabled={aiInsights[`sentiment_${article.id}`]?.loading}
                                        className={`px-3 py-1 text-sm rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                                          aiInsights[`sentiment_${article.id}`]?.cached 
                                            ? 'bg-blue-200 text-blue-800 hover:bg-blue-300' 
                                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                        }`}
                                      >
                                        <MessageSquare className="w-3 h-3" />
                                        {aiInsights[`sentiment_${article.id}`]?.loading 
                                          ? 'Processing...' 
                                          : aiInsights[`sentiment_${article.id}`]?.cached 
                                            ? 'Regenerate Sentiment' 
                                            : 'Sentiment'
                                        }
                                      </button>
                                    </div>
                                  </div>

                                {/* AI Insights Display */}
                                {Object.keys(aiInsights).filter(key => key.includes(`_${article.id}`)).map(key => {
                                  const insight = aiInsights[key];
                                  if (!insight) return null;
                                  
                                  return (
                                    <div key={key} className="mb-3 p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Zap className="w-4 h-4 text-blue-600" />
                                        <span className="text-sm font-medium text-gray-700">
                                          {key.includes('summary') ? 'AI Summary' : 
                                           key.includes('sentiment') ? 'Sentiment Analysis' : 'AI Insight'}
                                        </span>
                                      </div>
                                      <div className="text-sm text-gray-600">
                                        {insight.loading ? (
                                          <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                            {insight.content}
                                          </div>
                                        ) : (
                                          <div>
                                            <p className={insight.type === 'error' ? 'text-red-600' : ''}>
                                              {insight.content}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}

                                <div className="flex items-center justify-between">
                                  <a
                                    href={article.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                                  >
                                    Read More
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Infinite Scroll Sentinel and Load More Button */}
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
                                    'Load More News'
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
                          
                          {/* End of News Indicator */}
                          {!hasMore && news.length > 0 && (
                            <div className="text-center py-8 text-gray-500">
                              <p>You've reached the end of all available news!</p>
                              <p className="text-sm mt-2">
                                {hasSearched 
                                  ? 'Search results are limited to prevent duplicates. Try a different search term or refresh for new articles.'
                                  : 'All articles have been loaded. Check back later for fresh news or use the refresh button above.'
                                }
                              </p>
                            </div>
                          )}
                          
                          {/* Note about infinite scroll being disabled */}
                          {hasSearched && (
                            <div className="text-center py-4 text-gray-500 text-sm">
                              <p>💡 <strong>Search Mode:</strong> Infinite scroll is disabled during search to prevent duplicate results.</p>
                              <p>Clear your search to browse all articles with infinite scroll.</p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="min-h-[60vh] flex items-center justify-center">
                          <div className="text-center py-16">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                              <AlertCircle className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">No News Found</h3>
                            <p className="text-lg text-gray-600 mb-6">
                              Try adjusting your search terms or filters to find relevant news articles.
                            </p>
                            <button
                              onClick={handleRefresh}
                              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                            >
                              Refresh News
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </main>
            </div>
          </div>
        </SidebarProvider>
  );
}

// Export the page using the dynamic component
export default function NewsPage() {
  return <NewsPageContent />;
}