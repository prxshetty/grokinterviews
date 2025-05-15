import { NextRequest, NextResponse } from 'next/server';
import supabaseServer from '@/utils/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const difficulty = url.searchParams.get('difficulty');
    const domain = url.searchParams.get('domain');
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
    
    // Calculate the range for pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    console.log(`Difficulty filter request: difficulty=${difficulty}, domain=${domain}, page=${page}, pageSize=${pageSize}`);
    
    if (!difficulty) {
      return NextResponse.json({ error: 'Difficulty parameter is required' }, { status: 400 });
    }
    
    // Validate the domain parameter
    if (!domain) {
      return NextResponse.json({ error: 'Domain parameter is required' }, { status: 400 });
    }

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
    
    const topicIds = topicsData.map(topic => topic.id);
    console.log(`Found ${topicIds.length} topics for domain ${domain}: ${topicIds.join(', ')}`);
    
    // 2. Now get the categories for these topics
    const { data: categoriesData, error: categoriesError } = await supabaseServer
      .from('categories')
      .select('id')
      .in('topic_id', topicIds);
    
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
    
    const categoryIds = categoriesData.map(category => category.id);
    console.log(`Found ${categoryIds.length} categories for domain ${domain}`);
    
    // 3. Get questions that match both difficulty and category_id
    const countQuery = supabaseServer
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('difficulty', difficulty)
      .in('category_id', categoryIds);
    
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
      .in('category_id', categoryIds)
      .order('id', { ascending: true })
      .range(from, to);
    
    // Execute both queries in parallel
    const [countResult, questionsResult] = await Promise.all([countQuery, questionsQuery]);
    
    const { count, error: countError } = countResult;
    const { data: questions, error: questionsError } = questionsResult;
    
    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return NextResponse.json(
        { error: 'Failed to fetch questions', details: questionsError.message },
        { status: 500 }
      );
    }
    
    if (countError) {
      console.error('Error counting questions:', countError);
      // Continue with questions but without accurate count
    }
    
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);
    
    console.log(`Found ${totalCount} questions for difficulty "${difficulty}" in domain "${domain}"`);
    console.log(`Returning page ${page} of ${totalPages} (${questions?.length || 0} questions)`);
    
    // Log the first 2 questions to verify correct data is being returned
    if (questions && questions.length > 0) {
      questions.slice(0, 2).forEach((q, i) => {
        console.log(`Question ${i+1}: ID=${q.id}, difficulty=${q.difficulty}, category=${q.category_id}, domain=${q.categories?.topics?.domain}`);
      });
    }
    
    return NextResponse.json(
      { 
        questions: questions || [],
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
          'Cache-Control': 'no-store', // Don't cache these results as they're filtered by domain
        },
      }
    );
  } catch (error) {
    console.error('Error in difficulty filter API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions by difficulty', details: (error as Error).message },
      { status: 500 }
    );
  }
} 