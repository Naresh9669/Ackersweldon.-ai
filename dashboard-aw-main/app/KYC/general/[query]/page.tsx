"use client"
import { Suspense } from "react";
import { NavBar } from "@/components/components/NavBar";
import { SideBar } from "@/components/components/SideBar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Search, Filter, Shield, ExternalLink, Clock, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { apiClient } from "@/lib/api";

// Define proper interfaces for type safety
interface KYCProfile {
  id: string;
  name: string;
  title: string;
  company: string;
  location: string;
  verified: boolean;
  source: string;
  lastUpdated: string;
  riskLevel?: string;
  confidence?: number;
  riskScore?: number;
  url?: string;
}

// Fix: Update interface to match the actual API response type
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export default function KYCGeneralQueryPage({ params }: { params: { query: string } }) {
  // Fix: Add explicit type annotations
  const [data, setData] = useState<KYCProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [ref, inView] = useInView();

  // Function to run deep check on a profile
  const runDeepCheck = async (item: KYCProfile) => {
    try {
      // Run enhanced verification with additional data sources
      const response = await fetch('/api/kyc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'person',
          value: item.name,
          additionalData: item.company || item.location || ''
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Deep Check Results for ${item.name}:\nRisk Level: ${result.riskAssessment?.overallRisk}\nConfidence: ${result.riskAssessment?.confidence}%\nRisk Score: ${result.riskAssessment?.riskScore}/100`);
      } else {
        alert('Deep check failed. Please try again.');
      }
    } catch (error) {
      console.error('Deep check error:', error);
      alert('Deep check failed. Please try again.');
    }
  };

  const query = decodeURIComponent(params.query);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Use our working KYC API instead of the non-existent searxng endpoint
        const response = await fetch('/api/kyc', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'person',
            value: query,
            additionalData: ''
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.results?.person) {
                         // Transform the KYC API response to match our interface
             const transformedData: KYCProfile[] = [{
               id: result.requestId,
               name: result.results.person.name,
               title: 'Verified via KYC System',
               company: 'KYC Verification',
               location: 'Verified',
               verified: result.results.person.webPresence,
               source: result.sources?.join(', ') || 'KYC System',
               lastUpdated: result.results.person.lastUpdated,
               riskLevel: result.riskAssessment?.overallRisk,
               confidence: result.riskAssessment?.confidence,
               riskScore: result.riskAssessment?.riskScore,
               url: `https://search.ackersweldon.com/search?q=${encodeURIComponent(query)}`,
             }];
            setData(transformedData);
          } else {
            // If no person results, try company verification
            const companyResponse = await fetch('/api/kyc', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                type: 'company',
                value: query,
                additionalData: ''
              }),
            });

            if (companyResponse.ok) {
              const companyResult = await companyResponse.json();
              if (companyResult.success && companyResult.results?.company) {
                                 const transformedData: KYCProfile[] = [{
                   id: companyResult.requestId,
                   name: query,
                   title: 'Company Verification',
                   company: query,
                   location: 'Company',
                   verified: companyResult.results.company.webPresence,
                   source: companyResult.sources?.join(', ') || 'KYC System',
                   lastUpdated: companyResult.results.company.lastUpdated,
                   riskLevel: companyResult.riskAssessment?.overallRisk,
                   confidence: companyResult.riskAssessment?.confidence,
                   riskScore: companyResult.riskAssessment?.riskScore,
                 }];
                setData(transformedData);
              } else {
                setData([]);
              }
            } else {
              setData([]);
            }
          }
        } else {
          setData([]);
        }
      } catch (error) {
        console.error("KYC search failed:", error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [query]);

  useEffect(() => {
    if (inView && hasMore && !loading) {
      // Load more data logic here
      setPage(prev => prev + 1);
    }
  }, [inView, hasMore, loading]);

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <SideBar />
        <div className="flex-1 flex flex-col min-w-0">
          <Suspense fallback={<div className="h-16 bg-gray-100 animate-pulse rounded-lg"></div>}>
            <NavBar />
          </Suspense>
          
          <div className="flex-1 px-6 py-8 mx-auto max-w-7xl">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">KYC Search Results</h1>
              <p className="text-lg text-gray-600">Results for: &quot;{query}&quot;</p>
            </div>

            {/* Search Results */}
            <div className="space-y-6">
              {data.map((item: KYCProfile) => (
                <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                        <Shield className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
                        <p className="text-gray-600">{item.title}</p>
                        <p className="text-sm text-gray-500">{item.company}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        item.verified 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {item.verified ? 'Verified' : 'Pending'}
                      </span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {item.source}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Last updated: {new Date(item.lastUpdated).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Confidence: {item.confidence ? `${item.confidence}%` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-gray-400" />
                      <span className={`text-sm font-medium ${
                        item.riskLevel === 'low' ? 'text-green-600' :
                        item.riskLevel === 'medium' ? 'text-yellow-600' :
                        item.riskLevel === 'high' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        Risk: {item.riskLevel ? item.riskLevel.toUpperCase() : 'N/A'}
                        {item.riskScore && ` (${item.riskScore}/100)`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <button 
                      onClick={() => window.open(item.url || `https://search.ackersweldon.com/search?q=${encodeURIComponent(query)}`, '_blank')}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      View Full Profile
                    </button>
                    <button 
                      onClick={() => runDeepCheck(item)}
                      className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                    >
                      Run Deep Check
                    </button>
                  </div>
                </div>
              ))}

              {/* Load More Trigger */}
              <div ref={ref} className="text-center py-8">
                {loading && (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-600">Loading more results...</span>
                  </div>
                )}
              </div>

              {/* Empty State */}
              {data.length === 0 && !loading && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                  <p className="text-gray-500">Try adjusting your search query</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}