import { NextRequest, NextResponse } from 'next/server';
import supabaseServer from '@/utils/supabase-server';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const categoryId = url.searchParams.get('categoryId');
    const topicId = url.searchParams.get('topicId');
    const difficulty = url.searchParams.get('difficulty') as 'easy' | 'medium' | 'hard' | null;
    const query = url.searchParams.get('query');
    const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : 20;

    // If no specific parameters, return recent questions
    if (!categoryId && !topicId && !difficulty && !query) {
      const { data: questions, error } = await supabaseServer
        .from('questions')
        .select(`
          id,
          question_text,
          difficulty,
          category_id,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recent questions:', error);
        return NextResponse.json(
          { error: 'Failed to fetch recent questions' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { questions: questions || [] },
        {
          headers: {
            'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1 hour cache
          },
        }
      );
    }

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
      // Fallback to old implementation was here, now removed.
      // If Supabase fails, we will proceed to the parameter check or error.
    }

    // If Supabase direct access failed or parameters didn't match Supabase paths:
    // Check if any specific parameters were provided that should have been handled by Supabase logic.
    // If only topicId was provided, it would have previously hit the SQLite fallback.
    // Now, it will fall through to the "Missing required parameters" error if not handled by Supabase paths.

    // If no specific parameters were matched by Supabase logic above (e.g. only topicId, which had its fallback removed)
    // or if Supabase itself had an error and we chose not to rethrow,
    // this will catch cases that are not valid for this API endpoint's current Supabase-only capabilities.
    return NextResponse.json(
      { error: 'Missing required parameters or operation failed. Please provide categoryId, or a search query. Fetching by topicId alone is not supported via this direct questions endpoint in this version.' },
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
      // Fallback to old implementation was here, now removed.
      // If Supabase fails, we will proceed to the parameter check or error.
    }

    // If Supabase direct access failed or parameters didn't match Supabase paths:
    // Check if any specific parameters were provided that should have been handled by Supabase logic.
    // If only topicId was provided, it would have previously hit the SQLite fallback.
    // Now, it will fall through to the "Missing required parameters" error if not handled by Supabase paths.

    // If no specific parameters were matched by Supabase logic above (e.g. only topicId, which had its fallback removed)
    // or if Supabase itself had an error and we chose not to rethrow,
    // this will catch cases that are not valid for this API endpoint's current Supabase-only capabilities.
    return NextResponse.json(
      { error: 'Missing required parameters or operation failed. Please provide categoryId, or a search query. Fetching by topicId alone is not supported via this direct questions endpoint in this version.' },
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