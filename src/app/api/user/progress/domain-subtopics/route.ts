import { NextRequest, NextResponse } from 'next/server';
// import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'; // Old import
// import { cookies } from 'next/headers'; // Old import
import { createClient } from '@/utils/supabase/server'; // New import for @supabase/ssr server client
// import supabaseServer from '@/utils/supabase-server'; // To be removed

// GET: Retrieve progress for all subtopics in a domain
export async function GET(request: NextRequest) {
  const supabase = await createClient(); // Use the new server client
  let userId = null;

  // Get the user using Supabase auth
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser(); // Changed getSession to getUser
    if (userError) throw userError;
    if (!user) throw new Error('User not authenticated');
    userId = user.id;
  } catch (error: any) {
    console.error('Domain-subtopics User/Auth Error:', error.message); // Updated log
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const domain = url.searchParams.get('domain');
    const topicId = url.searchParams.get('topicId');
    const sectionParam = url.searchParams.get('section');
    const mainTopicsOnly = url.searchParams.get('mainTopicsOnly') === 'true';

    if (!domain) {
      return NextResponse.json({ error: 'Domain parameter is required' }, { status: 400 });
    }

    // First get the domain_id from the domain code
    const { data: domainData, error: domainError } = await supabase
      .from('domains')
      .select('id')
      .eq('code', domain)
      .single();

    if (domainError || !domainData) {
      console.error(`Error fetching domain ${domain}:`, domainError);
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    // Get all sections for this domain to create section map
    const { data: sections, error: sectionsError } = await supabase
      .from('sections')
      .select('id, name')
      .eq('domain_id', domainData.id);

    if (sectionsError) {
      console.error(`Error fetching sections for domain ${domain}:`, sectionsError);
      return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 });
    }

    // Create a map of section_id to section_name
    const sectionMap = new Map(sections?.map(section => [section.id, section.name]) || []);

    // Build the topics query based on filtering parameters
    let topicsQuery = supabase
      .from('topics')
      .select('id, name, section_id')
      .eq('domain_id', domainData.id)
      .order('created_at');

    // Apply filtering based on parameters
    if (topicId && topicId !== domain) {
      // If topicId is provided and it's not the domain itself, try to filter
      const topicIdNum = parseInt(topicId);
      if (!isNaN(topicIdNum)) {
        // It's a numeric topic ID, filter by that specific topic
        topicsQuery = topicsQuery.eq('id', topicIdNum);
      } else {
        // It might be a section name, find the section_id first
        const matchingSection = sections?.find(s => s.name === topicId);
        if (matchingSection) {
          topicsQuery = topicsQuery.eq('section_id', matchingSection.id);
        }
      }
    } else if (sectionParam) {
      // Filter by specific section name
      const matchingSection = sections?.find(s => s.name === sectionParam);
      if (matchingSection) {
        topicsQuery = topicsQuery.eq('section_id', matchingSection.id);
      }
    }

    // Execute the topics query
    const { data: topics, error: topicsError } = await topicsQuery;

    if (topicsError) {
      console.error(`Error fetching topics for domain ${domain}:`, topicsError);
      return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 });
    }

    if (!topics || topics.length === 0) {
      return NextResponse.json({ subtopics: [] });
    }

    // Transform the data to match the expected structure
    let subtopics = topics.map(topic => ({
            id: topic.id,
            name: topic.name,
      section_name: sectionMap.get(topic.section_id) || 'Unknown Section',
      section_id: topic.section_id
    }));

    // Apply mainTopicsOnly filter if requested
    if (mainTopicsOnly) {
      // Get unique sections and find the first (main) topic for each
      const uniqueSections = new Set(subtopics.map(s => s.section_id).filter(Boolean));
      const mainTopicIds = new Set<number>();
      
      for (const sectionId of uniqueSections) {
        const topicsInSection = subtopics.filter(s => s.section_id === sectionId);
        if (topicsInSection.length > 0) {
          // Sort by ID to get the first one (assuming lower IDs are main topics)
          topicsInSection.sort((a, b) => a.id - b.id);
          const firstTopic = topicsInSection[0];
          if (firstTopic) {
            mainTopicIds.add(firstTopic.id);
          }
        }
      }

      subtopics = subtopics.filter(s => mainTopicIds.has(s.id));
    }

    // Get user progress for all relevant topics
    const topicIds = subtopics.map(s => s.id);
    const { data: progressData, error: progressError } = await supabase
      .from('user_progress')
      .select('topic_id, status')
        .eq('user_id', userId)
      .in('topic_id', topicIds);

    if (progressError) {
      console.error(`Error fetching progress data:`, progressError);
      // Don't fail the request, just return topics without progress
    }

    // Create progress map for efficient lookup
    const progressMap = new Map(progressData?.map(p => [p.topic_id, p.status]) || []);

    // Add progress information to subtopics
    const subtopicsWithProgress = subtopics.map(subtopic => ({
      ...subtopic,
      progress_status: progressMap.get(subtopic.id) || 'not_started',
      is_completed: progressMap.get(subtopic.id) === 'completed',
      is_viewed: progressMap.has(subtopic.id)
    }));

    return NextResponse.json(
      { subtopics: subtopicsWithProgress },
      {
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1 hour cache
        },
      }
    );

  } catch (error: any) {
    console.error('Error in domain-subtopics API route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
