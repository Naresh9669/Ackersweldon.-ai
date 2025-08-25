import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const page = parseInt(searchParams.get('page') || '1');
    const searchTerm = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const sentiment = searchParams.get('sentiment') || '';
    const fromDate = searchParams.get('from_date') || '';
    
    console.log('Fetching AI news from backend service...', { limit, page, searchTerm, category, sentiment, fromDate });
    
    // Build backend URL with pagination
    const backendParams = new URLSearchParams({
      limit: (limit * page).toString(), // Fetch all items up to current page
      page: '1' // Always fetch from first page but with increased limit
    });
    
    // Fetch data from the backend service
    const response = await fetch(`http://127.0.0.1:5001/api/news?${backendParams.toString()}`, {
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
    let aiProcessedArticles = backendData.data.filter((item: any) => 
      (item.ai_summary && item.ai_summary.trim() !== '') ||
      (item.ai_sentiment_analysis && item.ai_sentiment_analysis.trim() !== '') ||
      (item.sentiment_score && item.sentiment_score !== 0 && Math.abs(item.sentiment_score) > 0.1)
    );
    
    console.log(`Found ${aiProcessedArticles.length} AI-processed articles out of ${backendData.data.length} total`);
    
    // Apply client-side filtering
    if (searchTerm) {
      aiProcessedArticles = aiProcessedArticles.filter((item: any) =>
        (item.title && item.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.summary && item.summary.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.ai_summary && item.ai_summary.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (category && category !== 'all') {
      aiProcessedArticles = aiProcessedArticles.filter((item: any) =>
        item.category === category
      );
    }
    
    if (sentiment && sentiment !== 'all') {
      aiProcessedArticles = aiProcessedArticles.filter((item: any) => {
        const score = item.sentiment_score || 0;
        switch (sentiment) {
          case 'positive': return score > 0.1;
          case 'negative': return score < -0.1;
          case 'neutral': return score >= -0.1 && score <= 0.1;
          default: return true;
        }
      });
    }
    
    if (fromDate) {
      const filterDate = new Date(fromDate);
      aiProcessedArticles = aiProcessedArticles.filter((item: any) => {
        const itemDate = new Date(item.published_at || item.fetched_at || new Date());
        return itemDate >= filterDate;
      });
    }
    
    // Implement pagination
    const totalArticles = aiProcessedArticles.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedArticles = aiProcessedArticles.slice(startIndex, endIndex);
    const hasMore = endIndex < totalArticles;
    
    // Transform the data to match our expected interface
    const aiNewsData = aiProcessedArticles.map((item: any) => {
      let aiSummary = '';
      let processingType = 'unknown';
      
      if (item.ai_summary && item.ai_summary.trim() !== '') {
        aiSummary = item.ai_summary;
        processingType = 'summary';
      } else if (item.ai_sentiment_analysis && item.ai_sentiment_analysis.trim() !== '') {
        aiSummary = `AI Sentiment Analysis: ${item.ai_sentiment_analysis}`;
        processingType = 'sentiment_analysis';
      } else if (item.sentiment_score && item.sentiment_score !== 0 && Math.abs(item.sentiment_score) > 0.1) {
        const sentimentLabel = item.sentiment_score > 0.1 ? 'Positive' : 'Negative';
        aiSummary = `AI Sentiment Score: ${sentimentLabel} (${item.sentiment_score.toFixed(2)})`;
        processingType = 'sentiment_score';
      } else {
        aiSummary = 'AI analysis available';
        processingType = 'unknown';
      }
      
      // Helper function to parse various date formats
      const parseDate = (dateStr: string | null | undefined): number => {
        if (!dateStr) return Date.now() / 1000;
        
        try {
          // Handle format like "20250824T093500"
          if (typeof dateStr === 'string' && dateStr.match(/^\d{8}T\d{6}$/)) {
            const year = dateStr.substring(0, 4);
            const month = dateStr.substring(4, 6);
            const day = dateStr.substring(6, 8);
            const hour = dateStr.substring(9, 11);
            const minute = dateStr.substring(11, 13);
            const second = dateStr.substring(13, 15);
            const isoDate = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
            return new Date(isoDate).getTime() / 1000;
          }
          
          // Handle standard date formats
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) return Date.now() / 1000;
          return date.getTime() / 1000;
        } catch (error) {
          console.warn('Failed to parse date:', dateStr, error);
          return Date.now() / 1000;
        }
      };
      
      return {
        _id: item._id?.toString() || item.unique_id || Math.random().toString(36).substr(2, 9),
        title: item.title || 'Untitled',
        summary: item.summary || item.description || '',
        ai_summary: aiSummary,
        sentiment: item.sentiment_score || 0,
        categories: Array.isArray(item.category) ? item.category : 
                   (item.category ? [item.category] : ['general']),
        source: item.source || item.api_source || 'Unknown',
        date: parseDate(item.published_at || item.fetched_at || item.date),
        url: item.url || '#',
        processed_at: item.ai_summary_timestamp || item.ai_sentiment_timestamp || item.fetched_at || new Date().toISOString(),
        ai_processing_type: processingType
      };
    });
    
    // Calculate comprehensive statistics
    const stats = calculateStats(aiProcessedArticles, backendData.total_available || 0);
    
    return NextResponse.json({
      success: true,
      news: aiNewsData,
      stats,
      backend_info: {
        total_available: backendData.total_available,
        sources: backendData.sources,
        categories: backendData.categories
      }
    });

  } catch (error) {
    console.error('AI News API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch AI news data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function calculateStats(aiArticles: any[], totalAvailable: number) {
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
    
    return {
      totalProcessed: aiArticles.length,
      positiveSentiment: sentimentStats.positiveCount,
      negativeSentiment: sentimentStats.negativeCount,
      neutralSentiment: sentimentStats.neutralCount,
      averageSentiment: aiArticles.length > 0 ? sentimentStats.totalSentiment / aiArticles.length : 0,
      topCategories,
      processingQueue: totalAvailable - aiArticles.length,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error calculating stats:', error);
    return {
      totalProcessed: 0,
      positiveSentiment: 0,
      negativeSentiment: 0,
      neutralSentiment: 0,
      averageSentiment: 0,
      topCategories: [],
      processingQueue: 0,
      lastUpdated: new Date().toISOString()
    };
  }
}
