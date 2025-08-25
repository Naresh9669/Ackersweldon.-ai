import { NextRequest, NextResponse } from 'next/server';
import { fetchNewsMultiSource } from '@/lib/newsService';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing news service...');
    const result = await fetchNewsMultiSource(['all'], 5);
    console.log('News service result:', result);
    
    return NextResponse.json({
      success: true,
      result: result,
      articles_count: result?.articles?.length || 0,
      has_articles: !!(result?.articles && result.articles.length > 0)
    });
    
  } catch (error) {
    console.error('Test news service error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
