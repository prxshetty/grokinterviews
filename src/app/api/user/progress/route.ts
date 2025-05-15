import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import supabaseServer from '@/utils/supabase-server';

// GET: Retrieve user progress statistics
export async function GET(_request: NextRequest) {
  // Use the Next.js route handler client for authentication
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
    } else if (session?.user) {
      userId = session.user.id;
      console.log('Found user ID from session:', userId);
    }
  } catch (error) {
    console.error('Error getting user session:', error);
    // Continue with anonymous access
  }

  try {
    // If no user ID was found, return default values
    if (!userId) {
      return NextResponse.json({
        questionsCompleted: 0,
        questionsViewed: 0,
        totalQuestions: 0,
        completionPercentage: 0,
        domainsSolved: 0,
        totalDomains: 0
      });
    }

    // Get total number of questions
    const { count: totalQuestions, error: countError } = await supabaseServer
      .from('questions')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error counting questions:', countError);
      return NextResponse.json({ error: 'Failed to count questions' }, { status: 500 });
    }

    // Get completed questions count
    const { count: completedQuestions, error: completedError } = await supabaseServer
      .from('user_activity')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed');

    if (completedError) {
      console.error('Error counting completed questions:', completedError);
      return NextResponse.json({ error: 'Failed to count completed questions' }, { status: 500 });
    }

    // Get viewed questions count
    const { count: viewedQuestions, error: viewedError } = await supabaseServer
      .from('user_activity')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'viewed');

    if (viewedError) {
      console.error('Error counting viewed questions:', viewedError);
      return NextResponse.json({ error: 'Failed to count viewed questions' }, { status: 500 });
    }

    // Get distinct domains the user has completed questions in
    // First get the questions the user has completed
    const { data: userProgress, error: progressError } = await supabaseServer
      .from('user_activity')
      .select('question_id')
      .eq('user_id', userId)
      .eq('status', 'completed');

    if (progressError) {
      console.error('Error fetching user progress:', progressError);
      return NextResponse.json({ error: 'Failed to fetch user progress' }, { status: 500 });
    }

    // Get the domains for these questions
    const questionIds = userProgress?.map((item: { question_id: number }) => item.question_id) || [];

    // If no completed questions, set domains to empty
    let domainsSolved = 0;
    let totalDomains = 0;

    if (questionIds.length > 0) {
      // Get unique domains from the questions the user has completed
      // This is a simplified query that just gets the domains
      const { data: questionsData, error: domainsError } = await supabaseServer
        .from('questions')
        .select(`
          id,
          category_id
        `)
        .in('id', questionIds);

      if (domainsError) {
        console.error('Error fetching questions:', domainsError);
        return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
      }

      // Get the categories for these questions
      const categoryIds = questionsData?.map(q => q.category_id).filter(Boolean) || [];

      if (categoryIds.length > 0) {
        const { data: categoriesData, error: categoriesError } = await supabaseServer
          .from('categories')
          .select(`
            id,
            topic_id
          `)
          .in('id', categoryIds);

        if (categoriesError) {
          console.error('Error fetching categories:', categoriesError);
          return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
        }

        // Get the topics for these categories
        const topicIds = categoriesData?.map(c => c.topic_id).filter(Boolean) || [];

        if (topicIds.length > 0) {
          const { data: topicsData, error: topicsError } = await supabaseServer
            .from('topics')
            .select(`
              id,
              domain
            `)
            .in('id', topicIds);

          if (topicsError) {
            console.error('Error fetching topics:', topicsError);
            return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 });
          }

          // Extract unique domains
          const uniqueDomains = new Set();
          topicsData?.forEach(topic => {
            if (topic.domain) {
              uniqueDomains.add(topic.domain);
            }
          });

          domainsSolved = uniqueDomains.size;
        }
      }
    }

    // Get total number of domains
    const { data: allDomains, error: allDomainsError } = await supabaseServer
      .from('topics')
      .select('domain');

    if (allDomainsError) {
      console.error('Error fetching all domains:', allDomainsError);
      return NextResponse.json({ error: 'Failed to fetch all domains' }, { status: 500 });
    }

    // Count unique domains
    const uniqueAllDomains = new Set();
    allDomains?.forEach(item => {
      if (item.domain) {
        uniqueAllDomains.add(item.domain);
      }
    });

    totalDomains = uniqueAllDomains.size;

    // Calculate completion percentage
    const completionPercentage = totalQuestions ? Math.round(((completedQuestions || 0) / totalQuestions) * 100) : 0;

    // Debug log to see the values
    console.log('Progress calculation:', {
      completedQuestions,
      totalQuestions,
      completionPercentage
    });

    return NextResponse.json({
      questionsCompleted: completedQuestions || 0,
      questionsViewed: viewedQuestions || 0,
      totalQuestions: totalQuestions || 0,
      completionPercentage,
      domainsSolved,
      totalDomains
    });

  } catch (error) {
    console.error('Error fetching user progress:', error);
    return NextResponse.json({ error: 'Failed to fetch user progress' }, { status: 500 });
  }
}

