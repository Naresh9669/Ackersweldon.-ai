import { useState, useEffect, useCallback } from 'react';

export interface NewsSource {
  name: string;
  url: string;
  category: string;
  priority: number;
}

export interface UseDynamicSourcesReturn {
  sources: NewsSource[];
  categories: string[];
  loading: boolean;
  error: string | null;
  refreshSources: () => Promise<void>;
}

export function useDynamicSources(): UseDynamicSourcesReturn {
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSourcesAndCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to fetch from our working AI news API first
      try {
        const response = await fetch('/api/ai-news?limit=1');
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.news && Array.isArray(data.news)) {
            // Extract sources and categories from our AI news data
            const uniqueSources = [...new Set(data.news.map((item: any) => item.source).filter(Boolean))];
            const uniqueCategories = [...new Set(data.news.flatMap((item: any) => item.categories || []).filter(Boolean))];
            
            // Map sources to NewsSource objects
            const mappedSources = uniqueSources.map((sourceName: string, index: number) => {
              let category: string = 'general';
              if (sourceName.toLowerCase().includes('alpha') || sourceName.toLowerCase().includes('financial')) category = 'financial';
              else if (sourceName.toLowerCase().includes('crypto')) category = 'cryptocurrency';
              else if (sourceName.toLowerCase().includes('hacker') || sourceName.toLowerCase().includes('tech')) category = 'technology';
              else if (sourceName.toLowerCase().includes('business')) category = 'business';
              else if (sourceName.toLowerCase().includes('health')) category = 'health';
              else if (sourceName.toLowerCase().includes('science')) category = 'science';
              
              return {
                name: sourceName,
                url: '',
                category: category,
                priority: index + 1
              };
            });
            
            setSources(mappedSources);
            setCategories(['all', ...uniqueCategories]);
            return; // Successfully loaded from our API
          }
        }
      } catch (apiError) {
        console.log('AI news API not available, trying fallback...');
      }
      
      // Fallback: Use static sources and categories
      const fallbackSources = [
        { name: "alpha_vantage", url: "", category: "financial", priority: 1 },
        { name: "cryptocompare", url: "", category: "cryptocurrency", priority: 2 },
        { name: "hackernews", url: "", category: "technology", priority: 3 },
        { name: "newsapi", url: "", category: "general", priority: 4 },
        { name: "rss", url: "", category: "general", priority: 5 },
        { name: "searxng", url: "", category: "general", priority: 6 }
      ];
      
      setSources(fallbackSources);
      setCategories(["all", "business", "cryptocurrency", "financial", "general", "health", "science", "technology"]);
      
    } catch (err) {
      console.error('Error in fetchSourcesAndCategories:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch sources');
      
      // Set fallback values even on error
      const fallbackSources = [
        { name: "alpha_vantage", url: "", category: "financial", priority: 1 },
        { name: "cryptocompare", url: "", category: "cryptocurrency", priority: 2 },
        { name: "hackernews", url: "", category: "technology", priority: 3 },
        { name: "newsapi", url: "", category: "general", priority: 4 },
        { name: "rss", url: "", category: "general", priority: 5 },
        { name: "searxng", url: "", category: "general", priority: 6 }
      ];
      
      setSources(fallbackSources);
      setCategories(["all", "business", "cryptocurrency", "financial", "general", "health", "science", "technology"]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshSources = async () => {
    await fetchSourcesAndCategories();
  };

  useEffect(() => {
    fetchSourcesAndCategories();
  }, [fetchSourcesAndCategories]);

  return {
    sources,
    categories,
    loading,
    error,
    refreshSources
  };
}
