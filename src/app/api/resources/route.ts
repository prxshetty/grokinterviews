import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

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

    console.log(`API - Fetching resources for question ID: ${questionId}`);

    const supabase = await createClient();

    // Fetch resources for the question
    const { data: resources, error: resourceError } = await supabase
      .from('resources')
      .select('*')
      .eq('question_id', questionId)
      .order('relevance_score', { ascending: false });

    if (resourceError) {
      console.error('Error fetching resources:', resourceError);
      return NextResponse.json(
        { error: 'Failed to fetch resources' },
        { status: 500 }
      );
    }

    console.log(`Found ${resources?.length || 0} resources for question ${questionId}`);

    return NextResponse.json(resources || []);
    
  } catch (error: any) {
    console.error('Error in resources API route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
} 