// POST: Update user progress
export async function POST(request: NextRequest) {
  // Use the Next.js route handler client for authentication
  const cookieStore = await cookies();
  // @ts-ignore
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  let userId = null;

  // Get user session
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session?.user) throw new Error('User not authenticated');
    userId = session.user.id;
  } catch (error: any) {
    console.error('Session Error:', error.message);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }

  try {
    const { questionId, status, topicId, categoryId } = await request.json();

    // Validate required fields for user_progress
    if (!questionId || !status || !topicId || !categoryId) {
       console.error('Missing required fields for progress update:', { questionId, status, topicId, categoryId });
      return NextResponse.json({ error: 'Question ID, status, Topic ID, and Category ID are required' }, { status: 400 });
    }
    
    console.log(`Updating user_progress for Q:${questionId} to ${status} (Topic:${topicId}, Cat:${categoryId}) for User:${userId}`);

    // Upsert the progress record in the user_progress table
    const { error: userProgressUpsertError } = await supabaseServer
      .from('user_progress')
      .upsert(
        {
          user_id: userId,
          question_id: questionId,
          topic_id: topicId,      // Now provided by client
          category_id: categoryId,  // Now provided by client
          status: status,
          updated_at: new Date().toISOString() // Ensure update timestamp is set
        },
        {
          onConflict: 'user_id, question_id', // Assumes unique constraint exists on user_progress
          // Explicitly set ignoreDuplicates to false to ensure UPDATE on conflict
          ignoreDuplicates: false
        }
      );

    if (userProgressUpsertError) {
      // Specific log for user_progress failure
      console.error(`Failed to upsert into user_progress table for user ${userId}, question ${questionId}.`);
      // Log the full error object for debugging details
      console.error('Raw user_progress upsertError object:', userProgressUpsertError);

      // Log specific constraint violation errors if they occur for user_progress itself
      if (userProgressUpsertError.code === '23503') { // foreign key violation
         console.error('Foreign key violation on user_progress. Check if topic_id/category_id/question_id exist.');
      }
      // We don't expect 23505 here normally due to ON CONFLICT, but log if it happens.
      if (userProgressUpsertError.code === '23505') {
         console.error('Unique constraint (23505) reported during user_progress upsert. Investigate concurrency or ON CONFLICT.');
      }
      // Return a generic error, avoiding potentially misleading details from the raw error object
      return NextResponse.json({ error: 'Failed initial user progress status update.' }, { status: 500 });
    }

    // Additionally, log the activity in user_activity (no conflict check needed for logs)
    try {
      const { error: logError } = await supabaseServer
        .from('user_activity')
        .insert({
          user_id: userId,
          question_id: questionId,
          topic_id: topicId,
          category_id: categoryId,
          status: status, // Log the status being set
          activity_type: status === 'completed' ? 'question_completed' : 
                         status === 'viewed' ? 'question_viewed' : 
                         'progress_update',
          created_at: new Date().toISOString(),
          // We can fetch domain later if needed for analytics enrichment
        });

      if (logError) {
        console.warn('Failed to log user activity:', logError.message);
        // Don't fail the request, logging is secondary
      }
    } catch (logCatchError: any) {
      console.warn('Exception during activity logging:', logCatchError.message);
    }
    
    // Get domain and section_name for progress recalculation queue
    try {
      // Get the domain and section_name for the given topic ID
      const { data: topicData, error: topicError } = await supabaseServer
        .from('topics')
        .select('domain, section_name')
        .eq('id', topicId)
        .single();
      
      if (topicError) {
        console.warn(`Failed to get topic data for recalculation queue: ${topicError.message}`);
      } else if (topicData) {
        const queueRecord = {
            user_id: userId,
            question_id: questionId,
            category_id: categoryId,
            topic_id: topicId,
            domain: topicData.domain || 'unknown',
            section_name: topicData.section_name || 'unknown',
            created_at: new Date().toISOString(),
            processed_at: null // Reset processed_at to ensure it's picked up by the next recalculation
        };

        // Try inserting first
        const { error: insertError } = await supabaseServer
            .from('progress_recalculation_queue')
            .insert(queueRecord);

        if (insertError) {
            // If it's the unique constraint violation (23505), try updating the existing record
            if (insertError.code === '23505') {
                console.warn(`Queue insert failed (23505), attempting update for user ${userId}, question ${questionId}.`);
                const { error: updateError } = await supabaseServer
                    .from('progress_recalculation_queue')
                    .update({ // Update relevant fields, especially processed_at to ensure reprocessing
                        category_id: categoryId,
                        topic_id: topicId,
                        domain: topicData.domain || 'unknown',
                        section_name: topicData.section_name || 'unknown',
                        created_at: new Date().toISOString(), // Keep created_at timestamp fresh
                        processed_at: null
                    })
                    .eq('user_id', userId)
                    .eq('question_id', questionId);

                if (updateError) {
                    // Log update errors but don't fail the main request
                    console.error(`Failed to update recalculation queue after insert conflict: ${updateError.message}`);
                } else {
                    console.log(`Successfully updated recalculation queue entry for user ${userId}, question ${questionId}.`);
                }
            } else {
                // Log other insert errors as warnings
                console.warn(`Failed to insert into recalculation queue: ${insertError.message}`);
            }
        } else {
             console.log(`Successfully inserted into recalculation queue for user ${userId}, question ${questionId}.`);
        }
      }
    } catch (recalcError: any) {
      console.warn(`Error during recalculation queue handling: ${recalcError.message}`);
      // Don't fail the main request for background process issues
    }
    

    console.log(`Successfully updated user_progress for question ${questionId} to ${status}`);
    return NextResponse.json({ success: true });

  } catch (error: any) {
    // This is the final catch-all for the entire POST request
    console.error('Outer catch: Error processing progress update request:', error);
    // Handle JSON parsing errors or other unexpected issues
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    // Return a generic server error message
    return NextResponse.json({ error: 'Server error during progress update.', details: error?.message || 'Unknown error' }, { status: 500 });
  }
}
