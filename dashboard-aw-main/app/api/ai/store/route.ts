import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { articleId, type, content, success, metadata } = body;

    if (!articleId || !type || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: articleId, type, content' },
        { status: 400 }
      );
    }

    // Store the AI result in the backend database
    const backendResponse = await fetch(`http://127.0.0.1:5001/api/news/ai-update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        article_id: articleId,
        ai_type: type,
        content: content,
        model: metadata?.model || 'unknown',
        metadata: metadata || {},
        confidence: metadata?.confidence || 0
      })
    });

    if (!backendResponse.ok) {
      throw new Error(`Backend update failed: ${backendResponse.status}`);
    }

    const backendResult = await backendResponse.json();
    if (!backendResult.success) {
      throw new Error(`Backend error: ${backendResult.error}`);
    }

    console.log(`✅ Stored AI result: ${type} for article ${articleId}`);

    return NextResponse.json({
      success: true,
      message: 'AI result stored successfully in backend database',
      key: `${articleId}_${type}`,
      cached: true
    });

  } catch (error) {
    console.error('Error storing AI result:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to store AI result' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get('articleId');
    const type = searchParams.get('type');

    if (!articleId || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing required query parameters: articleId, type' },
        { status: 400 }
      );
    }

    // Retrieve the AI result from the backend database
    const backendResponse = await fetch(`http://127.0.0.1:5001/api/news/${articleId}/ai-results`);
    
    if (!backendResponse.ok) {
      return NextResponse.json(
        { success: false, error: 'AI result not found in backend', cached: false },
        { status: 404 }
      );
    }

    const backendResult = await backendResponse.json();
    if (!backendResult.success) {
      return NextResponse.json(
        { success: false, error: 'Backend error', cached: false },
        { status: 500 }
      );
    }

    // Extract the relevant AI result based on type
    const aiData = backendResult.data;
    let result = null;
    
    if (type === 'summary' && aiData.ai_summary?.content) {
      result = {
        articleId: aiData.article_id,
        type: 'summary',
        content: aiData.ai_summary.content,
        success: true,
        metadata: aiData.ai_summary.metadata,
        timestamp: aiData.ai_summary.timestamp,
        cached: true
      };
    } else if (type === 'sentiment' && aiData.ai_sentiment?.content) {
      result = {
        articleId: aiData.article_id,
        type: 'sentiment',
        content: aiData.ai_sentiment.content,
        success: true,
        metadata: aiData.ai_sentiment.metadata,
        timestamp: aiData.ai_sentiment.timestamp,
        cached: true
      };
    }

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'AI result not found for this type', cached: false },
        { status: 404 }
      );
    }

    console.log(`📖 Retrieved AI result from backend: ${type} for article ${articleId}`);

    return NextResponse.json({
      success: true,
      result,
      cached: true
    });

  } catch (error) {
    console.error('Error retrieving AI result:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve AI result' },
      { status: 500 }
    );
  }
}
