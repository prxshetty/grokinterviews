import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import supabaseServer from '@/utils/supabase-server';

// GET: Retrieve status of a specific question for the current user
export async function GET(request: NextRequest) {
  // Use the Next.js route handler client for authentication
  const supabase = createRouteHandlerClient({ cookies });
  let userId = null;

  // Get the user session using Supabase auth
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Session Error:', sessionError.message);
      return NextResponse.json({ status: 'unknown', error: 'Authentication error' }, { status: 401 });
    } else if (session?.user) {
      userId = session.user.id;
    } else {
      return NextResponse.json({ status: 'unknown', error: 'User not authenticated' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error getting user session:', error);
    return NextResponse.json({ status: 'unknown', error: 'Session error' }, { status: 500 });
  }

  try {
    // Get the question ID from the query parameters
    const url = new URL(request.url);
    const questionId = url.searchParams.get('questionId');

    if (!questionId) {
      return NextResponse.json({ status: 'unknown', error: 'Question ID is required' }, { status: 400 });
    }

    // Get the status for this question
    const { data, error } = await supabaseServer
      .from('user_progress')
      .select('status')
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching question status:', error);
      return NextResponse.json({ status: 'unknown', error: 'Failed to fetch question status' }, { status: 500 });
    }

    // Return the status or 'unknown' if no record exists
    return NextResponse.json({ 
      status: data?.status || 'unknown',
      isBookmarked: data?.status === 'bookmarked'
    });

  } catch (error) {
    console.error('Error fetching question status:', error);
    return NextResponse.json({ status: 'unknown', error: 'Failed to fetch question status' }, { status: 500 });
  }
}
