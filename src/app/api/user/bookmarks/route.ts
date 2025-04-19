import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import supabaseServer from '@/utils/supabase-server';

// GET: Retrieve user bookmarks
export async function GET(request: NextRequest) {
  // Use the Next.js route handler client for authentication
  const supabase = createRouteHandlerClient({ cookies });
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

    // Get query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');

    // Fetch bookmarked questions
    const { data: bookmarksData, error: bookmarksError } = await supabaseServer
      .from('user_progress')
      .select(`
        id,
        question_id,
        topic_id,
        category_id,
        created_at,
        updated_at
      `)
      .eq('user_id', userId)
      .eq('status', 'bookmarked')
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (bookmarksError) {
      console.error('Error fetching user bookmarks:', bookmarksError);
      return NextResponse.json({ error: 'Failed to fetch user bookmarks' }, { status: 500 });
    }

    // If we have bookmarks data, fetch additional information
    if (bookmarksData && bookmarksData.length > 0) {
      // Get unique question IDs, topic IDs, and category IDs
      const questionIds = [...new Set(
        bookmarksData
          .filter(item => item.question_id !== null)
          .map(item => item.question_id)
      )];

      const topicIds = [...new Set(
        bookmarksData
          .filter(item => item.topic_id !== null)
          .map(item => item.topic_id)
      )];

      const categoryIds = [...new Set(
        bookmarksData
          .filter(item => item.category_id !== null)
          .map(item => item.category_id)
      )];

      // Fetch question texts
      let questionTexts: Record<number, string> = {};
      if (questionIds.length > 0) {
        const { data: questionsData, error: questionsError } = await supabaseServer
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

      // Fetch topic names
      let topicNames: Record<number, string> = {};
      if (topicIds.length > 0) {
        const { data: topicsData, error: topicsError } = await supabaseServer
          .from('topics')
          .select('id, name')
          .in('id', topicIds);

        if (topicsError) {
          console.error('Error fetching topic names:', topicsError);
        } else if (topicsData) {
          // Create a map of topic ID to topic name
          topicNames = topicsData.reduce<Record<number, string>>((acc, topic) => {
            acc[topic.id] = topic.name;
            return acc;
          }, {});
        }
      }

      // Fetch category names
      let categoryNames: Record<number, string> = {};
      if (categoryIds.length > 0) {
        const { data: categoriesData, error: categoriesError } = await supabaseServer
          .from('categories')
          .select('id, name')
          .in('id', categoryIds);

        if (categoriesError) {
          console.error('Error fetching category names:', categoriesError);
        } else if (categoriesData) {
          // Create a map of category ID to category name
          categoryNames = categoriesData.reduce<Record<number, string>>((acc, category) => {
            acc[category.id] = category.name;
            return acc;
          }, {});
        }
      }

      // Enhance bookmarks data with additional information
      const enhancedBookmarksData = bookmarksData.map(bookmark => {
        const questionText = bookmark.question_id ? questionTexts[bookmark.question_id] || 'Unknown question' : null;
        const topicName = bookmark.topic_id ? topicNames[bookmark.topic_id] || 'Unknown topic' : null;
        const categoryName = bookmark.category_id ? categoryNames[bookmark.category_id] || 'Unknown category' : null;

        return {
          id: bookmark.id,
          questionId: bookmark.question_id,
          questionText,
          topicId: bookmark.topic_id,
          topicName,
          categoryId: bookmark.category_id,
          categoryName,
          createdAt: bookmark.created_at,
          updatedAt: bookmark.updated_at,
          timeAgo: formatTimeAgo(new Date(bookmark.updated_at || bookmark.created_at))
        };
      });

      return NextResponse.json({
        bookmarks: enhancedBookmarksData
      });
    }

    // Return empty array if no bookmarks
    return NextResponse.json({
      bookmarks: []
    });

  } catch (error) {
    console.error('Error in user bookmarks API:', error);
    return NextResponse.json({ error: 'Failed to fetch user bookmarks' }, { status: 500 });
  }
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`;
}
