import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import supabaseServer from '@/utils/supabase-server';

// Define cache control headers for different scenarios
const CACHE_HEADERS = {
  short: {
    'Cache-Control': 'public, max-age=10, s-maxage=15', // Cache for 10 seconds
  },
  medium: {
    'Cache-Control': 'public, max-age=60, s-maxage=120', // Cache for 1 minute
  },
  long: {
    'Cache-Control': 'public, max-age=300, s-maxage=600', // Cache for 5 minutes
  }
};

// GET: Retrieve status of a specific question for the current user
export async function GET(request: NextRequest) {
  // Use the Next.js route handler client for authentication
  const cookieStore = await cookies();
  // @ts-ignore - Suppressing linter error as runtime requires awaited cookies here
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

    // Single optimized query - check user_progress directly instead of user_activity
    // This is more efficient as it only has one row per user/question
    const { data: progressData, error: progressError } = await supabaseServer
      .from('user_progress')
      .select('status, updated_at')
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .single();

    if (progressError && progressError.code !== 'PGRST116') { // PGRST116 = not found, which is normal
      console.error('Error fetching question status:', progressError);
      return NextResponse.json({ status: 'unknown', error: 'Failed to fetch question status' }, { status: 500 });
    }

    let responseData = {
      status: progressData?.status || 'unknown',
      isBookmarked: progressData?.status === 'bookmarked',
      timestamp: Date.now()
    };

    // If the status is 'completed', we can cache it longer (unlikely to change)
    // For other statuses, use shorter cache duration
    const cacheHeaders = progressData?.status === 'completed' ? 
                        CACHE_HEADERS.medium : 
                        CACHE_HEADERS.short;

    return NextResponse.json(responseData, { 
      status: 200,
      headers: cacheHeaders
    });

  } catch (error) {
    console.error('Error fetching question status:', error);
    return NextResponse.json({ status: 'unknown', error: 'Failed to fetch question status' }, { status: 500 });
  }
}
