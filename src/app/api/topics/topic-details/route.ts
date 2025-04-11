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
    console.log(`API - Fetching categories for topic ID: ${topicId}`);

    // Try a direct SQL query to ensure we get the categories
    try {
      // Execute a direct query to get categories
      const { data: directCategories, error: directError } = await supabaseServer
        .from('categories')
        .select('*')
        .eq('topic_id', parseInt(topicId, 10)) // Ensure topicId is treated as a number
        .order('created_at', { ascending: false });

      if (directError) {
        console.error(`API - Error in direct query: ${directError.message}`);
      } else {
        console.log(`API - Direct query found ${directCategories?.length || 0} categories for topic ID: ${topicId}`);

        // For debugging, log the first category if available
        if (directCategories && directCategories.length > 0) {
          console.log(`API - First category: ${JSON.stringify(directCategories[0])}`);
        }

        // For each category, get its questions
        const categoriesWithQuestions = await Promise.all(
          (directCategories || []).map(async (category) => {
            console.log(`Fetching questions for category ${category.id} (${category.name})`);

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

            console.log(`Found ${questions?.length || 0} questions for category ${category.id}`);

            // For debugging, log the first question if available
            if (questions && questions.length > 0) {
              console.log(`First question for category ${category.id}: ${questions[0].question_text}`);
            }

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
    } catch (directQueryError) {
      console.error(`API - Error executing direct query: ${directQueryError}`);
    }

    // If we get here, try a different approach as a last resort
    try {
      console.log(`API - Trying alternative query for topic ID: ${topicId}`);

      // Try a different approach to get categories
      const { data: rawCategories, error: rawError } = await supabaseServer
        .from('categories')
        .select('*')
        .filter('topic_id', 'eq', parseInt(topicId, 10))
        .order('created_at', { ascending: false });

      if (rawError) {
        console.error(`API - Error in alternative query: ${rawError.message}`);
      } else if (rawCategories && rawCategories.length > 0) {
        console.log(`API - Alternative query found ${rawCategories.length} categories`);

        // For each category, get its questions
        const categoriesWithQuestions = await Promise.all(
          rawCategories.map(async (category) => {
            console.log(`Fetching questions for category ${category.id} (${category.name})`);

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

            console.log(`Found ${questions?.length || 0} questions for category ${category.id}`);

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
    } catch (rawQueryError) {
      console.error(`API - Error executing raw SQL query: ${rawQueryError}`);
    }

    // If we get here, try the standard approach as fallback
    const { data: categories, error: categoriesError } = await supabaseServer
      .from('categories')
      .select('*')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: false });

    console.log(`API - Fallback query found ${categories?.length || 0} categories for topic ID: ${topicId}`);

    // If categories are found with the fallback approach, use them
    if (!categoriesError && categories && categories.length > 0) {
      console.log(`API - Using categories from fallback query`);

      // For each category, get its questions
      const categoriesWithQuestions = await Promise.all(
        categories.map(async (category) => {
          console.log(`Fetching questions for category ${category.id} (${category.name})`);

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

          console.log(`Found ${questions?.length || 0} questions for category ${category.id}`);

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

    // If we get here, no categories were found - check if we should create some
    console.log(`API - No categories found for topic ID: ${topicId}. Checking if we should create some.`);

    // For now, just return an empty categories array
    // In the future, we could create some default categories here
    if (categoriesError) {
      console.error(`Error fetching categories for topic ${topicId}:`, categoriesError);
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      );
    } else {
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
    }
  } catch (error: any) {
    console.error('Error in topic details API route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
