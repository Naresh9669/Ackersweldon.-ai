// Multi-Source News Service with Backend Integration
// Note: Deduplication now handled by backend

// Function to determine if we're running on localhost (client-side only)
function getIsLocalhost(): boolean {
  if (typeof window === 'undefined') {
    // Server-side rendering - default to true for development
    return true;
  }
  
  const hostname = window.location.hostname;
  return hostname === 'localhost' || 
         hostname === '127.0.0.1' ||
         hostname.includes('192.168.') ||
         hostname.includes('10.0.') ||
         hostname === 'aw-ec2' || // Add your EC2 hostname
         hostname === 'scrapy'; // Add your EC2 hostname
}

// Function to get API base URL (client-side only)
function getApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    // Server-side rendering - return empty string to prevent server-side API calls
    return '';
  }
  
  const isLocalhost = getIsLocalhost();
  return isLocalhost 
    ? 'http://127.0.0.1:5001' 
    : (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5001');
}

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  url: string;
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

// Dynamic news sources - will be fetched from backend
let dynamicNewsSources: NewsSource[] = [];

// Fallback sources if backend is unavailable
const FALLBACK_SOURCES: NewsSource[] = [
  {
    name: "alpha_vantage",
    url: "",
    category: "financial",
    priority: 1
  },
  {
    name: "cryptocompare",
    url: "",
    category: "cryptocurrency",
    priority: 2
  },
  {
    name: "hackernews",
    url: "",
    category: "technology",
    priority: 3
  },
  {
    name: "newsapi",
    url: "",
    category: "general",
    priority: 4
  },
  {
    name: "rss",
    url: "",
    category: "general",
    priority: 5
  },
  {
    name: "searxng",
    url: "",
    category: "general",
    priority: 6
  }
];

// Cached API calls
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

