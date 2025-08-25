import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching AI news stats from backend service...');
    
    // Fetch data from the backend service
    const response = await fetch('http://127.0.0.1:5001/api/news?limit=1000', {
      next: { revalidate: 300 } // Revalidate every 5 minutes
    });
    
    if (!response.ok) {
      throw new Error(`Backend service responded with status: ${response.status}`);
    }
    
    const backendData = await response.json();
    
    if (!backendData.success || !backendData.data) {
      throw new Error('Backend service returned invalid data');
    }
    
    // Filter articles that have AI processing (summary, sentiment analysis, or meaningful sentiment scores)
    const aiProcessedArticles = backendData.data.filter((item: any) => 
      (item.ai_summary && item.ai_summary.trim() !== '') ||
      (item.ai_sentiment_analysis && item.ai_sentiment_analysis.trim() !== '') ||
      (item.sentiment_score && item.sentiment_score !== 0 && Math.abs(item.sentiment_score) > 0.1)
    );
    
    console.log(`Calculating stats for ${aiProcessedArticles.length} AI-processed articles out of ${backendData.total_available} total`);
    
    // Calculate comprehensive statistics
    const stats = calculateComprehensiveStats(aiProcessedArticles, backendData.total_available || 0);
    
    return NextResponse.json({
      success: true,
      stats,
      backend_info: {
        total_available: backendData.total_available,
        sources: backendData.sources,
        categories: backendData.categories
      }
    });

  } catch (error) {
    console.error('AI News Stats API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch AI news statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function calculateComprehensiveStats(aiArticles: any[], totalAvailable: number) {
  try {
    // Sentiment distribution
    const sentimentStats = aiArticles.reduce((acc, item) => {
      const sentiment = item.sentiment_score || 0;
      if (sentiment > 0.1) acc.positiveCount++;
      else if (sentiment < -0.1) acc.negativeCount++;
      else acc.neutralCount++;
      acc.totalSentiment += sentiment;
      return acc;
    }, { positiveCount: 0, negativeCount: 0, neutralCount: 0, totalSentiment: 0 });
    
    // Category distribution
    const categoryCounts: { [key: string]: number } = {};
    aiArticles.forEach(item => {
      const category = item.category || 'general';
      if (Array.isArray(category)) {
        category.forEach(cat => {
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });
      } else {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      }
    });
    
    const topCategories = Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // Source distribution
    const sourceCounts: { [key: string]: number } = {};
    aiArticles.forEach(item => {
      const source = item.api_source || item.source || 'unknown';
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    });
    
    const topSources = Object.entries(sourceCounts)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    return {
      totalProcessed: aiArticles.length,
      positiveSentiment: sentimentStats.positiveCount,
      negativeSentiment: sentimentStats.negativeCount,
      neutralSentiment: sentimentStats.neutralCount,
      averageSentiment: aiArticles.length > 0 ? sentimentStats.totalSentiment / aiArticles.length : 0,
      topCategories,
      topSources,
      processingQueue: totalAvailable - aiArticles.length,
      processingProgress: totalAvailable > 0 ? Math.round((aiArticles.length / totalAvailable) * 100) : 0,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error calculating comprehensive stats:', error);
    return {
      totalProcessed: 0,
      positiveSentiment: 0,
      negativeSentiment: 0,
      neutralSentiment: 0,
      averageSentiment: 0,
      topCategories: [],
      topSources: [],
      processingQueue: 0,
      processingProgress: 0,
      lastUpdated: new Date().toISOString()
    };
  }
}
