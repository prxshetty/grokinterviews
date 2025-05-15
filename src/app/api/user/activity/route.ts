import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET: Retrieve user activity
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
      console.log('Found user ID from session for activity:', userId);
    } else {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');

    // Fetch recent user activity
    const { data: activityData, error: activityError } = await supabase
      .from('user_activity')
      .select(`
        id,
        activity_type,
        topic_id,
        category_id,
        question_id,
        created_at,
        metadata
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (activityError) {
      console.error('Error fetching user activity:', activityError);
      return NextResponse.json({ error: 'Failed to fetch user activity' }, { status: 500 });
    }

    // If we have activity data, fetch additional information
    if (activityData && activityData.length > 0) {
      // Get unique question IDs, topic IDs, and category IDs
      const questionIds = [...new Set(
        activityData
          .filter(item => item.question_id !== null)
          .map(item => item.question_id)
      )];

      const topicIds = [...new Set(
        activityData
          .filter(item => item.topic_id !== null)
          .map(item => item.topic_id)
      )];

      const categoryIds = [...new Set(
        activityData
          .filter(item => item.category_id !== null)
          .map(item => item.category_id)
      )];

      // Fetch question texts if we have question IDs
      let questionTexts: Record<number, string> = {};
      if (questionIds.length > 0) {
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('id, question_text')
          .in('id', questionIds);

        if (questionsError) {
          console.error('Error fetching question texts:', questionsError);
        } else if (questionsData) {
          // Create a map of question ID to question text
          questionTexts = questionsData.reduce<Record<number, string>>((acc, question) => {
            acc[question.id] = question.question_text;
            return acc;
          }, {});
        }
      }

      // Fetch topic names if we have topic IDs
      let topicNames: Record<string | number, string> = {};
      if (topicIds.length > 0) {
        const { data: topicsData, error: topicsError } = await supabase
          .from('topics')
          .select('id, name')
          .in('id', topicIds);

        if (topicsError) {
          console.error('Error fetching topic names:', topicsError);
        } else if (topicsData) {
          // Create a map of topic ID to topic name
          topicNames = topicsData.reduce<Record<string | number, string>>((acc, topic) => {
            acc[topic.id] = topic.name;
            return acc;
          }, {});
        }
      }

      // Fetch category names if we have category IDs
      let categoryNames: Record<string | number, string> = {};
      if (categoryIds.length > 0) {
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('id, name')
          .in('id', categoryIds);

        if (categoriesError) {
          console.error('Error fetching category names:', categoriesError);
        } else if (categoriesData) {
          // Create a map of category ID to category name
          categoryNames = categoriesData.reduce<Record<string | number, string>>((acc, category) => {
            acc[category.id] = category.name;
            return acc;
          }, {});
        }
      }

      // Enhance activity data with additional information and format for display
      const enhancedActivityData = activityData.map(activity => {
        const questionText = activity.question_id ? questionTexts[activity.question_id] || 'Unknown question' : null;
        const topicName = activity.topic_id ? topicNames[activity.topic_id] || 'Unknown topic' : 'Unknown topic';
        const categoryName = activity.category_id ? categoryNames[activity.category_id] || 'Unknown category' : 'Unknown category';

        return {
          id: activity.id,
          activityType: activity.activity_type,
          topicId: activity.topic_id,
          topicName,
          categoryId: activity.category_id,
          categoryName,
          questionId: activity.question_id,
          questionText,
          createdAt: activity.created_at,
          metadata: activity.metadata,
          // Format the activity for display
          displayText: formatActivityForDisplay(activity.activity_type, questionText, topicName, categoryName),
          timeAgo: formatTimeAgo(new Date(activity.created_at))
        };
      });

      return NextResponse.json({
        activities: enhancedActivityData
      });
    }

    // Return empty array if no activity
    return NextResponse.json({
      activities: []
    });

  } catch (error) {
    console.error('Error in user activity API:', error);
    return NextResponse.json({ error: 'Failed to fetch user activity' }, { status: 500 });
  }
}

// Helper function to format activity for display
function formatActivityForDisplay(
  activityType: string,
  questionText: string | null,
  topicName: string,
  categoryName: string
): string {
  switch (activityType) {
    case 'question_completed':
      return `Completed question: "${questionText}"`;
    case 'question_viewed':
      return `Viewed question: "${questionText}"`;
    case 'topic_started':
      return `Started topic: ${topicName}`;
    case 'category_started':
      return `Started category: ${categoryName} in ${topicName}`;
    default:
      return `${activityType}: ${questionText || categoryName || topicName}`;
  }
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks === 1 ? '' : 's'} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} year${diffInYears === 1 ? '' : 's'} ago`;
}
