import { NavBar } from "@/components/components/NavBar";
import { SideBar } from "@/components/components/SideBar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Suspense } from "react";
import { BackButton } from "./BackButton";
import { ErrorDisplay } from "./ErrorDisplay";

type SearchItem = {
  id?: string | number;
  title?: string;
  url?: string;
  snippet?: string;
  content?: string;
  source?: string;
  timestamp?: string;
  relevance?: number;
  engines?: string[];
  score?: number;
  category?: string;
};

type SearchResponse = {
  success: boolean;
  data: {
    results: SearchItem[];
    total: number;
    query: string;
  };
  error?: string;
};

async function fetchSearchResults(query: string): Promise<SearchResponse> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/test?q=${encodeURIComponent(query)}`, {
      next: { revalidate: 60 }, // Cache for 60 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Search fetch error:', error);
    return {
      success: false,
      data: { results: [], total: 0, query },
      error: error instanceof Error ? error.message : 'Failed to fetch search results'
    };
  }
}

function SearchResults({ results, total, query }: { results: SearchItem[], total: number, query: string }) {
  const limitedResults = results.slice(0, 20);
  const hasMore = total > 20;

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-4">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-500">Try adjusting your search terms or browse our categories.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Summary */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Found <span className="font-semibold text-gray-900">{total}</span> results for "{query}"
            {hasMore && (
              <span className="ml-2 text-gray-500">• Showing top 20</span>
            )}
          </div>
          {hasMore && (
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View all results →
            </button>
          )}
        </div>
      </div>

      {/* Search Results */}
      <div className="space-y-4">
        {limitedResults.map((item, index) => (
          <div key={item.id || index} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {item.title || `Result ${index + 1}`}
                </h3>
                
                {item.snippet && (
                  <p className="text-gray-600 mb-3 line-clamp-3">{item.snippet}</p>
                )}
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  {item.source && (
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-.758l1.102-1.101a4 4 0 105.656-5.656l4-4a4 4 0 00-5.656 0l-1.102 1.101" />
                      </svg>
                      {item.source}
                    </span>
                  )}
                  
                  {item.timestamp && (
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {item.timestamp}
                    </span>
                  )}
                  
                  {item.score && (
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      {item.score.toFixed(2)}
                    </span>
                  )}
                </div>
                
                {item.url && (
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View source
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LoadingResults() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-4 border border-gray-200 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      </div>
      
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
            <div className="flex-1 space-y-3">
              <div className="h-5 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="flex space-x-4">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function SearchResultsPage({ 
  params 
}: { 
  params: Promise<{ query: string }> 
}) {
  const resolvedParams = await params;
  const query = decodeURIComponent(resolvedParams.query);
  const searchData = await fetchSearchResults(query);

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-gray-50">
        <SideBar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <NavBar />
          
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-6xl mx-auto">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-4xl font-bold text-gray-900">Search Results</h1>
                  <BackButton />
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span className="text-blue-800 font-medium">
                      Search query: <span className="font-bold">"{query}"</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Search Results */}
              <Suspense fallback={<LoadingResults />}>
                {searchData.success ? (
                  <SearchResults 
                    results={searchData.data.results} 
                    total={searchData.data.total} 
                    query={query} 
                  />
                ) : (
                  <ErrorDisplay error={searchData.error || 'An error occurred while searching'} />
                )}
              </Suspense>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}