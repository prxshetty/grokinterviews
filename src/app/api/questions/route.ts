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
    const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : 20; // Default limit for general queries
    const domain = url.searchParams.get('domain');
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20'); // Default pageSize for domain/difficulty queries

    // ---- New logic for domain and difficulty based filtering (from former /api/questions/difficulty) ----
    if (domain && difficulty) {
      console.log(`Domain/Difficulty filter request: domain=${domain}, difficulty=${difficulty}, page=${page}, pageSize=${pageSize}`);
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // 1. First get the topic IDs for the specified domain
      const { data: topicsData, error: topicsError } = await supabaseServer
        .from('topics')
        .select('id')
        .eq('domain', domain);
      
      if (topicsError) {
        console.error('Error fetching topics for domain:', topicsError);
        return NextResponse.json(
          { error: 'Failed to fetch topics for domain', details: topicsError.message },
          { status: 500 }
        );
      }
      
      if (!topicsData || topicsData.length === 0) {
        console.log(`No topics found for domain ${domain}, returning empty result`);
        return NextResponse.json({ 
          questions: [],
          domain,
          difficulty,
          pagination: { page: 1, pageSize, totalCount: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false }
        });
      }
      
      const topicIdsFromDomain = topicsData.map(topic => topic.id);
      console.log(`Found ${topicIdsFromDomain.length} topics for domain ${domain}: ${topicIdsFromDomain.join(', ')}`);
      
      // 2. Now get the categories for these topics
      const { data: categoriesData, error: categoriesError } = await supabaseServer
        .from('categories')
        .select('id')
        .in('topic_id', topicIdsFromDomain);
      
      if (categoriesError) {
        console.error('Error fetching categories for topics:', categoriesError);
        return NextResponse.json(
          { error: 'Failed to fetch categories', details: categoriesError.message },
          { status: 500 }
        );
      }
      
      if (!categoriesData || categoriesData.length === 0) {
        console.log(`No categories found for topics in domain ${domain}, returning empty result`);
        return NextResponse.json({ 
          questions: [],
          domain,
          difficulty,
          pagination: { page: 1, pageSize, totalCount: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false }
        });
      }
      
      const categoryIdsFromDomain = categoriesData.map(category => category.id);
      console.log(`Found ${categoryIdsFromDomain.length} categories for domain ${domain}`);
      
      // 3. Get questions that match both difficulty and category_id
      const countQuery = supabaseServer
        .from('questions')
        .select('id', { count: 'exact', head: true })
        .eq('difficulty', difficulty)
        .in('category_id', categoryIdsFromDomain);
      
      const questionsQuery = supabaseServer
        .from('questions')
        .select(`
          *,
          categories:category_id (
            id,
            name,
            topic_id,
            topics (
              id, 
              name,
              domain
            )
          )
        `)
        .eq('difficulty', difficulty)
        .in('category_id', categoryIdsFromDomain)
        .order('id', { ascending: true })
        .range(from, to);
      
      const [countResult, questionsResult] = await Promise.all([countQuery, questionsQuery]);
      
      const { count, error: countError } = countResult;
      const { data: questionsData, error: questionsError } = questionsResult;
      
      if (questionsError) {
        console.error('Error fetching questions by domain/difficulty:', questionsError);
        return NextResponse.json(
          { error: 'Failed to fetch questions', details: questionsError.message },
          { status: 500 }
        );
      }
      
      if (countError) {
        console.error('Error counting questions by domain/difficulty:', countError);
        // Continue with questions but without accurate count if needed, or return error
      }
      
      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / pageSize);
      
      return NextResponse.json(
        { 
          questions: questionsData || [],
          domain,
          difficulty,
          pagination: {
            page,
            pageSize,
            totalCount,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1
          }
        },
        {
          headers: {
            'Cache-Control': 'no-store', 
          },
        }
      );
    }
    // ---- End of new logic ----

    // If no specific parameters (and not handled by domain/difficulty above), return recent questions
    if (!categoryId && !topicId && !difficulty && !query && !domain) {
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
      { error: 'Failed to load questions', details: (error as Error).message },
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