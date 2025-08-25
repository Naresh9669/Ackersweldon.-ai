"use client"
import { Suspense } from "react";
import { NavBar } from "@/components/components/NavBar";
import { SideBar } from "@/components/components/SideBar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Search, Filter, Globe, TrendingUp, BarChart3, Users } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function GeneralSearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);
  const [showFloatingSearch, setShowFloatingSearch] = useState(false);
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }

    // Set popular searches
    setPopularSearches([
      "market analysis",
      "company research",
      "financial data",
      "news trends",
      "social media insights",
      "KYC verification"
    ]);

    // Add keyboard shortcut listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    // Add scroll listener for floating search button
    const handleScroll = () => {
      setShowFloatingSearch(window.scrollY > 300);
    };

    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Save to recent searches
      const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 10);
      setRecentSearches(updated);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      
      // Navigate to search results
      router.push(`/general-search/${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleQuickSearch = (query: string) => {
    setSearchQuery(query);
    router.push(`/general-search/${encodeURIComponent(query)}`);
  };

  return (
    <SidebarProvider defaultOpen>
      <div className="flex-container no-white-blocks">
        <div className="sidebar-container">
          <SideBar />
        </div>
        <div className="main-container">
          <Suspense fallback={<div className="h-16 bg-gray-100 animate-pulse rounded-lg"></div>}>
            <NavBar />
          </Suspense>
          
          <main className="content-area force-full-width">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Globe className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-5xl font-bold text-gray-900 mb-6">Global Search</h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                Search across multiple sources including web, news, social media, and financial data
              </p>
              
              {/* Quick Search Shortcut */}
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-600">
                <span>💡</span>
                <span>Press <kbd className="px-2 py-1 bg-white rounded text-xs font-mono">Ctrl</kbd> + <kbd className="px-2 py-1 bg-white rounded text-xs font-mono">K</kbd> to focus search</span>
              </div>
            </div>

            {/* Search Form */}
            <div className="max-w-4xl mx-auto mb-12">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="What would you like to search for?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-4 py-4 text-lg border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500 focus:border-transparent shadow-lg"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Search
                </button>
              </form>
            </div>

            {/* Quick Actions */}
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition-all duration-300">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Search className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Web Search</h3>
                  <p className="text-gray-600 text-sm">Search across the web for comprehensive results</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition-all duration-300">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">News Search</h3>
                  <p className="text-gray-600 text-sm">Find recent news and trending topics</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition-all duration-300">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Social Search</h3>
                  <p className="text-gray-600 text-sm">Discover social media conversations</p>
                </div>
              </div>
            </div>

            {/* Popular Searches */}
            <div className="max-w-6xl mx-auto">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Popular Searches</h3>
                <div className="flex flex-wrap gap-3">
                  {popularSearches.map((search) => (
                    <button
                      key={search}
                      onClick={() => handleQuickSearch(search)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Searches</h3>
                  <div className="flex flex-wrap gap-3">
                    {recentSearches.map((search) => (
                      <button
                        key={search}
                        onClick={() => handleQuickSearch(search)}
                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Floating Search Button */}
      {showFloatingSearch && (
        <div className="fixed bottom-8 right-8 z-50">
          <button
            onClick={() => {
              searchInputRef.current?.scrollIntoView({ behavior: 'smooth' });
              setTimeout(() => searchInputRef.current?.focus(), 500);
            }}
            className="w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center text-white"
            title="Quick Search"
          >
            <Search className="w-6 h-6" />
          </button>
        </div>
      )}
    </SidebarProvider>
  );
}