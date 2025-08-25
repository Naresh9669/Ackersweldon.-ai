// Centralized API client for the dashboard
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { data, success: true };
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      };
    }
  }

  // News API - using web search endpoint
  async getNews(source?: string) {
    const endpoint = `/api/search/web?q=${encodeURIComponent(source || '')}`;
    return this.request(endpoint);
  }

  // Enhanced News API with multiple sources
  async getRealtimeNews(query?: string, source?: string, limit?: number) {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (source) params.append('source', source);
    if (limit) params.append('limit', limit.toString());
    
    const endpoint = `/api/news/realtime?${params.toString()}`;
    return this.request(endpoint);
  }

  // Fallback to web search if real-time news fails
  async getNewsFallback(query?: string) {
    try {
      // Try real-time news first
      const realtimeResponse = await this.getRealtimeNews(query);
      // Fix: Add proper type checking before accessing results
      if (realtimeResponse.success && realtimeResponse.data && typeof realtimeResponse.data === 'object' && 'results' in realtimeResponse.data && Array.isArray(realtimeResponse.data.results) && realtimeResponse.data.results.length > 0) {
        return realtimeResponse;
      }
      
      // Fallback to web search
      return await this.getNews(query);
    } catch (error) {
      // Final fallback to web search
      return await this.getNews(query);
    }
  }

  // News Management APIs - Updated to use Flask backend
  async fetchAllNews() {
    // Call Flask backend directly
    const response = await fetch('http://localhost:5001/api/news?per_page=2000');
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to fetch news from Flask backend');
  }

  async getLatestNews(limit?: number, category?: string, source?: string) {
    const params = new URLSearchParams();
    if (limit) params.append('per_page', limit.toString());
    if (category) params.append('category', category);
    if (source) params.append('source', source);
    
    // Call Flask backend directly
    const response = await fetch(`http://localhost:5001/api/news?${params.toString()}`);
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to fetch latest news from Flask backend');
  }

  async getNewsCategories() {
    // Call Flask backend directly
    const response = await fetch('http://localhost:5001/api/news?per_page=1');
    if (response.ok) {
      const data = await response.json();
      return { success: true, data: data.categories || [] };
    }
    throw new Error('Failed to fetch news categories from Flask backend');
  }

  async getNewsSources() {
    // Call Flask backend directly
    const response = await fetch('http://localhost:5001/api/news?per_page=1');
    if (response.ok) {
      const data = await response.json();
      return { success: true, data: data.sources || [] };
    }
    throw new Error('Failed to fetch news sources from Flask backend');
  }

  async cleanupOldNews(days: number = 7) {
    // This functionality should be handled by Flask backend
    return { success: true, message: 'Cleanup handled by Flask backend' };
  }

  async getNewsSummary(articleId: string) {
    return this.request(`/ai-news/stats?id=${articleId}`);
  }

  async processNews() {
    return this.request('/ai-news/process-all', { method: 'POST' });
  }

  // Financial API
  async getStockQuote(symbol: string) {
    return this.request(`/stock-quote?symbol=${symbol}`);
  }

  async getFinancialData(symbol: string) {
    return this.request(`/financials/${symbol}`);
  }

  // Social Media API
  async getTweets(username: string) {
    return this.request(`/tweets?username=${username}`);
  }

  // KYC API
  async searchKYC(query: string, source: 'linkedin' | 'finra' | 'searxng') {
    return this.request(`/kyc/${source}?query=${encodeURIComponent(query)}`);
  }

  // User Management
  async getUsers() {
    return this.request('/users');
  }

  async createUser(userData: any) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }



  // Health Check
  async healthCheck() {
    return this.request('/health');
  }
}

export const apiClient = new ApiClient();
export default apiClient;
