import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET: Retrieve user activity aggregated by date for the activity grid
export async function GET(request: NextRequest) {
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
    } else {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Get the current month's date range
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    // First day of current month
    const startDate = new Date(currentYear, currentMonth, 1);
    // Last day of current month
    const endDate = new Date(currentYear, currentMonth + 1, 0);

    // Format dates for Supabase query
    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();

    // Fetch activity data grouped by date
    const { data, error } = await supabase
      .from('user_activity')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', startDateStr)
      .lte('created_at', endDateStr)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching activity data:', error);
      return NextResponse.json({ error: 'Failed to fetch activity data' }, { status: 500 });
    }

    // Process the data to count activities per day
    const activityByDate: Record<string, number> = {};

    // Initialize all dates in the range with 0 count
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      activityByDate[dateStr] = 0;
    }

    // Count activities for each date
    data?.forEach(item => {
      const dateStr = new Date(item.created_at).toISOString().split('T')[0];
      if (activityByDate[dateStr] !== undefined) {
        activityByDate[dateStr]++;
      } else {
        activityByDate[dateStr] = 1;
      }
    });

    // Convert to array format for the frontend
    const activityData = Object.entries(activityByDate).map(([date, count]) => ({
      date,
      count
    }));

    return NextResponse.json({
      activityData,
      totalActivities: data?.length || 0
    });

  } catch (error) {
    console.error('Error in activity grid API:', error);
    return NextResponse.json({ error: 'Failed to fetch activity data' }, { status: 500 });
  }
}
