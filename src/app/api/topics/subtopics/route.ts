import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
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

    // Get all topics for the domain using normalized structure
    const { data: topics, error } = await supabase
      .from('topics')
      .select('id, name, sections!inner(name), domains!inner(code)')
      .eq('domains.code', domain);

    if (error) {
      console.error('Error fetching topics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch topics' },
        { status: 500 }
      );
    }

    // Group topics by section name to identify subtopics
    const topicsBySection: Record<string, Array<{
      id: number;
      name: string;
      section_name: string | null;
    }>> = {};

    topics?.forEach(topic => {
      const sectionName = (topic.sections as any)?.name;
      if (sectionName) {
        if (!topicsBySection[sectionName]) {
          topicsBySection[sectionName] = [];
        }
        topicsBySection[sectionName]?.push({
          id: topic.id,
          name: topic.name,
          section_name: sectionName
        });
      }
    });

    // Convert grouped topics to subtopics format
    const subtopics: Array<{ id: number; name: string; section_name: string }> = [];
    
    Object.entries(topicsBySection).forEach(([sectionName, topicsInSection]) => {
      topicsInSection.forEach(topic => {
        subtopics.push({
          id: topic.id,
          name: topic.name,
          section_name: sectionName
        });
      });
    });

    console.log(`Found ${subtopics.length} subtopics for domain ${domain}`);

    // Get all categories for these subtopics to verify they have categories
    const subtopicIds = subtopics.map(subtopic => subtopic.id);
    const { data: categories, error: categoriesError } = await supabase
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
