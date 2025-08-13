import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const revalidate = 0; // Disable caching for this route

// Helper function to calculate streak from a list of activity dates
function calculateStreak(activityDates: string[]): { currentStreak: number, streakStartDate: string | null, lastActiveDate: string | null } {
    if (activityDates.length === 0) {
        return { currentStreak: 0, streakStartDate: null, lastActiveDate: null };
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Create a set of unique UTC dates from the timestamps
    const uniqueDates = [...new Set(activityDates.map(d => d.split('T')[0]))].map(d => new Date(d));
    uniqueDates.sort((a, b) => b.getTime() - a.getTime());

    const mostRecentDate = uniqueDates[0];
    if (!mostRecentDate) {
        return { currentStreak: 0, streakStartDate: null, lastActiveDate: null };
    }

    const diffFromToday = Math.round((today.getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24));

    // If the last activity was more than a day ago, streak is 0
    if (diffFromToday > 1) {
        return { currentStreak: 0, streakStartDate: null, lastActiveDate: mostRecentDate.toISOString() };
    }

    let currentStreak = 1;
    let streakStartDate = mostRecentDate;

    // Iterate backwards from the most recent activity
    for (let i = 0; i < uniqueDates.length - 1; i++) {
        const currentDate = uniqueDates[i];
        const nextDate = uniqueDates[i+1];
        
        if(!currentDate || !nextDate) break;

        const diff = Math.round((currentDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diff === 1) {
            currentStreak++;
            streakStartDate = nextDate;
        } else {
            // Found a gap, so the streak ends here
            break;
        }
    }

    return { 
        currentStreak, 
        streakStartDate: streakStartDate.toISOString(), 
        lastActiveDate: mostRecentDate.toISOString() 
    };
}


export async function GET(_request: NextRequest) {
  const supabase = await createClient();
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
    }

    // 1. Fetch all user activity dates from the user_activity table
    const { data: activities, error: activityError } = await supabase
      .from('user_activity')
      .select('created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (activityError) {
      console.error('Error fetching user activity for streak:', activityError);
      return NextResponse.json({ error: 'Failed to fetch user activity' }, { status: 500 });
    }

    const activityDates = activities.map(a => a.created_at);

    // 2. Calculate the streak based on the activity dates
    const { currentStreak, streakStartDate, lastActiveDate } = calculateStreak(activityDates);

    // 3. Get the current highest streak from the database
    const { data: streakData } = await supabase
      .from('user_streaks')
      .select('highest_streak')
      .eq('user_id', user.id)
      .maybeSingle();
    
    let highestStreak = streakData?.highest_streak || 0;
    if (currentStreak > highestStreak) {
        highestStreak = currentStreak;
    }

    // 4. Upsert the new streak data into the user_streaks table
    const { error: upsertError } = await supabase
      .from('user_streaks')
      .upsert({
        user_id: user.id,
        current_streak: currentStreak,
        highest_streak: highestStreak,
        last_active_date: lastActiveDate,
        streak_start_date: streakStartDate,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (upsertError) {
        console.error('Error upserting streak data:', upsertError);
        // Non-fatal, return calculated data anyway as it's more up-to-date
    }

    // 5. Return the newly calculated and saved data
    return NextResponse.json({
      current_streak: currentStreak,
      highest_streak: highestStreak,
      last_active_date: lastActiveDate,
      streak_start_date: streakStartDate
    });

  } catch (error) {
    console.error('Error in streak route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
