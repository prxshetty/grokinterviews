import { NextRequest, NextResponse } from 'next/server';
// import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'; // Old import
// import { cookies } from 'next/headers'; // Old import
import { createClient } from '@/utils/supabase/server'; // New import for @supabase/ssr server client
// import supabaseServer from '@/utils/supabase-server'; // To be removed

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
  const supabase = await createClient(); // Use the new server client
  let userId: string;

  // Authenticate user
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser(); // Changed getSession to getUser
    if (userError) {
      console.error('User fetch Error in progress/status:', userError.message);
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
    }
    if (!user) {
      console.log('No user found in progress/status');
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    userId = user.id;
    console.log('Found user ID from auth for progress/status:', userId); // Updated log
  } catch (e: any) {
    console.error('Authentication process error in progress/status:', e.message);
    return NextResponse.json({ error: 'Authentication process failed' }, { status: 500 });
  }

  try {
    // Get the question ID from the query parameters
    const url = new URL(request.url);
    const questionId = url.searchParams.get('questionId');

    if (!questionId) {
      return NextResponse.json({ status: 'unknown', error: 'Question ID is required' }, { status: 400 });
    }

    // 1. Check user_bookmarks first
    const { data: bookmarkData, error: bookmarkError } = await supabase
      .from('user_bookmarks')
      .select('id') // We only need to know if it exists
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .maybeSingle(); // Use maybeSingle as a bookmark might not exist

    if (bookmarkError) {
      console.error('Error fetching from user_bookmarks:', bookmarkError);
      // Don't immediately fail; proceed to check user_progress if this specific error isn't critical
      // However, if the error is not just "not found", it might be a more serious issue.
      if (bookmarkError.code !== 'PGRST116') { // PGRST116 is "Not found"
         return NextResponse.json({ status: 'unknown', error: 'Failed to check bookmark status' }, { status: 500 });
      }
    }

    if (bookmarkData) {
      // If a bookmark record exists, the status is 'bookmarked'
      return NextResponse.json({
        status: 'bookmarked',
        isBookmarked: true,
        timestamp: Date.now()
      }, {
        status: 200,
        headers: CACHE_HEADERS.short // Bookmarks can change, so short cache
      });
    }

    // 2. If not bookmarked, check user_progress for other statuses (e.g., viewed, completed)
    const { data: progressData, error: progressError } = await supabase
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
      status: progressData?.status || 'unknown', // If not in user_bookmarks, status comes from user_progress
      isBookmarked: false, // Since it wasn't found in user_bookmarks
      timestamp: Date.now()
    };

    // If the status is 'completed', we can cache it longer (unlikely to change)
    // For other statuses, use shorter cache duration
    const cacheHeadersToUse = progressData?.status === 'completed' ? CACHE_HEADERS.medium : CACHE_HEADERS.short;

    return NextResponse.json(responseData, { 
      status: 200,
      headers: cacheHeadersToUse
    });

  } catch (error) {
    console.error('Error fetching question status:', error);
    return NextResponse.json({ status: 'unknown', error: 'Failed to fetch question status' }, { status: 500 });
  }
}
