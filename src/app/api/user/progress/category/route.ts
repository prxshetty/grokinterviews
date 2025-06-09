import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import supabaseServer from '@/utils/supabase-server';

// GET: Retrieve progress data for a specific category
export async function GET(request: NextRequest) {
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

  try {
    // Get the category ID from the query parameters
    const url = new URL(request.url);
    const categoryId = url.searchParams.get('categoryId');

    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    // Get the total number of questions in this category
    const { count: totalQuestions, error: countError } = await supabaseServer
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId);

    if (countError) {
      console.error('Error counting questions:', countError);
      return NextResponse.json({ error: 'Failed to count questions' }, { status: 500 });
    }

    // First get the IDs of questions in this category
    const { data: questionIds, error: questionIdsError } = await supabaseServer
      .from('questions')
      .select('id')
      .eq('category_id', categoryId);

    if (questionIdsError) {
      console.error('Error fetching question IDs:', questionIdsError);
      return NextResponse.json({ error: 'Failed to fetch question IDs' }, { status: 500 });
    }

    // Extract just the IDs into an array
    const questionIdArray = questionIds.map(q => q.id);

    // If there are no questions in this category, return zeros
    if (questionIdArray.length === 0) {
      return NextResponse.json({
        questionsCompleted: 0,
        totalQuestions: 0,
        completionPercentage: 0
      });
    }

    // Get the number of completed questions in this category
    // We need to handle potential duplicates in the user_activity table
    const { data: completedQuestionData, error: completedError } = await supabaseServer
      .from('user_activity')
      .select('question_id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', 'completed')
      .in('question_id', questionIdArray);
      
    if (completedError) {
      console.error('Error counting completed questions:', completedError);
      return NextResponse.json({ error: 'Failed to count completed questions' }, { status: 500 });
    }

    // Since we are now using { count: 'exact' }, we should get the count from the response
    // However, Supabase count may not be directly on the data object, so we need to be careful.
    // A more reliable way is to get the count from the 'count' property of the response object if it exists.
    // But since the structure may vary, let's process the returned data to be safe.

    // Count unique completed questions from the returned data
    const uniqueCompletedIds = new Set(completedQuestionData?.map(item => item.question_id).filter(id => id !== null));
    const questionsCompleted = uniqueCompletedIds.size;
    
    // Calculate completion percentage, ensuring totalQuestions is not null
    const finalTotalQuestions = totalQuestions ?? 0;
    const completionPercentage = finalTotalQuestions > 0 
      ? Math.round((questionsCompleted / finalTotalQuestions) * 100) 
      : 0;

    return NextResponse.json({
      questionsCompleted: questionsCompleted,
      totalQuestions: finalTotalQuestions,
      completionPercentage,
      timestamp: Date.now() // Add timestamp to prevent caching
    });

  } catch (error) {
    console.error('Error fetching category progress:', error);
    return NextResponse.json({ error: 'Failed to fetch category progress' }, { status: 500 });
  }
}
