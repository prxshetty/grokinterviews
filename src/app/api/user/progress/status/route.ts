import { NextRequest, NextResponse } from 'next/server';
// import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'; // Old import
// import { cookies } from 'next/headers'; // Old import
import { createClient } from '@/utils/supabase/server'; // New import for @supabase/ssr server client
// import supabaseServer from '@/utils/supabase-server'; // To be removed

// Define cache control headers for different scenarios
const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache', // For HTTP/1.0 proxies
  'Expires': '0' // For older browsers
};

// GET: Retrieve status of a specific question for the current user
export async function GET(request: NextRequest) {
  const supabase = await createClient(); // Use the new server client
  let userId: string;

  // Authenticate user
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('User fetch Error in progress/status:', userError.message);
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
    }
    if (!user) {
      console.log('No user found in progress/status');
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    userId = user.id;
    console.log('Found user ID from auth for progress/status:', userId);
  } catch (e: any) {
    console.error('Authentication process error in progress/status:', e.message);
    return NextResponse.json({ error: 'Authentication process failed' }, { status: 500 });
  }

  try {
    const url = new URL(request.url);
    const questionId = url.searchParams.get('questionId');

    if (!questionId) {
      return NextResponse.json({ status: 'unknown', error: 'Question ID is required' }, { status: 400 });
    }

    // Default values (bookmark status is now client-side only)
    const isUserBookmarked = false;
    let actualProgressStatus = 'unknown';

    // 1. Check user_progress for actual progress status (moved up, removed bookmark check)

    // 2. Check user_progress for actual progress status (e.g., viewed, completed)
    const { data: progressData, error: progressError } = await supabase
      .from('user_progress')
      .select('status') // Only select status, updated_at is not used in response here
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .maybeSingle(); // Use maybeSingle as a progress record might not exist

    if (progressError && progressError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error fetching question progress status:', progressError);
      return NextResponse.json({ status: 'unknown', error: 'Failed to fetch question progress status' }, { status: 500 });
    }

    if (progressData && progressData.status) {
      actualProgressStatus = progressData.status;
    }

    // If the question is completed, but somehow no progressData was found (e.g. race condition or data issue),
    // and it's bookmarked, we might infer a different status or log a warning.
    // For now, if progressData.status is null/undefined, actualProgressStatus remains 'unknown'.

    const responseData = {
      status: actualProgressStatus, // This status is from user_progress
      isBookmarked: isUserBookmarked,
      timestamp: Date.now()
    };

    return NextResponse.json(responseData, {
      status: 200,
      headers: NO_CACHE_HEADERS
    });

  } catch (error) {
    console.error('Error fetching question status (outer try-catch):', error);
    return NextResponse.json({ status: 'unknown', error: 'Outer error: Failed to fetch question status' }, { status: 500 });
  }
}
