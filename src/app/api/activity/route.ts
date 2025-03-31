import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for user activity (replace this with a database in production)
// This is a simple implementation for demo purposes
let userActivity: {
  date: string;
  count: number;
}[] = [];

// Initialize with some sample data
const initializeData = () => {
  if (userActivity.length === 0) {
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      // Random activity count (0-5)
      const count = Math.floor(Math.random() * 6);
      
      userActivity.push({
        date: dateString,
        count
      });
    }
  }
};

// Get all user activity
export async function GET() {
  initializeData();
  
  return NextResponse.json(userActivity);
}

// Log a new activity
export async function POST(request: NextRequest) {
  initializeData();
  
  try {
    const { questionId } = await request.json();
    
    if (!questionId) {
      return NextResponse.json({ error: 'Missing questionId parameter' }, { status: 400 });
    }
    
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Update today's activity
    const todayActivity = userActivity.find(activity => activity.date === today);
    
    if (todayActivity) {
      todayActivity.count += 1;
    } else {
      userActivity.push({
        date: today,
        count: 1
      });
    }
    
    // Sort activity by date (newest first)
    userActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging activity:', error);
    return NextResponse.json({ error: 'Failed to log activity' }, { status: 500 });
  }
} 