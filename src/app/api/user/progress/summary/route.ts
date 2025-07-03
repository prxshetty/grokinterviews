import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient(); // Use the new server client
  let userId = null;

  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');
    const sectionName = searchParams.get('section');
    const entityType = searchParams.get('entityType'); // 'domain', 'section', 'topic', 'category'
    const entityId = searchParams.get('entityId');

    // Get the user using Supabase auth
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser(); // Changed getSession to getUser
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated'); // Check for user object
      userId = user.id;
    } catch (error: any) {
      console.error('User fetch Error:', error.message); // Updated log message
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

    // Special handling for section progress - use the section-progress API directly
    // This avoids the materialized view concurrency issues
    if (entityType === 'section' && domain && sectionName) {
      try {
        const fallbackResponse = await fetch(`${request.nextUrl.origin}/api/user/progress/section-progress?domain=${domain}&section=${encodeURIComponent(sectionName)}`, {
          headers: {
            'Cookie': request.headers.get('cookie') || '',
          }
        });
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          
          // Map the section-progress API response to the expected format
          return NextResponse.json({
            completion_percentage: fallbackData.completionPercentage || 0,
            questions_completed: fallbackData.questionsCompleted || 0,
            total_questions: fallbackData.totalQuestions || 0,
            completed_children: fallbackData.subtopicsCompleted || 0,
            partially_completed_children: fallbackData.partiallyCompletedSubtopics || 0,
            total_children: fallbackData.totalSubtopics || 0,
            timestamp: Date.now()
          });
        } else {
          console.error(`Section progress API returned ${fallbackResponse.status}`);
        }
      } catch (fallbackError) {
        console.error(`Section progress API call failed:`, fallbackError);
      }
      
      // Return default values if API call fails
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

    // For other entity types, use the user_progress_summary table
    // Build the query based on the provided parameters
    let query = supabase
      .from('user_progress_summary')
      .select('*')
      .eq('user_id', userId);

    // Add filters based on provided parameters
    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    if (entityId) {
      query = query.eq('entity_id', entityId);
    }

    if (domain) {
      query = query.eq('domain', domain);
    }

    if (sectionName && entityType !== 'section') {
      query = query.eq('section_name', sectionName);
    }

    // Execute the query
    const { data, error } = await query;

    if (error) {
      console.error('Error fetching progress summary:', error);
      return NextResponse.json({ error: 'Failed to fetch progress summary' }, { status: 500 });
    }

    // If we're looking for a specific entity, return just that entity
    if (entityType && (entityId || (entityType === 'domain' && domain))) {
      const entity = data && data.length > 0 ? data[0] : null;

      if (!entity) {
        // Return default values if no entity is found
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

      const response = {
        completion_percentage: entity.completion_percentage,
        questions_completed: entity.questions_completed,
        total_questions: entity.total_questions,
        completed_children: entity.completed_children,
        partially_completed_children: entity.partially_completed_children,
        total_children: entity.total_children,
        timestamp: Date.now()
      };

      return NextResponse.json(response);
    }

    // Otherwise, return all matching entities
    return NextResponse.json({
      entities: data || [],
      timestamp: Date.now()
    });

  } catch (error: any) {
    console.error('Error fetching progress summary:', error);

    // Provide more detailed error information
    let errorMessage = 'Failed to fetch progress summary';
    if (error instanceof Error) errorMessage = `${errorMessage}: ${error.message}`;
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}