import { NextRequest, NextResponse } from 'next/server';
import supabaseServer from '@/utils/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword');
    const domainSlug = url.searchParams.get('domain'); // Renamed for clarity
    const sectionSlug = url.searchParams.get('section'); // New param
    const topicSlug = url.searchParams.get('topic');     // New param

    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    if (!keyword) {
      return NextResponse.json({ error: 'Keyword parameter is required' }, { status: 400 });
    }
    if (!domainSlug || !sectionSlug || !topicSlug) {
      return NextResponse.json({ error: 'Domain, section, and topic parameters are required' }, { status: 400 });
    }

    // 1. Find the parent topic record using domainSlug and sectionSlug.
    //    sectionSlug from the URL corresponds to topics.slug based on TopicDataService logic.
    const { data: topicRecord, error: topicError } = await supabaseServer
      .from('topics')
      .select('id, name')
      .eq('domain', domainSlug)
      .eq('slug', sectionSlug) // sectionSlug is the slug of a "Topic" entry in the topics table
      .single();

    if (topicError || !topicRecord) {
      console.error('Error finding topic by domain and section slug:', topicError);
      return NextResponse.json({ error: `Topic not found for domain '${domainSlug}' and section '${sectionSlug}'` }, { status: 404 });
    }
    const parentTopicId = topicRecord.id;

    // 2. Find the specific category record using parentTopicId and topicSlug.
    //    topicSlug from the URL corresponds to categories.slug.
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

    // 3. Query questions within this specific category that contain the keyword.
    let query = supabaseServer
      .from('questions')
      .select('*, categories:category_id(id, name, topics:topic_id(id, name, domain))')
      .eq('category_id', targetCategoryId)
      .contains('keywords', [keyword.toLowerCase()])
      .range(from, to);

    let countQuery = supabaseServer
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', targetCategoryId)
      .contains('keywords', [keyword.toLowerCase()]);

    const [questionsResult, countResult] = await Promise.all([query, countQuery]);
    const { data: questions, error: questionsFetchError } = questionsResult;
    const { count, error: countFetchError } = countResult;

    if (questionsFetchError) {
      console.error('Error fetching questions by keyword and category:', questionsFetchError);
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }
    if (countFetchError) {
      console.error('Error counting questions by keyword and category:', countFetchError);
      // Non-fatal, proceed with questions if available
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    return NextResponse.json({
      questions: questions || [],
      context: {
        domain: domainSlug,
        section: sectionSlug,
        topic: topicSlug,
        categoryName: categoryRecord.name,
        parentTopicName: topicRecord.name
      },
      keyword: keyword,
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
    console.error('Overall error in GET /api/questions/keywords:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
} 