import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import supabaseServer from '@/utils/supabase-server';

// Environment-aware logging function that only logs in development
const log = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    if (data) {
      console.log(message, data);
    } else {
      console.log(message);
    }
  }
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');
    const sectionName = searchParams.get('section');
    const entityType = searchParams.get('entityType'); // 'domain', 'section', 'topic', 'category'
    const entityId = searchParams.get('entityId');

    // Revert to explicit await for cookies() before creating the client
    const cookieStore = await cookies();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Suppressing linter error as runtime requires awaited cookies here
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    let userId = null;

    // Get the user session using Supabase auth
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Session Error:', sessionError.message);
        return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
      } else if (session?.user) {
        userId = session.user.id;
      } else {
        return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
      }
    } catch (error) {
      console.error('Error getting user session:', error);
      return NextResponse.json({ error: 'Session error' }, { status: 500 });
    }

    // Special handling for section progress using the materialized view
    if (entityType === 'section' && domain && sectionName) {
      // Use materialized view for section progress
      const { data, error } = await supabaseServer
        .from('user_section_subtopic_progress_mv')
        .select('*')
        .eq('user_id', userId)
        .eq('domain', domain)
        .eq('section_name', sectionName)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          // Return default values if no data found
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
        
        // For other errors, log and return error response
        console.error(`Error fetching section progress for ${sectionName}:`, error);
        return NextResponse.json({ error: 'Failed to fetch section progress' }, { status: 500 });
      }

      if (!data) {
        // Return default values if no data found
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

      // Map the materialized view fields to the expected response format
      const response = {
        completion_percentage: data.section_completion_percentage,
        questions_completed: 0, // Materialized view doesn't track individual questions
        total_questions: 0, // Materialized view doesn't track individual questions
        completed_children: data.completed_children,
        partially_completed_children: data.partially_completed_children,
        total_children: data.total_children,
        timestamp: Date.now()
      };

      return NextResponse.json(response);
    }

    // For other entity types, use the user_progress_summary table
    // Build the query based on the provided parameters
    let query = supabaseServer
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

  } catch (error) {
    console.error('Error fetching progress summary:', error);

    // Provide more detailed error information
    let errorMessage = 'Failed to fetch progress summary';
    if (error instanceof Error) {
      errorMessage = `${errorMessage}: ${error.message}`;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
