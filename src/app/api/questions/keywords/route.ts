import { NextRequest, NextResponse } from 'next/server';
import supabaseServer from '@/utils/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword');
    const domain = url.searchParams.get('domain');
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    
    // Calculate the range for pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    console.log(`Keyword search request: keyword=${keyword}, domain=${domain}, page=${page}, pageSize=${pageSize}`);
    
    if (!keyword) {
      return NextResponse.json(
        { error: 'Keyword parameter is required' },
        { status: 400 }
      );
    }
    
    let query;
    let countQuery;
    
    // If domain is provided, use a more targeted approach
    if (domain && domain.trim() !== '') {
      console.log(`Using domain-specific query for domain: ${domain}`);
      
      // First get topics for this domain to use their IDs
      const { data: topicsData, error: topicsError } = await supabaseServer
        .from('topics')
        .select('id')
        .eq('domain', domain);
      
      if (topicsError) {
        console.error('Error fetching topics for domain:', topicsError);
        // Continue with a fallback approach
      }
      
      if (topicsData && topicsData.length > 0) {
        const topicIds = topicsData.map(topic => topic.id);
        console.log(`Found ${topicIds.length} topics for domain ${domain}: ${topicIds.join(', ')}`);
        
        // Query questions with keyword that belong to categories in these topics
        query = supabaseServer
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
          .contains('keywords', [keyword.toLowerCase()])
          .in('categories.topic_id', topicIds)
          .range(from, to);
          
        // Create a count query to get total results
        countQuery = supabaseServer
          .from('questions')
          .select(`
            id
          `, { count: 'exact', head: true })
          .contains('keywords', [keyword.toLowerCase()])
          .in('categories.topic_id', topicIds);
      } else {
        console.log(`No topics found for domain ${domain}, falling back to generic query`);
        
        // Fallback to the standard approach but still try to filter by domain
        query = supabaseServer
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
          .contains('keywords', [keyword.toLowerCase()])
          .eq('categories.topics.domain', domain)
          .range(from, to);
          
        // Create a count query to get total results
        countQuery = supabaseServer
          .from('questions')
          .select(`
            id
          `, { count: 'exact', head: true })
          .contains('keywords', [keyword.toLowerCase()])
          .eq('categories.topics.domain', domain);
      }
    } else {
      // Standard query without domain filtering
      console.log('Using standard keyword query without domain filtering');
      query = supabaseServer
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
        .contains('keywords', [keyword.toLowerCase()])
        .range(from, to);
        
      // Create a count query to get total results
      countQuery = supabaseServer
        .from('questions')
        .select(`
          id
        `, { count: 'exact', head: true })
        .contains('keywords', [keyword.toLowerCase()]);
    }
    
    // Execute both queries in parallel
    const [questionsResult, countResult] = await Promise.all([
      query,
      countQuery
    ]);
    
    const { data: questions, error } = questionsResult;
    const { count, error: countError } = countResult;
    
    if (error) {
      console.error('Error fetching questions by keyword:', error);
      return NextResponse.json(
        { error: 'Failed to fetch questions by keyword' },
        { status: 500 }
      );
    }
    
    if (countError) {
      console.error('Error counting questions by keyword:', countError);
      // Continue without count if there's an error
    }
    
    // Calculate pagination metadata
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);
    
    console.log(`Found ${totalCount} total questions for keyword "${keyword}" ${domain ? `in domain "${domain}"` : ''}`);
    console.log(`Returning page ${page} of ${totalPages} (${questions?.length || 0} questions)`);
    
    return NextResponse.json(
      { 
        questions: questions || [],
        domain: domain || null,
        keyword: keyword,
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
          'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1 hour cache
        },
      }
    );
  } catch (error) {
    console.error('Error fetching questions by keyword:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions by keyword' },
      { status: 500 }
    );
  }
} 