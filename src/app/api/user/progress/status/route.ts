import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import supabaseServer from '@/utils/supabase-server';

// GET: Retrieve status of a specific question for the current user
export async function GET(request: NextRequest) {
  // Use the Next.js route handler client for authentication
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
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

    // Get the status for this question - handle multiple records by getting the most recent one
    // First try to find any record with status = 'completed'
    console.log(`Checking completion status for question ${questionId}`);
    const { data: completedData, error: completedError } = await supabaseServer
      .from('user_activity')
      .select('status, created_at, activity_type')
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1);

    if (!completedError && completedData && completedData.length > 0) {
      console.log(`Found a completed record for question ${questionId}:`, completedData[0]);
      return NextResponse.json({
        status: 'completed',
        isBookmarked: false,
        timestamp: Date.now()
      });
    } else {
      console.log(`No completed record found for question ${questionId}`);
      if (completedError) {
        console.error(`Error fetching completed records:`, completedError);
      }
    }

    // If no completed record is found, check for any record
    const { data, error } = await supabaseServer
      .from('user_activity')
      .select('status, created_at, activity_type')
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching question status:', error);
      return NextResponse.json({ status: 'unknown', error: 'Failed to fetch question status' }, { status: 500 });
    }

    // Return the status or 'unknown' if no record exists
    // Since we're now getting an array with one item (or empty array), handle accordingly
    const latestRecord = data && data.length > 0 ? data[0] : null;

    return NextResponse.json({
      status: latestRecord?.status || 'unknown',
      isBookmarked: latestRecord?.status === 'bookmarked'
    });

  } catch (error) {
    console.error('Error fetching question status:', error);
    return NextResponse.json({ status: 'unknown', error: 'Failed to fetch question status' }, { status: 500 });
  }
}
