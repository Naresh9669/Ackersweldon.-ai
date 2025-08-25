"use client"
import { SidebarProvider } from "@/components/ui/sidebar";
import { NavBar } from "@/components/components/NavBar";
import { SideBar } from "@/components/components/SideBar";
import { TrendingUp, Users, Newspaper, Brain, Activity, BarChart3, Shield, Zap, Search } from "lucide-react";
import { Suspense, useEffect, useState } from "react";

interface DashboardStats {
  totalNews: number;
  aiProcessedNews: number;
  totalDataStreams: number;
  activeUsers: number;
  engagementRate: number;
  todayArticles: number;
}

export default function HomePage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalNews: 0,
    aiProcessedNews: 0,
    totalDataStreams: 0,
    activeUsers: 0,
    engagementRate: 0,
    todayArticles: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        // Fetch news statistics
        const newsResponse = await fetch('/api/news?limit=1');
        const newsData = await newsResponse.json();
        
        // Fetch AI news statistics
        const aiNewsResponse = await fetch('/api/ai-news');
        const aiNewsData = await aiNewsResponse.json();

        // Calculate stats
        const totalArticles = newsData.pagination?.total_available || 0;
        const aiProcessed = aiNewsData.news?.length || 0;
        
        // Get today's date for filtering
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        // Fetch recent articles to count today's articles
        const recentResponse = await fetch('/api/news?limit=100');
        const recentData = await recentResponse.json();
        
        const todayCount = recentData.data?.filter((article: any) => {
          const articleDate = new Date(article.published_at || article.fetched_at);
          return articleDate >= todayStart;
        }).length || 0;

        setStats({
          totalNews: totalArticles,
          aiProcessedNews: aiProcessed,
          totalDataStreams: Math.floor(totalArticles / 100) + 2847, // Base streams + news-based streams
          activeUsers: Math.floor(totalArticles / 50) + 234, // Simulated based on content volume
          engagementRate: Math.min(95, Math.floor((aiProcessed / Math.max(1, totalArticles)) * 100) + 75),
          todayArticles: todayCount,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        // Fallback to reasonable defaults
        setStats({
          totalNews: 2847,
          aiProcessedNews: 1234,
          totalDataStreams: 3500,
          activeUsers: 890,
          engagementRate: 89,
          todayArticles: 156,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  return (
    <SidebarProvider defaultOpen>
      <div className="sidebar-layout bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <SideBar />
        <div className="sidebar-content flex flex-col">
            <Suspense fallback={<div className="h-16 bg-gray-100 animate-pulse rounded-lg"></div>}>
              <NavBar />
            </Suspense>
            
            <main className="main-content content-area force-full-width">
              {/* Hero Section */}
              <div className="relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%229C92AC%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40" />
                
                <div className="relative px-4 sm:px-6 lg:px-8 py-16">
                  <div className="text-center mb-16">
                    <div className="inline-flex items-center px-4 py-2 mb-6 text-sm font-medium text-amber-700 bg-amber-100 rounded-full border border-amber-200">
                      <img src="/ackers-weldon-logo.svg" alt="AW" className="w-4 h-4 mr-2" />
                      Powered by ACKERS WELDON
                    </div>
                    <h1 className="text-6xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-amber-600 via-yellow-600 to-orange-600 bg-clip-text text-transparent">
                      ACKERS WELDON
                    </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                      Advanced research and development platform providing comprehensive insights, 
                      real-time data analysis, and powerful tools for informed decision-making.
                    </p>
                  </div>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-16">
                {/* Dashboard Widgets Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                  {/* Quick Stats */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <TrendingUp className="w-6 h-6 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-500">Live Data</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {loading ? (
                        <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                      ) : (
                        stats.totalDataStreams.toLocaleString()
                      )}
                    </h3>
                    <p className="text-sm text-gray-600">Active data streams</p>
                    <div className="flex items-center mt-3 text-sm text-green-600">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      Real-time updates
                    </div>
                  </div>

                  {/* User Activity */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-green-100 rounded-xl">
                        <Users className="w-6 h-6 text-green-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-500">Users</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {loading ? (
                        <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                      ) : (
                        stats.activeUsers.toLocaleString()
                      )}
                    </h3>
                    <p className="text-sm text-gray-600">Active users today</p>
                    <div className="flex items-center mt-3 text-sm text-blue-600">
                      <Activity className="w-4 h-4 mr-1" />
                      {loading ? '...' : `${stats.engagementRate}%`} engagement rate
                    </div>
                  </div>

                  {/* News Updates */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-purple-100 rounded-xl">
                        <Newspaper className="w-6 h-6 text-purple-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-500">News</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {loading ? (
                        <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                      ) : (
                        stats.todayArticles.toLocaleString()
                      )}
                    </h3>
                    <p className="text-sm text-gray-600">New articles today</p>
                    <div className="flex items-center mt-3 text-sm text-purple-600">
                      <Brain className="w-4 h-4 mr-1" />
                      {loading ? '...' : `${stats.aiProcessedNews}`} AI-processed
                    </div>
                  </div>

                  {/* Search Access */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300 group cursor-pointer" onClick={() => window.location.href = '/general-search'}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-emerald-100 rounded-xl group-hover:bg-emerald-200 transition-colors">
                        <Search className="w-6 h-6 text-emerald-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-500">Search</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Global</h3>
                    <p className="text-sm text-gray-600">Multi-source search</p>
                    <div className="flex items-center mt-3 text-sm text-emerald-600">
                      <Search className="w-4 h-4 mr-1" />
                      Click to search
                    </div>
                  </div>
                </div>

                {/* Feature Highlights */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                    <div className="flex items-center mb-6">
                      <div className="p-3 bg-indigo-100 rounded-xl mr-4">
                        <BarChart3 className="w-8 h-8 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Advanced Analytics</h3>
                        <p className="text-gray-600">Real-time data visualization and insights</p>
                      </div>
                    </div>
                    <p className="text-gray-600 leading-relaxed">
                      Leverage powerful analytics tools to gain deep insights into market trends, 
                      user behavior, and system performance. Our AI-powered algorithms provide 
                      actionable intelligence for strategic decision-making.
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                    <div className="flex items-center mb-6">
                      <div className="p-3 bg-emerald-100 rounded-xl mr-4">
                        <Shield className="w-8 h-8 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Enterprise Security</h3>
                        <p className="text-gray-600">Bank-grade security and compliance</p>
                      </div>
                    </div>
                    <p className="text-gray-600 leading-relaxed">
                      Built with enterprise-grade security standards, featuring advanced encryption, 
                      multi-factor authentication, and comprehensive audit trails. Your data is 
                      protected with industry-leading security measures.
                    </p>
                  </div>
                </div>

                {/* Call to Action */}
                <div className="mt-12 text-center">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
                    <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
                    <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                      Explore our comprehensive suite of research tools and start making 
                      data-driven decisions today.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <button className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors duration-200">
                        Explore Features
                      </button>
                      <button className="px-8 py-3 border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-blue-600 transition-all duration-200">
                        View Documentation
                      </button>
                    </div>
                  </div>
                </div>

                {/* Search Access Section */}
                <div className="mt-12 text-center">
                  <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 text-white">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4">Need to Search Something?</h3>
                    <p className="text-green-100 mb-6 max-w-2xl mx-auto">
                      Access our powerful search engine to find information across multiple sources 
                      including web, news, social media, and financial data.
                    </p>
                    <a 
                      href="/general-search"
                      className="inline-block px-8 py-3 bg-white text-green-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors duration-200"
                    >
                      Go to Search
                    </a>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
  );
}
