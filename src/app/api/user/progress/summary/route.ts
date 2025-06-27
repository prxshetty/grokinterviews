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

    // Special handling for section progress using the materialized view
    if (entityType === 'section' && domain && sectionName) {
      // Use materialized view for section progress
      const { data, error } = await supabase
        .from('user_section_subtopic_progress_mv')
        .select('*')
        .eq('user_id', userId)
        .eq('domain', domain)
        .eq('section_name', sectionName)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          // Try to refresh the materialized view
          try {
            const { error: refreshError } = await supabase.rpc('refresh_section_progress');
            if (refreshError) {
              console.error(`Error refreshing section progress:`, refreshError);
            } else {
              
              // Retry the query after refresh
              const { data: retryData, error: retryError } = await supabase
                .from('user_section_subtopic_progress_mv')
                .select('*')
                .eq('user_id', userId)
                .eq('domain', domain)
                .eq('section_name', sectionName)
                .single();
                
              if (!retryError && retryData) {
                const response = {
                  completion_percentage: retryData.section_completion_percentage || 0,
                  questions_completed: 0,
                  total_questions: 0,
                  completed_children: retryData.completed_children || 0,
                  partially_completed_children: retryData.partially_completed_children || 0,
                  total_children: retryData.total_children || 0,
                  timestamp: Date.now()
                };
                return NextResponse.json(response);
              }
            }
          } catch (refreshError) {
            console.error(`Error calling refresh function:`, refreshError);
          }
          
          // Fall back to the section-progress API
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
            }
          } catch (fallbackError) {
            console.error(`Fallback API call failed:`, fallbackError);
          }
          
          // Return default values if fallback also fails
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
      // Handle null values properly
      const response = {
        completion_percentage: data.section_completion_percentage || 0,
        questions_completed: 0, // Materialized view doesn't track individual questions
        total_questions: 0, // Materialized view doesn't track individual questions
        completed_children: data.completed_children || 0,
        partially_completed_children: data.partially_completed_children || 0,
        total_children: data.total_children || 0,
        timestamp: Date.now()
      };

      return NextResponse.json(response);
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