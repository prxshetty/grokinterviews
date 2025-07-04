import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  let userId = null;

  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');
    const sectionName = searchParams.get('section');
    const entityType = searchParams.get('entityType'); // 'domain', 'section', 'topic', 'category'
    // entityId parameter available but not used in current implementation

    // Get the user using Supabase auth
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');
      userId = user.id;
    } catch (error: any) {
      console.error('User fetch Error:', error.message);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

    // Special handling for section progress using direct queries instead of materialized view
    if (entityType === 'section' && domain && sectionName) {
      try {
        // Get domain_id from domain code
        const { data: domainData, error: domainError } = await supabase
          .from('domains')
          .select('id')
          .eq('code', domain)
          .single();

        if (domainError || !domainData) {
          console.error(`Error fetching domain ${domain}:`, domainError);
          return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
        }

        // Get section_id from section name and domain
        const { data: sectionData, error: sectionError } = await supabase
          .from('sections')
          .select('id')
          .eq('name', sectionName)
          .eq('domain_id', domainData.id)
          .single();

        if (sectionError || !sectionData) {
          console.error(`Error fetching section ${sectionName} in domain ${domain}:`, sectionError);
          return NextResponse.json({ error: 'Section not found' }, { status: 404 });
        }

        // Get all topics in this section
        const { data: topics, error: topicsError } = await supabase
          .from('topics')
          .select('id')
          .eq('section_id', sectionData.id)
          .eq('domain_id', domainData.id);

        if (topicsError) {
          console.error(`Error fetching topics for section ${sectionName}:`, topicsError);
          return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 });
        }

        const totalTopics = topics?.length || 0;
        
        if (totalTopics === 0) {
          return NextResponse.json({
            completion_percentage: 0,
            questions_completed: 0,
            total_questions: 0,
            completed_children: 0,
            partially_completed_children: 0,
            total_children: 0,
            timestamp: Date.now()
          });
        }

        // Get user progress for these topics
        const topicIds = topics.map(t => t.id);
        const { data: progressData, error: progressError } = await supabase
          .from('user_progress')
          .select('topic_id, status')
          .eq('user_id', userId)
          .in('topic_id', topicIds);

        if (progressError) {
          console.error(`Error fetching progress for section ${sectionName}:`, progressError);
          return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
        }

        // Calculate completion stats
        const progressMap = new Map(progressData?.map(p => [p.topic_id, p.status]) || []);
        
        let completedTopics = 0;
        let partiallyCompletedTopics = 0;
        
        for (const topic of topics) {
          const status = progressMap.get(topic.id);
          if (status === 'completed') {
            completedTopics++;
          } else if (status === 'viewed') {
            partiallyCompletedTopics++;
          }
        }

        const completionPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

        const response = {
          completion_percentage: completionPercentage,
          questions_completed: 0, // Not tracked at section level
          total_questions: 0, // Not tracked at section level
          completed_children: completedTopics,
          partially_completed_children: partiallyCompletedTopics,
          total_children: totalTopics,
          timestamp: Date.now()
        };

        return NextResponse.json(response);
        
      } catch (error: any) {
        console.error(`Error calculating section progress for ${sectionName}:`, error);
        return NextResponse.json({
          completion_percentage: 0,
          questions_completed: 0,
          total_questions: 0,
          completed_children: 0,
          partially_completed_children: 0,
          total_children: 0,
          timestamp: Date.now()
        });
      }
    }

    // For other entity types, use direct queries instead of user_progress_summary
    // Since user_progress_summary might also be outdated, let's use direct queries
    
    if (entityType === 'domain' && domain) {
      try {
        // Get domain_id
        const { data: domainData, error: domainError } = await supabase
          .from('domains')
          .select('id')
          .eq('code', domain)
          .single();

        if (domainError || !domainData) {
          return NextResponse.json({
            completion_percentage: 0,
            questions_completed: 0,
            total_questions: 0,
            completed_children: 0,
            partially_completed_children: 0,
            total_children: 0,
            timestamp: Date.now()
          });
        }

        // Get all topics in this domain
        const { data: topics, error: topicsError } = await supabase
          .from('topics')
          .select('id')
          .eq('domain_id', domainData.id);

        if (topicsError || !topics) {
          return NextResponse.json({
            completion_percentage: 0,
            questions_completed: 0,
            total_questions: 0,
            completed_children: 0,
            partially_completed_children: 0,
            total_children: 0,
            timestamp: Date.now()
          });
        }

        const totalTopics = topics.length;
        
        if (totalTopics === 0) {
          return NextResponse.json({
            completion_percentage: 0,
            questions_completed: 0,
            total_questions: 0,
            completed_children: 0,
            partially_completed_children: 0,
            total_children: 0,
            timestamp: Date.now()
          });
        }

        // Get user progress for these topics
        const topicIds = topics.map(t => t.id);
        const { data: progressData, error: progressError } = await supabase
          .from('user_progress')
          .select('topic_id, status')
          .eq('user_id', userId)
          .in('topic_id', topicIds);

        if (progressError) {
          return NextResponse.json({
            completion_percentage: 0,
            questions_completed: 0,
            total_questions: 0,
            completed_children: 0,
            partially_completed_children: 0,
            total_children: 0,
            timestamp: Date.now()
          });
        }

        // Calculate completion stats
        const progressMap = new Map(progressData?.map(p => [p.topic_id, p.status]) || []);
        
        let completedTopics = 0;
        let partiallyCompletedTopics = 0;
        
        for (const topic of topics) {
          const status = progressMap.get(topic.id);
          if (status === 'completed') {
            completedTopics++;
          } else if (status === 'viewed') {
            partiallyCompletedTopics++;
          }
        }

        const completionPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

        return NextResponse.json({
          completion_percentage: completionPercentage,
          questions_completed: 0,
          total_questions: 0,
          completed_children: completedTopics,
          partially_completed_children: partiallyCompletedTopics,
          total_children: totalTopics,
          timestamp: Date.now()
        });
        
      } catch (error: any) {
        console.error(`Error calculating domain progress for ${domain}:`, error);
        return NextResponse.json({
          completion_percentage: 0,
          questions_completed: 0,
          total_questions: 0,
          completed_children: 0,
          partially_completed_children: 0,
          total_children: 0,
          timestamp: Date.now()
        });
      }
    }

    // Return default for unsupported entity types
    return NextResponse.json({
      completion_percentage: 0,
      questions_completed: 0,
      total_questions: 0,
      completed_children: 0,
      partially_completed_children: 0,
      total_children: 0,
      timestamp: Date.now()
    });

  } catch (error: any) {
    console.error('Error in progress summary API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}