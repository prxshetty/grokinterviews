import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const revalidate = 0; // Disable caching for this route

export async function GET(_request: NextRequest) {
  const supabase = await createClient();
  
  try {
    // Authenticate user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      // eslint-disable-next-line no-console
      console.error('User fetch Error in streak:', userError?.message);
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
    }

    // Get streak data directly from user_streaks table
    const { data: streakData, error: streakError } = await supabase
      .from('user_streaks')
      .select('current_streak, highest_streak, last_active_date, streak_start_date, grace_used')
      .eq('user_id', user.id)
      .maybeSingle();

    if (streakError) {
      // eslint-disable-next-line no-console
      console.error('Error fetching streak:', streakError);
      return NextResponse.json({ error: 'Failed to fetch streak' }, { status: 500 });
    }

    // If no streak record exists yet, return default values
    if (!streakData) {
      return NextResponse.json({
        current_streak: 0,
        highest_streak: 0,
        last_active_date: null,
        streak_start_date: null,
        grace_used: false
      });
    }

    // Return streak data
    return NextResponse.json(streakData);

  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('Unexpected error in streak endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 