function cachedGet(url: string, params?: Record<string, string>): Promise<any> {
  // Prevent API calls during server-side rendering
  if (typeof window === 'undefined') {
    console.log('Skipping API call during server-side rendering');
    return Promise.resolve(null);
  }
  
  const cacheKey = `${url}?${new URLSearchParams(params).toString()}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('Using cached data for:', cacheKey);
    return Promise.resolve(cached.data);
  }

  const fullUrl = params ? `${url}?${new URLSearchParams(params).toString()}` : url;
  console.log('Fetching from backend API:', fullUrl);

  return fetch(fullUrl, { 
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  })
  .then(response => {
    console.log('API response status:', response.status);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('API response data:', data);
    cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  })
  .catch(error => {
    console.error('API call failed:', error);
    return null;
  });
}

// Load dynamic news sources from backend
async function loadDynamicNewsSources(): Promise<NewsSource[]> {
  try {
    console.log('Loading dynamic news sources from backend...');
          console.log('Using API_BASE_URL:', getApiBaseUrl());
      
      // Use the configured API base URL
    const response = await cachedGet(`${getApiBaseUrl()}/api/news?limit=1`);
    console.log('Backend API response:', response);
    
    if (response && response.success && response.sources && Array.isArray(response.sources)) {
      console.log('Backend sources found:', response.sources);
      
      // Convert backend source names to NewsSource objects
      const sources = response.sources.map((sourceName: string, index: number) => {
        // Map source names to categories based on what we know
        let category = 'general';
        if (sourceName.includes('alpha') || sourceName.includes('financial')) category = 'financial';
        else if (sourceName.includes('crypto')) category = 'cryptocurrency';
        else if (sourceName.includes('hacker') || sourceName.includes('tech')) category = 'technology';
        else if (sourceName.includes('business')) category = 'business';
        else if (sourceName.includes('health')) category = 'health';
        else if (sourceName.includes('science')) category = 'science';
        
        return {
          name: sourceName,
          url: '', // Backend doesn't provide URLs
          category: category,
          priority: index + 1
        };
      });
      
      // Cache the dynamic sources
      dynamicNewsSources = sources;
      console.log('Dynamic sources set:', dynamicNewsSources);
      return sources;
    } else {
      console.log('Backend sources not available, using fallback');
      console.log('Response structure:', response);
      // Return fallback sources instead of empty array
      return FALLBACK_SOURCES;
    }
  } catch (error) {
    console.error('Failed to load dynamic sources:', error);
    // Always return fallback sources on error
    return FALLBACK_SOURCES;
  }
}

// Direct backend API communication
async function fetchBackendNews(selectedSources: string[], limit: number = 500, cursorParam?: any): Promise<{ articles: NewsArticle[]; totalCount: number; pagination: { nextCursor: string | null; hasMore: boolean; raw?: any } }> {
  console.log('🚀 NEW VERSION OF fetchBackendNews CALLED!');
  try {
    console.log('fetchBackendNews called with:', { selectedSources, limit, cursorParam, apiBaseUrl: getApiBaseUrl() });
    const params: Record<string, string> = { 
      sources: selectedSources.join(','), 
      limit: limit.toString()
    };

    // Add pagination params if provided
    if (cursorParam) {
      if (typeof cursorParam === 'string') {
        params.cursor = cursorParam;
        console.log('Using positional cursor for pagination:', cursorParam);
      } else if (typeof cursorParam === 'object') {
        if (cursorParam.cursor) params.cursor = String(cursorParam.cursor);
        if (cursorParam.after) params.after = String(cursorParam.after);
        if (cursorParam.page !== undefined) params.page = String(cursorParam.page);
        if (cursorParam.offset !== undefined) params.offset = String(cursorParam.offset);
        if (cursorParam.limit !== undefined) params.limit = String(cursorParam.limit);
        console.log('Using options for pagination:', cursorParam);
      }
    }

    console.log('Backend API params:', params);

    // Use frontend API route if no backend URL specified, otherwise use backend directly
    const apiUrl = getApiBaseUrl() ? `${getApiBaseUrl()}/api/news` : '/api/news';
    const response = await cachedGet(apiUrl, params);
    console.log('Backend API response:', response);

    if (response && response.success && response.data) {
      console.log(`Processing ${response.data.length} articles from backend`);
      const articles = response.data.map((article: any, index: number) => ({
        id: article._id || `backend_${index}`,
        title: article.title || 'No title',
        summary: article.summary || 'No summary available',
        source: article.source || article.api_source || 'Unknown',
        publishedAt: article.published_at || new Date().toISOString(),
        url: article.url || '#',
        category: article.category || 'general',
        sentiment: article.sentiment_label || '',
        sentiment_score: article.sentiment_score || 0
      }));

      console.log('Processed articles:', articles.slice(0, 2)); // Log first 2 articles

      // Extract total count from backend response if available
      console.log('🔍 DEBUGGING TOTAL COUNT EXTRACTION...');
      console.log('🔍 Backend response keys:', Object.keys(response));
      console.log('🔍 Response total_available:', response.total_available);
      console.log('🔍 Response total_count:', response.total_count);
      console.log('🔍 Response totalArticles:', response.totalArticles);
      console.log('🔍 Response total:', response.total);
      console.log('🔍 Response count:', response.count);

      // Check which field is providing the value
      let totalCount = 0;
      let sourceField = 'none';

      if (response.total_available !== undefined && response.total_available > 0) {
        totalCount = response.total_available;
        sourceField = 'total_available';
      } else if (response.total_count !== undefined && response.total_count > 0) {
        totalCount = response.total_count;
        sourceField = 'total_count';
      } else if (response.totalArticles !== undefined && response.totalArticles > 0) {
        totalCount = response.totalArticles;
        sourceField = 'totalArticles';
      } else if (response.total !== undefined && response.total > 0) {
        totalCount = response.total;
        sourceField = 'total';
      } else if (response.count !== undefined && response.count > 0) {
        totalCount = response.count;
        sourceField = 'count';
      } else {
        totalCount = articles.length;
        sourceField = 'fallback_to_articles_length';
      }

      console.log('🔍 Total count source field:', sourceField);
      console.log('🔍 Backend total count extracted:', totalCount);
      console.log('🔍 Backend response structure:', {
        hasTotalCount: !!response.total_count,
        hasTotalArticles: !!response.totalArticles,
        hasTotal: !!response.total,
        hasCount: !!response.count,
        dataLength: response.data?.length
      });

      // Extract pagination metadata (cursor/has_more) from common shapes
      const raw = (response.pagination || response.meta || response) as any;
      let nextCursor: string | null = null;
      if (raw) {
        nextCursor = raw.next_cursor || raw.nextCursor || raw.cursor || null;
      }
      let hasMore: boolean = false;
      if (raw && typeof raw.has_more === 'boolean') hasMore = raw.has_more;
      else if (raw && typeof raw.hasMore === 'boolean') hasMore = raw.hasMore;
      else {
        // heuristic: if backend total is greater than what we just received or a cursor exists
        hasMore = (typeof totalCount === 'number' && totalCount > articles.length) || !!nextCursor;
      }

      return { articles, totalCount, pagination: { nextCursor, hasMore, raw } };
    } else {
      console.log('Backend response invalid:', { success: response?.success, hasData: !!response?.data });
    }
  } catch (error) {
    console.error('Backend news API failed:', error);
  }
  return { articles: [], totalCount: 0, pagination: { nextCursor: null, hasMore: false, raw: undefined } };
}

// Multi-source news fetching with Backend API only
export async function fetchNewsMultiSource(
  selectedSources: string[] = ['all'], 
  limit: number = 2000,
  cursorParam?: any
): Promise<{ articles: NewsArticle[]; pagination: { currentPage: number; totalPages: number; totalArticles: number; perPage: number; nextCursor: string | null; hasMore: boolean; raw?: any } }> {
  let allArticles: NewsArticle[] = [];
  let totalCountFromBackend = 0;

  // Fetch from Backend API (which handles RSS feeds server-side)
  try {
    const backendResult = await fetchBackendNews(selectedSources, limit, cursorParam);
    let nextCursor: string | null = backendResult?.pagination?.nextCursor ?? null;
    let hasMore: boolean = backendResult?.pagination?.hasMore ?? false;
    let rawPag = backendResult?.pagination?.raw;
    if (backendResult && backendResult.articles && backendResult.articles.length > 0) {
      console.log(`Backend API returned ${backendResult.articles.length} articles`);
      allArticles.push(...backendResult.articles);
      totalCountFromBackend = backendResult.totalCount;
      console.log(`Backend total count: ${totalCountFromBackend}`);
    }

    // If we didn't get a total count from the main API, try to get it separately
    if (totalCountFromBackend <= 0 || totalCountFromBackend === backendResult.articles.length) {
      console.log('No valid total count from main API, trying to get total count separately...');
      const totalCount = await getTotalArticlesCount();
      if (totalCount > 0) {
        totalCountFromBackend = totalCount;
        console.log(`Got total count from separate call: ${totalCountFromBackend}`);
      }
    }

    // Backend now handles deduplication - no need to dedupe here
    console.log(`Backend API returned ${allArticles.length} articles (already deduplicated)`);

    // Sort by published date (newest first)
    allArticles.sort((a, b) => {
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

    // Return all articles up to limit
    const limitedArticles = allArticles.slice(0, limit);

    // Use the actual total count from backend if available, otherwise fall back to loaded count
    const actualTotalArticles = totalCountFromBackend > 0 ? totalCountFromBackend : limitedArticles.length;

    console.log('Backend pagination hints:', { nextCursor, hasMore });

    return {
      articles: limitedArticles,
      pagination: {
        currentPage: 1,
        totalPages: hasMore ? 2 : 1,
        totalArticles: actualTotalArticles,
        perPage: limit,
        nextCursor,
        hasMore,
        raw: rawPag
      }
    };
  } catch (error) {
    console.log('Backend API failed, no news available...');
  }

  // Backend now handles deduplication - no need to dedupe here
  console.log(`Backend API returned ${allArticles.length} articles (already deduplicated)`);

  // Sort by published date (newest first)
  allArticles.sort((a, b) => {
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  // Return all articles up to limit
  const limitedArticles = allArticles.slice(0, limit);

  // Use the actual total count from backend if available, otherwise fall back to loaded count
  const actualTotalArticles = totalCountFromBackend > 0 ? totalCountFromBackend : limitedArticles.length;

  return {
    articles: limitedArticles,
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalArticles: actualTotalArticles,
      perPage: limit,
      nextCursor: null,
      hasMore: false,
      raw: undefined
    }
  };
}

// AI Sentiment Analysis (manually activated)
export async function analyzeSentiment(
  text: string, 
  model: string = 'llama3.2:3b'
): Promise<{ sentiment: string; confidence: number; reasoning: string } | null> {
  if (typeof window === 'undefined') return null; // Cannot make API call on server
  
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/ai/sentiment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, model })
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        return {
          sentiment: result.sentiment,
          confidence: result.confidence || 0.8,
          reasoning: result.reasoning || 'AI analysis completed'
        };
      }
    }
  } catch (error) {
    console.error('AI sentiment analysis failed:', error);
  }
  
  return null;
}

// Get available news sources - now dynamic from backend
export async function getAvailableNewsSources(): Promise<NewsSource[]> {
  try {
    // If we haven't loaded sources yet, load them
    if (dynamicNewsSources.length === 0) {
      console.log('No cached sources, loading from backend...');
      const sources = await loadDynamicNewsSources();
      if (sources && sources.length > 0) {
        return sources;
      }
    }
    
    // Return cached sources if available
    if (dynamicNewsSources.length > 0) {
      console.log('Returning cached sources:', dynamicNewsSources.length);
      return dynamicNewsSources;
    }
    
    // Fallback to static sources if all else fails
    console.log('All else failed, returning fallback sources');
    return FALLBACK_SOURCES;
  } catch (error) {
    console.error('Error in getAvailableNewsSources:', error);
    return FALLBACK_SOURCES;
  }
}

// Get total count of articles in database
async function getTotalArticlesCount(): Promise<number> {
  try {
    // Try to get total count from a stats endpoint or by making a minimal request
    const response = await cachedGet(`${getApiBaseUrl()}/api/news?limit=1&stats=true`);
    
    if (response && response.success) {
      // Check if response has total count - prioritize total_available
      if (response.total_available !== undefined && response.total_available > 0) {
        console.log(`Found total_available: ${response.total_available}`);
        return response.total_available;
      }
      if (response.total_count !== undefined) return response.total_count;
      if (response.totalArticles !== undefined) return response.totalArticles;
      if (response.total !== undefined) return response.total;
      if (response.count !== undefined) return response.count;
      
      // If no stats endpoint, try to get it from the main API with a larger limit
      console.log('No stats endpoint, trying to get total count from main API...');
      const statsResponse = await cachedGet(`${getApiBaseUrl()}/api/news?limit=1000`);
      
      if (statsResponse && statsResponse.success && statsResponse.data) {
        console.log(`Stats API returned ${statsResponse.data.length} articles, using as total count`);
        return statsResponse.data.length;
      }
    }
  } catch (error) {
    console.error('Failed to get total articles count:', error);
  }
  
  return 0;
}

// Get news categories - now dynamic from backend
export async function getNewsCategories(): Promise<string[]> {
  try {
    const response = await cachedGet(`${getApiBaseUrl()}/api/news?limit=1`);
    
    if (response && response.success && response.categories && Array.isArray(response.categories)) {
      return ['all', ...response.categories];
    }
  } catch (error) {
    console.error('Failed to load dynamic categories:', error);
  }
  
  // Fallback categories
  return ['all', 'business', 'cryptocurrency', 'financial', 'general', 'health', 'science', 'technology'];
}
