import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import supabaseServer from '@/utils/supabase-server';

// GET: Retrieve progress data for a specific category
export async function GET(request: NextRequest) {
  // Use the Next.js route handler client for authentication
  const supabase = createRouteHandlerClient({ cookies });
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

    // Get the number of completed questions in this category
    const { count: questionsCompleted, error: completedError } = await supabaseServer
      .from('user_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed')
      .in('question_id', 
        supabaseServer
          .from('questions')
          .select('id')
          .eq('category_id', categoryId)
      );

    if (completedError) {
      console.error('Error counting completed questions:', completedError);
      return NextResponse.json({ error: 'Failed to count completed questions' }, { status: 500 });
    }

    // Calculate completion percentage
    const completionPercentage = totalQuestions ? Math.round((questionsCompleted / totalQuestions) * 100) : 0;

    return NextResponse.json({
      questionsCompleted: questionsCompleted || 0,
      totalQuestions: totalQuestions || 0,
      completionPercentage
    });

  } catch (error) {
    console.error('Error fetching category progress:', error);
    return NextResponse.json({ error: 'Failed to fetch category progress' }, { status: 500 });
  }
}
