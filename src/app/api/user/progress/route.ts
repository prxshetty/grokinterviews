import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import supabaseServer from '@/utils/supabase-server';

// GET: Retrieve user progress statistics
export async function GET(_request: NextRequest) {
  // Use the Next.js route handler client for authentication
  const supabase = createRouteHandlerClient({ cookies });
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
  const supabase = createRouteHandlerClient({ cookies });
  let userId = null;

  // Get the user session using Supabase auth
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Session Error:', sessionError.message);
    } else if (session?.user) {
      userId = session.user.id;
      console.log('Found user ID from session for POST:', userId);
    }
  } catch (error) {
    console.error('Error getting user session:', error);
    // Continue with anonymous access
  }

  try {
    // If no user ID was found, return success without saving
    if (!userId) {
      return NextResponse.json({ success: true, message: 'Not logged in, progress not saved' });
    }
    const { questionId, status } = await request.json();

    if (!questionId || !status) {
      return NextResponse.json({ error: 'Question ID and status are required' }, { status: 400 });
    }

    // First, get the topic_id for this question by following the relationships
    // 1. Get the question to find its category_id
    const { data: questionData, error: questionError } = await supabaseServer
      .from('questions')
      .select('category_id')
      .eq('id', questionId)
      .single();

    if (questionError) {
      console.error('Error fetching question:', questionError);
      return NextResponse.json({ error: 'Failed to fetch question information' }, { status: 500 });
    }

    if (!questionData || !questionData.category_id) {
      return NextResponse.json({ error: 'Question not found or has no category' }, { status: 404 });
    }

    // 2. Get the category to find its topic_id
    const { data: categoryData, error: categoryError } = await supabaseServer
      .from('categories')
      .select('topic_id')
      .eq('id', questionData.category_id)
      .single();

    if (categoryError) {
      console.error('Error fetching category:', categoryError);
      return NextResponse.json({ error: 'Failed to fetch category information' }, { status: 500 });
    }

    if (!categoryData || !categoryData.topic_id) {
      return NextResponse.json({ error: 'Category not found or has no topic' }, { status: 404 });
    }

    const topicId = categoryData.topic_id;
    
    // Determine activity type based on status
    const activity_type = status === 'completed' ? 'question_completed' :
                         status === 'viewed' ? 'question_viewed' :
                         status === 'bookmarked' ? 'question_bookmarked' : 'user_activity';
                         
    // Create metadata
    const metadata = {
      status,
      timestamp: new Date().toISOString()
    };
    
    // Use the RPC function to update user progress
    // This bypasses materialized view permission issues
    const result = await supabaseServer.rpc('update_user_progress', {
      p_user_id: userId,
      p_question_id: questionId,
      p_topic_id: topicId,
      p_category_id: questionData.category_id,
      p_status: status,
      p_activity_type: activity_type,
      p_metadata: metadata
    });

    if (result.error) {
      console.error('Error updating user progress:', result.error);
      return NextResponse.json({ error: 'Failed to update user progress' }, { status: 500 });
    }

    // Debug log to see the result
    console.log('Progress updated successfully via RPC:', {
      userId,
      questionId,
      status,
      topicId,
      categoryId: questionData.category_id
    });

    // Get the domain for this topic (for logging purposes)
    const { data: topicData, error: topicError } = await supabaseServer
      .from('topics')
      .select('domain')
      .eq('id', topicId)
      .single();

    if (topicError) {
      console.error('Error fetching topic domain:', topicError);
      // Continue anyway, this is not critical
    } else {
      console.log('Topic domain:', topicData?.domain);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating user progress:', error);
    return NextResponse.json({ error: 'Failed to update user progress' }, { status: 500 });
  }
}
