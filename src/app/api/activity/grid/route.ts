import { NextRequest, NextResponse } from 'next/server';

// GET: Provide demo activity data for non-authenticated users
export async function GET(request: NextRequest) {
  try {
    // Generate random activity data for the current month
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    // First day of current month
    const startDate = new Date(currentYear, currentMonth, 1);
    // Last day of current month
    const endDate = new Date(currentYear, currentMonth + 1, 0);

    // Generate activity data for each day in the month
    const activityData = [];
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      
      // Generate random activity count (0-10)
      // Make weekends more likely to have higher activity
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const maxCount = isWeekend ? 10 : 7;
      const count = Math.floor(Math.random() * maxCount);
      
      activityData.push({
        date: dateStr,
        count
      });
    }

    return NextResponse.json({
      activityData,
      totalActivities: activityData.reduce((sum, item) => sum + item.count, 0)
    });

  } catch (error) {
    console.error('Error generating demo activity data:', error);
    return NextResponse.json({ error: 'Failed to generate activity data' }, { status: 500 });
  }
}
