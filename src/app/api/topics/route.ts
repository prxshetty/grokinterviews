import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { Topic, TopicWithCategories } from '@/types/database';

// Removed legacy TopicItem and TopicData types

// Removed convertToLegacyFormat helper function

// Removed mergeWithMarkdownContent helper function (was a no-op)

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  try {
    const url = new URL(request.url);
    const domain = url.searchParams.get('domain');

    let query = supabase.from('topics').select('*');

    if (domain) {
      // First get the domain ID from the domain code
      const { data: domainData, error: domainError } = await supabase
        .from('domains')
        .select('id')
        .eq('code', domain)
        .single();
      
      if (domainError || !domainData) {
        return NextResponse.json(
          { error: 'Domain not found' },
          { status: 404 }
        );
      }
      
      query = query.eq('domain_id', domainData.id);
    }

    const { data: topics, error } = await query.order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    // Return topics directly in Topic[] format
    return NextResponse.json(topics || [], {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1 hour cache
      },
    });
  } catch (error) {
    console.error('Error fetching topic data:', error);
    return NextResponse.json(
      { error: 'Failed to load topic data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  try {
    const { topicId } = await request.json();

    if (!topicId) {
      return NextResponse.json(
        { error: 'Topic ID is required' },
        { status: 400 }
      );
    }

    let topic: Topic | null = null;

    if (typeof topicId === 'number' || !isNaN(Number(topicId))) {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .eq('id', topicId)
        .single();
      if (error) throw error;
      topic = data;
    } else {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .eq('slug', topicId)
        .single();
      if (error) throw error;
      topic = data;
    }

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .eq('topic_id', topic.id)
      .order('created_at', { ascending: true });

    if (categoriesError) throw categoriesError;

    const topicWithCategories: TopicWithCategories = {
      ...topic,
      categories: categories || [],
    };

    return NextResponse.json(topicWithCategories);
  } catch (error) {
    console.error('Error fetching specific topic data:', error);
    return NextResponse.json(
      { error: 'Failed to load topic data' },
      { status: 500 }
    );
  }
}