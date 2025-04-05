import { NextRequest, NextResponse } from 'next/server';
import supabaseServer from '@/utils/supabase-server';
import { getQuestionsByTopic } from '@/app/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const categoryId = url.searchParams.get('categoryId');
    const topicId = url.searchParams.get('topicId');
    const difficulty = url.searchParams.get('difficulty') as 'easy' | 'medium' | 'hard' | null;
    const query = url.searchParams.get('query');

    // Try to use Supabase directly first
    try {
      // If a search query is provided
      if (query) {
        let dbQuery = supabaseServer
          .from('questions')
          .select(`
            *,
            categories:category_id (
              id,
              name,
              topic_id
            )
          `)
          .ilike('question_text', `%${query}%`);

        // Apply filters if provided
        if (difficulty) {
          dbQuery = dbQuery.eq('difficulty', difficulty);
        }

        if (categoryId) {
          // Check if categoryId is a number or a slug
          if (typeof categoryId === 'number' || !isNaN(Number(categoryId))) {
            dbQuery = dbQuery.eq('category_id', categoryId);
          } else {
            // First get the category by slug
            const { data: categoryData } = await supabaseServer
              .from('categories')
              .select('id')
              .eq('slug', categoryId)
              .single();

            if (categoryData) {
              dbQuery = dbQuery.eq('category_id', categoryData.id);
            }
          }
        }

        if (topicId) {
          // We need to join with categories to filter by topic_id
          dbQuery = dbQuery.eq('categories.topic_id', topicId);
        }

        const { data: questions, error } = await dbQuery.limit(50);

        if (error) throw error;

        return NextResponse.json(
          { questions: questions || [] },
          {
            headers: {
              'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1 hour cache
            },
          }
        );
      }

      // If a category ID is provided, get questions for that category
      if (categoryId) {
        let categoryIdValue = categoryId;

        // Check if categoryId is a slug
        if (typeof categoryId === 'string' && isNaN(Number(categoryId))) {
          // Get the category ID from the slug
          const { data: categoryData } = await supabaseServer
            .from('categories')
            .select('id')
            .eq('slug', categoryId)
            .single();

          if (categoryData) {
            categoryIdValue = categoryData.id;
          } else {
            throw new Error(`Category with slug ${categoryId} not found`);
          }
        }

        // Get questions for this category
        const { data: questions, error } = await supabaseServer
          .from('questions')
          .select('*')
          .eq('category_id', categoryIdValue)
          .order('difficulty');

        if (error) throw error;

        return NextResponse.json(
          { questions: questions || [] },
          {
            headers: {
              'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1 hour cache
            },
          }
        );
      }
    } catch (dbError) {
      console.error('Error using Supabase directly:', dbError);
      // Fall back to the old implementation if direct Supabase fails
    }

    // Fall back to the old implementation
    if (topicId) {
      const questions = await getQuestionsByTopic(Number(topicId));
      return NextResponse.json(questions);
    }

    // If no specific parameters, return an error
    return NextResponse.json(
      { error: 'Missing required parameters. Please provide categoryId, topicId, or query.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to load questions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { categoryId, query, difficulty, topicId } = body;

    // Try to use Supabase directly first
    try {
      // If a search query is provided
      if (query) {
        let dbQuery = supabaseServer
          .from('questions')
          .select(`
            *,
            categories:category_id (
              id,
              name,
              topic_id
            )
          `)
          .ilike('question_text', `%${query}%`);

        // Apply filters if provided
        if (difficulty) {
          dbQuery = dbQuery.eq('difficulty', difficulty);
        }

        if (categoryId) {
          // Check if categoryId is a number or a slug
          if (typeof categoryId === 'number' || !isNaN(Number(categoryId))) {
            dbQuery = dbQuery.eq('category_id', categoryId);
          } else {
            // First get the category by slug
            const { data: categoryData } = await supabaseServer
              .from('categories')
              .select('id')
              .eq('slug', categoryId)
              .single();

            if (categoryData) {
              dbQuery = dbQuery.eq('category_id', categoryData.id);
            }
          }
        }

        if (topicId) {
          // We need to join with categories to filter by topic_id
          dbQuery = dbQuery.eq('categories.topic_id', topicId);
        }

        const { data: questions, error } = await dbQuery.limit(50);

        if (error) throw error;

        return NextResponse.json({ questions: questions || [] });
      }

      // If a category ID is provided, get questions for that category
      if (categoryId) {
        let categoryIdValue = categoryId;

        // Check if categoryId is a slug
        if (typeof categoryId === 'string' && isNaN(Number(categoryId))) {
          // Get the category ID from the slug
          const { data: categoryData } = await supabaseServer
            .from('categories')
            .select('id')
            .eq('slug', categoryId)
            .single();

          if (categoryData) {
            categoryIdValue = categoryData.id;
          } else {
            throw new Error(`Category with slug ${categoryId} not found`);
          }
        }

        // Get questions for this category
        const { data: questions, error } = await supabaseServer
          .from('questions')
          .select('*')
          .eq('category_id', categoryIdValue)
          .order('difficulty');

        if (error) throw error;

        return NextResponse.json({ questions: questions || [] });
      }
    } catch (dbError) {
      console.error('Error using Supabase directly:', dbError);
      // Fall back to the old implementation if direct Supabase fails
    }

    // If only a topic ID is provided, use the old implementation
    if (topicId) {
      const questions = await getQuestionsByTopic(Number(topicId));
      return NextResponse.json(questions);
    }

    // If no specific parameters, return an error
    return NextResponse.json(
      { error: 'Missing required parameters. Please provide categoryId, topicId, or query.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to load questions' },
      { status: 500 }
    );
  }
}