import { NextRequest, NextResponse } from 'next/server';
import supabaseServer from '@/utils/supabase-server';
import { Topic } from '@/types/database';

// Define types for topic data (for backward compatibility)
type TopicItem = {
  label: string;
  subtopics?: Record<string, TopicItem>;
};

type TopicData = {
  [key: string]: {
    label: string;
    subtopics: Record<string, TopicItem>;
  };
};

// These helper functions have been removed as we're now using the database exclusively

// Helper function to convert database topics to the legacy format
// This ensures backward compatibility with existing components
function convertToLegacyFormat(topics: Topic[]): TopicData {
  const result: TopicData = {};

  topics.forEach(topic => {
    result[topic.slug] = {
      label: topic.name,
      subtopics: {} // Will be populated when categories are fetched
    };
  });

  return result;
}

// Helper function to merge database topics with markdown content
// This function now simply returns the database topics as we no longer use markdown
async function mergeWithMarkdownContent(dbTopics: TopicData): Promise<TopicData> {
  // Simply return the database topics without any markdown processing
  return dbTopics;
}

export async function GET(request: NextRequest) {
  try {
    // Check if a domain filter is provided
    const url = new URL(request.url);
    const domain = url.searchParams.get('domain');

    // Fetch topics from the database
    let query = supabaseServer.from('topics').select('*');

    // Apply domain filter if provided
    if (domain) {
      query = query.eq('domain', domain);
    }

    const { data: topics, error } = await query.order('name');

    if (error) {
      throw error;
    }

    // Convert to legacy format for backward compatibility
    const dbFormat = convertToLegacyFormat(topics || []);

    // Merge with markdown content
    const mergedData = await mergeWithMarkdownContent(dbFormat);

    // Return the data with appropriate cache headers
    return NextResponse.json(mergedData, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1 hour cache
      },
    });
  } catch (error) {
    console.error('Error fetching topic data:', error);

    // No fallback to file-based approach anymore
    console.error('Database query failed:', error);
    return NextResponse.json(
      { error: 'Failed to load topic data' },
      { status: 500 }
    );
  }
}

// Also handle specific topic requests
export async function POST(request: NextRequest) {
  try {
    const { topicId } = await request.json();

    if (!topicId) {
      return NextResponse.json(
        { error: 'Topic ID is required' },
        { status: 400 }
      );
    }

    // Fetch the topic with its categories from the database
    let topicData: any = null;
    try {
      let topic: Topic | null = null;

      // Check if topicId is a number or a slug
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

      if (topic) {
        // Get categories for this topic
        const { data: categories, error: categoriesError } = await supabaseServer
          .from('categories')
          .select('*')
          .eq('topic_id', topic.id)
          .order('name');

        if (categoriesError) throw categoriesError;

        // Convert to legacy format for backward compatibility
        topicData = {
          [topic.slug]: {
            label: topic.name,
            subtopics: {}
          }
        };

        // Add categories as subtopics
        if (categories) {
          for (const category of categories) {
            topicData[topic.slug].subtopics[category.slug] = {
              id: category.slug,
              label: category.name,
              subtopics: {}
            };
          }
        }
      }
    } catch (dbError) {
      console.error('Error fetching topic from database:', dbError);
    }

    // Return the topic data from the database
    if (topicData) {
      return NextResponse.json(topicData);
    }

    // If we get here, we couldn't find the topic in either source
    return NextResponse.json(
      { error: 'Topic not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error fetching specific topic data:', error);
    return NextResponse.json(
      { error: 'Failed to load topic data' },
      { status: 500 }
    );
  }
}