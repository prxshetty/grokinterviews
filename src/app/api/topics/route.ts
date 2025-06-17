import { NextRequest, NextResponse } from 'next/server';
import supabaseServer from '@/utils/supabase-server';
import { Topic, TopicWithCategories } from '@/types/database';

// Removed legacy TopicItem and TopicData types

// Removed convertToLegacyFormat helper function

// Removed mergeWithMarkdownContent helper function (was a no-op)

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const domain = url.searchParams.get('domain');

    let query = supabaseServer.from('topics').select('*');

    if (domain) {
      query = query.eq('domain', domain);
    }

    const { data: topics, error } = await query.order('name');

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
      const { data, error } = await supabaseServer
        .from('topics')
        .select('*')
        .eq('id', topicId)
        .single();
      if (error) throw error;
      topic = data;
    } else {
      const { data, error } = await supabaseServer
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

    const { data: categories, error: categoriesError } = await supabaseServer
      .from('categories')
      .select('*')
      .eq('topic_id', topic.id)
      .order('name');

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