import { NextRequest, NextResponse } from 'next/server';
import supabaseServer from '@/utils/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const topicId = url.searchParams.get('topicId');

    if (!topicId) {
      return NextResponse.json(
        { error: 'Topic ID parameter is required' },
        { status: 400 }
      );
    }

    console.log(`API - Fetching details for topic ID: ${topicId}`);

    // First, get the topic details
    const { data: topic, error: topicError } = await supabaseServer
      .from('topics')
      .select('*')
      .eq('id', topicId)
      .single();

    if (topicError) {
      console.error(`Error fetching topic with ID ${topicId}:`, topicError);
      return NextResponse.json(
        { error: 'Failed to fetch topic details' },
        { status: 500 }
      );
    }

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Next, get all categories for this topic
    const { data: categories, error: categoriesError } = await supabaseServer
      .from('categories')
      .select('*')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: false });

    if (categoriesError) {
      console.error(`Error fetching categories for topic ${topicId}:`, categoriesError);
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      );
    }

    // For each category, get its questions
    const categoriesWithQuestions = await Promise.all(
      (categories || []).map(async (category) => {
        const { data: questions, error: questionsError } = await supabaseServer
          .from('questions')
          .select('*')
          .eq('category_id', category.id)
          .order('difficulty');

        if (questionsError) {
          console.error(`Error fetching questions for category ${category.id}:`, questionsError);
          return {
            ...category,
            questions: []
          };
        }

        return {
          ...category,
          questions: questions || []
        };
      })
    );

    // Prepare the result
    const result = {
      topic,
      categories: categoriesWithQuestions
    };

    return NextResponse.json(
      result,
      {
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1 hour cache
        },
      }
    );
  } catch (error: any) {
    console.error('Error in topic details API route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
