import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient, shouldUseAdminClient } from '@/utils/supabase/admin';
import { SupabaseClient } from '@supabase/supabase-js';
import { Category } from '@/types/database';

// Function to get categories for a specific topic ID
async function getCategoriesForTopic(supabase: SupabaseClient, topicId: number) {
  console.log(`API - Direct query for categories with topic_id = ${topicId}`);

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`API - Error fetching categories: ${error.message}`);
      return [];
    }

    console.log(`API - Found ${data?.length || 0} categories for topic ID ${topicId}`);
    if (data && data.length > 0) {
      console.log(`API - First category: ${JSON.stringify(data[0])}`);
    }

    return data || [];
  } catch (error) {
    console.error(`API - Error in getCategoriesForTopic: ${error}`);
    return [];
  }
}

// Function to get questions for a category
async function getQuestionsForCategory(supabase: SupabaseClient, categoryId: number) {
  console.log(`API - Fetching questions for category ID ${categoryId}`);

  try {
    // Direct SQL query to get questions for this category
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('category_id', categoryId)
      .order('difficulty');

    if (error) {
      console.error(`API - Error fetching questions: ${error.message}`);
      return [];
    }

    console.log(`API - Found ${data?.length || 0} questions for category ID ${categoryId}`);
    if (data && data.length > 0) {
      console.log(`API - First question: ${data[0].question_text}`);
      return data;
    }

    // If no questions found, try a direct database query with different filter
    const { data: directData, error: directError } = await supabase
      .from('questions')
      .select('*')
      .filter('category_id', 'eq', categoryId)
      .order('difficulty');

    if (directError) {
      console.error(`API - Error in direct query: ${directError.message}`);
      return [];
    }

    console.log(`API - Direct query found ${directData?.length || 0} questions`);
    return directData || [];

  } catch (error) {
    console.error(`API - Error in getQuestionsForCategory: ${error}`);
    return [];
  }
}

export async function GET(request: NextRequest) {
  // Use admin client in development to bypass RLS
  const supabase = shouldUseAdminClient()
    ? createAdminClient()
    : await createClient();
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
    // Handle 'topic-123' format by extracting the numeric part
    let queryTopicId = topicId;
    if (topicId.startsWith('topic-')) {
      queryTopicId = topicId.replace('topic-', '');
      console.log(`API - Extracted numeric ID ${queryTopicId} from ${topicId} for topic query`);
    }

    const { data: topic, error: topicError } = await supabase
      .from('topics')
      .select('*')
      .eq('id', queryTopicId)
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
    console.log(`API - Fetching categories for topic ID: ${topicId}`);

    // Get categories directly using the numeric ID
    // Handle 'topic-123' format by extracting the numeric part
    let numericId;
    if (topicId.startsWith('topic-')) {
      numericId = parseInt(topicId.replace('topic-', ''), 10);
      console.log(`API - Extracted numeric ID ${numericId} from ${topicId}`);
    } else {
      numericId = parseInt(topicId, 10);
    }

    try {
      // Get categories
      const categories = await getCategoriesForTopic(supabase, numericId);

      if (categories && categories.length > 0) {
        console.log(`API - Found ${categories.length} categories for topic ID ${topicId}`);

        // For each category, get its questions
        const categoriesWithQuestions = await Promise.all(
          categories.map(async (category: Category) => {
            const questions = await getQuestionsForCategory(supabase, category.id);

            return {
              ...category,
              questions: questions || []
            };
          })
        );

        // Return the result
        return NextResponse.json(
          {
            topic,
            categories: categoriesWithQuestions
          },
          {
            headers: {
              'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1 hour cache
            },
          }
        );
      }
    } catch (error) {
      console.error(`API - Error fetching categories: ${error}`);
    }

    // If no categories were found, return empty result
    console.log(`API - No categories found for topic: ${topic.name}`);

    // Return the result with empty categories
    return NextResponse.json(
      {
        topic,
        categories: []
      },
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
