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
      .select('current_streak, highest_streak, last_active_date, streak_start_date')
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
        streak_start_date: null
      });
    }

    const today = new Date();
    const todayDateString = today.toISOString().split('T')[0];

    // Check if streak is broken
    if (streakData.last_active_date) {
      const lastActiveDateString = new Date(streakData.last_active_date).toISOString().split('T')[0];
      
      const todayDate = new Date(todayDateString);
      const lastActiveDate = new Date(lastActiveDateString);

      const diffTime = todayDate.getTime() - lastActiveDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 1) {
        // Streak is broken, reset it
        const resetData = {
          ...streakData,
          current_streak: 0
        };

        const { error: updateError } = await supabase
          .from('user_streaks')
          .update({ current_streak: 0 })
          .eq('user_id', user.id);

        if (updateError) {
          // eslint-disable-next-line no-console
          console.error('Error resetting streak:', updateError);
          // Still return reset data to avoid breaking the UI with stale data
          return NextResponse.json(resetData);
        }
        
        // Return the reset streak data
        return NextResponse.json(resetData); 