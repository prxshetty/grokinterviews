import { NextRequest, NextResponse } from 'next/server';
import supabaseServer from '@/utils/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const domain = url.searchParams.get('domain');

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain parameter is required' },
        { status: 400 }
      );
    }

    console.log(`API - Fetching subtopics for domain: ${domain}`);

    // In this database structure:
    // - The "topics" table contains both topics and subtopics
    // - Topics have section_name values
    // - Subtopics are individual rows with a section_name that matches a topic
    // - Categories have a topic_id that refers to a subtopic

    // First, get all topics (section headers) for this domain
    const { data: sectionHeaders, error: sectionHeadersError } = await supabaseServer
      .from('topics')
      .select('id, name, section_name')
      .eq('domain', domain)
      .order('created_at');

    if (sectionHeadersError) {
      console.error(`Error fetching section headers for domain ${domain}:`, sectionHeadersError);
      return NextResponse.json(
        { error: 'Failed to fetch section headers' },
        { status: 500 }
      );
    }

    if (!sectionHeaders || sectionHeaders.length === 0) {
      console.log(`No section headers found for domain ${domain}`);
      return NextResponse.json([]);
    }

    // Group topics by section_name to identify subtopics
    const topicsBySection = {};
    sectionHeaders.forEach(topic => {
      if (topic.section_name) {
        if (!topicsBySection[topic.section_name]) {
          topicsBySection[topic.section_name] = [];
        }
        topicsBySection[topic.section_name].push(topic);
      }
    });

    // Get all subtopics (individual topics within sections)
    const subtopics = [];
    Object.values(topicsBySection).forEach(topics => {
      if (topics.length > 0) {
        // Add each topic as a subtopic
        topics.forEach(topic => {
          subtopics.push({
            id: topic.id,
            name: topic.name,
            section_name: topic.section_name
          });
        });
      }
    });

    console.log(`Found ${subtopics.length} subtopics for domain ${domain}`);

    // Get all categories for these subtopics to verify they have categories
    const subtopicIds = subtopics.map(subtopic => subtopic.id);
    const { data: categories, error: categoriesError } = await supabaseServer
      .from('categories')
      .select('id, topic_id')
      .in('topic_id', subtopicIds);

    if (categoriesError) {
      console.error(`Error fetching categories for subtopics in domain ${domain}:`, categoriesError);
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      );
    }

    // Filter subtopics to only include those with categories
    const subtopicsWithCategories = subtopics.filter(subtopic =>
      categories.some(category => category.topic_id === subtopic.id)
    );

    console.log(`Returning ${subtopicsWithCategories.length} subtopics with categories`);
    return NextResponse.json(subtopicsWithCategories);
  } catch (error) {
    console.error('Error fetching subtopics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subtopics' },
      { status: 500 }
    );
  }
}
