import { NextRequest, NextResponse } from 'next/server';
import supabaseServer from '@/utils/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const difficulty = url.searchParams.get('difficulty');
    const domainSlug = url.searchParams.get('domain');
    const sectionSlug = url.searchParams.get('section');
    const topicSlug = url.searchParams.get('topic');
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    console.log(`Difficulty filter request: difficulty=${difficulty}, domain=${domainSlug}, section=${sectionSlug}, topic=${topicSlug}, page=${page}, pageSize=${pageSize}`);
    
    if (!difficulty) {
      return NextResponse.json({ error: 'Difficulty parameter is required' }, { status: 400 });
    }
    if (!domainSlug || !sectionSlug || !topicSlug) {
      return NextResponse.json({ error: 'Domain, section, and topic parameters are required' }, { status: 400 });
    }

    // 1. Find the parent topic record using domainSlug and sectionSlug.
    const { data: topicRecord, error: topicError } = await supabaseServer
      .from('topics')
      .select('id, name')
      .eq('domain', domainSlug)
      .eq('slug', sectionSlug)
      .single();

    if (topicError || !topicRecord) {
      console.error('Error finding topic by domain and section slug:', topicError);
      return NextResponse.json({ error: `Topic not found for domain '${domainSlug}' and section '${sectionSlug}'` }, { status: 404 });
    }
    const parentTopicId = topicRecord.id;

    // 2. Find the specific category record using parentTopicId and topicSlug.
    const { data: categoryRecord, error: categoryError } = await supabaseServer
      .from('categories')
      .select('id, name')
      .eq('topic_id', parentTopicId)
      .eq('slug', topicSlug)
      .single();

    if (categoryError || !categoryRecord) {
      console.error('Error finding category by topic_id and slug:', categoryError);
      return NextResponse.json({ error: `Category not found for topic '${topicRecord.name}' and category slug '${topicSlug}'` }, { status: 404 });
    }
    const targetCategoryId = categoryRecord.id;

    // 3. Query questions within this specific category that match the difficulty.
    let query = supabaseServer
      .from('questions')
      .select('*, categories:category_id(id, name, topics:topic_id(id, name, domain))')
      .eq('category_id', targetCategoryId)
      .eq('difficulty', difficulty)
      .order('id', { ascending: true })
      .range(from, to);

    let countQuery = supabaseServer
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', targetCategoryId)
      .eq('difficulty', difficulty);

    const [questionsResult, countResult] = await Promise.all([query, countQuery]);
    const { data: questions, error: questionsFetchError } = questionsResult;
    const { count, error: countFetchError } = countResult;

    if (questionsFetchError) {
      console.error('Error fetching questions by difficulty and category:', questionsFetchError);
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }
    if (countFetchError) {
      console.error('Error counting questions by difficulty and category:', countFetchError);
      // Non-fatal
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);
    
    console.log(`Found ${totalCount} questions for difficulty "${difficulty}" in domain "${domainSlug}"`);
    console.log(`Returning page ${page} of ${totalPages} (${questions?.length || 0} questions)`);
    
    // Log the first 2 questions to verify correct data is being returned
    if (questions && questions.length > 0) {
      questions.slice(0, 2).forEach((q, i) => {
        console.log(`Question ${i+1}: ID=${q.id}, difficulty=${q.difficulty}, category=${q.category_id}, domain=${q.categories?.topics?.domain}`);
      });
    }
    
    return NextResponse.json({
      questions: questions || [],
      context: {
        domain: domainSlug,
        section: sectionSlug,
        topic: topicSlug,
        categoryName: categoryRecord.name,
        parentTopicName: topicRecord.name 
      },
      difficulty: difficulty,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    }, {
      headers: { 'Cache-Control': 'public, max-age=600, s-maxage=600' }, // 10 min cache
    });

  } catch (error) {
    console.error('Overall error in GET /api/questions/difficulty:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 