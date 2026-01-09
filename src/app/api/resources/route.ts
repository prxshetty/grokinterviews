import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const questionId = url.searchParams.get('questionId');

    if (!questionId) {
      return NextResponse.json(
        { error: 'Question ID parameter is required' },
        { status: 400 }
      );
    }

    const r2Url = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

    if (!r2Url) {
      console.error('API - NEXT_PUBLIC_R2_PUBLIC_URL is not set');
      // Return empty array or error, but let's be graceful during migration
      return NextResponse.json(
        { error: 'Storage configuration missing' },
        { status: 503 }
      );
    }

    // Fetch from R2 Static JSON
    const r2Response = await fetch(`${r2Url}/resources/q-${questionId}.json`);

    if (!r2Response.ok) {
      if (r2Response.status === 404) {
        return NextResponse.json([]);
      }
      console.error(`API - Failed to fetch from R2: ${r2Response.statusText}`);
      return NextResponse.json(
        { error: 'Failed to fetch resources' },
        { status: 502 }
      );
    }

    const resources = await r2Response.json();

    // Sort by relevance_score descending if present
    if (Array.isArray(resources)) {
      resources.sort((a: any, b: any) => (b.relevance_score || 0) - (a.relevance_score || 0));
    }

    return NextResponse.json(resources);

  } catch (error: any) {
    console.error('Error in resources API route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
} 