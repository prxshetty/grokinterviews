import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET: Retrieve user statistics
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
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
    } else if (session?.user) {
      userId = session.user.id;
      console.log('Found user ID from session for stats:', userId);
    } else {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Initialize stats object
    const stats = {
      totalTimeSpent: 0, // in minutes
      apiCallsMade: 0,
      bookmarksCount: 0,
      lastActive: null,
      questionsAnswered: 0,
      topicsExplored: 0,
      avgTimePerQuestion: 0,
      preferredModel: '',
      joinDate: null
    };

    // 1. Get total time spent (estimate based on activity)
    const { data: activityData, error: activityError } = await supabase
      .from('user_activity')
      .select('created_at, activity_type')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (activityError) {
      console.error('Error fetching user activity for time calculation:', activityError);
    } else if (activityData && activityData.length > 0) {
      // Calculate time spent based on activity timestamps
      // This is an estimation - assumes average time between activities
      let totalMinutes = 0;
      let lastTimestamp = null;

      for (let i = 0; i < activityData.length; i++) {
        const currentTime = new Date(activityData[i].created_at);

        if (lastTimestamp) {
          const diffMinutes = (currentTime.getTime() - lastTimestamp.getTime()) / (1000 * 60);

          // Only count reasonable time gaps (less than 30 minutes)
          if (diffMinutes > 0 && diffMinutes < 30) {
            totalMinutes += diffMinutes;
          }
        }

        lastTimestamp = currentTime;
      }

      stats.totalTimeSpent = Math.round(totalMinutes);

      // Set last active time
      if (activityData.length > 0) {
        stats.lastActive = activityData[activityData.length - 1].created_at;
      }
    }

    // 2. Count API calls made for answer generation
    const { count: apiCallsCount, error: apiCallsError } = await supabase
      .from('user_activity')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('activity_type', 'answer_generated');

    if (apiCallsError) {
      console.error('Error counting API calls:', apiCallsError);
    } else {
      stats.apiCallsMade = apiCallsCount || 0;
    }

    // 3. Count bookmarks
    const { count: bookmarksCount, error: bookmarksError } = await supabase
      .from('user_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'bookmarked');

    if (bookmarksError) {
      console.error('Error counting bookmarks:', bookmarksError);
    } else {
      stats.bookmarksCount = bookmarksCount || 0;
    }

    // 4. Count questions answered
    const { count: questionsAnswered, error: questionsError } = await supabase
      .from('user_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed');

    if (questionsError) {
      console.error('Error counting completed questions:', questionsError);
    } else {
      stats.questionsAnswered = questionsAnswered || 0;
    }

    // 5. Count unique topics explored
    const { data: topicsData, error: topicsError } = await supabase
      .from('user_progress')
      .select('topic_id')
      .eq('user_id', userId)
      .not('topic_id', 'is', null);

    if (topicsError) {
      console.error('Error fetching topics explored:', topicsError);
    } else if (topicsData) {
      // Count unique topic IDs
      const uniqueTopics = new Set(topicsData.map(item => item.topic_id));
      stats.topicsExplored = uniqueTopics.size;
    }

    // 6. Get preferred model from user preferences
    const { data: preferencesData, error: preferencesError } = await supabase
      .from('user_preferences')
      .select('specific_model_id')
      .eq('user_id', userId)
      .single();

    if (preferencesError) {
      console.error('Error fetching user preferences:', preferencesError);
    } else if (preferencesData) {
      // Map model ID to a friendly name
      const modelMap: Record<string, string> = {
        'llama-3.1-8b-instant': 'Llama 3.1 8B',
        'llama-3.1-70b-instant': 'Llama 3.1 70B',
        'llama-3.1-405b-instant': 'Llama 3.1 405B',
        'mixtral-8x7b-32768': 'Mixtral 8x7B',
        'gemma-7b-it': 'Gemma 7B'
      };

      const modelId = preferencesData.specific_model_id as string;
      stats.preferredModel = modelId ? (modelMap[modelId] || modelId) : 'Not set';
    }

    // 7. Get user join date from profiles
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('created_at')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
    } else if (profileData) {
      stats.joinDate = profileData.created_at;
    }

    // 8. Calculate average time per question if we have both time and questions
    if (stats.totalTimeSpent > 0 && stats.questionsAnswered > 0) {
      stats.avgTimePerQuestion = Math.round(stats.totalTimeSpent / stats.questionsAnswered);
    }

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error in user stats API:', error);
    return NextResponse.json({ error: 'Failed to fetch user stats' }, { status: 500 });
  }
}
