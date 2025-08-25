import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const page = parseInt(searchParams.get('page') || '1');
    
    console.log('News API called with:', { limit, page });
    
    // Fetch news data directly from the backend
    const backendUrl = 'http://127.0.0.1:5001/api/news';
    const params = new URLSearchParams({
      limit: limit.toString(),
      page: page.toString()
    });
    
    const response = await fetch(`${backendUrl}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Backend service responded with status: ${response.status}`);
    }
    
    const backendData = await response.json();
    
    if (!backendData.success || !backendData.data) {
      throw new Error('Backend service returned invalid data');
    }
    
    console.log(`Backend returned ${backendData.data.length} articles, total available: ${backendData.total_available}`);
    
    // Transform the data to match the expected format
    const transformedData = backendData.data.map((article: any) => ({
      _id: article._id || article.unique_id || Math.random().toString(36).substr(2, 9),
      title: article.title || 'Untitled',
      summary: article.summary || '',
      source: article.source || 'Unknown',
      api_source: article.api_source || 'Unknown',
      published_at: article.published_at || article.fetched_at || new Date().toISOString(),
      url: article.url || '#',
      category: article.category || 'general',
      sentiment_score: article.sentiment_score || 0,
      sentiment_label: article.sentiment_label || '',
      ai_summary: article.ai_summary || '',
      ai_sentiment_analysis: article.ai_sentiment_analysis || '',
      ai_summary_timestamp: article.ai_summary_timestamp || article.fetched_at || new Date().toISOString(),
      ai_sentiment_timestamp: article.ai_sentiment_timestamp || article.fetched_at || new Date().toISOString(),
      fetched_at: article.fetched_at || new Date().toISOString(),
      date: article.published_at || article.fetched_at || new Date().toISOString()
    }));
    
    // Return the data in the expected format
    return NextResponse.json({
      success: true,
      data: transformedData,
      total_available: backendData.total_available || transformedData.length,
      total_count: backendData.total_available || transformedData.length,
      total: backendData.total_available || transformedData.length,
      count: transformedData.length,
      pagination: {
        currentPage: page,
        totalPages: backendData.total_pages || Math.ceil((backendData.total_available || transformedData.length) / limit),
        totalArticles: backendData.total_available || transformedData.length,
        perPage: limit,
        nextCursor: null,
        hasMore: backendData.has_next || false,
        raw: backendData
      }
    });
    
  } catch (error) {
    console.error('News API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
