import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import supabaseServer from '@/utils/supabase-server';

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

// GET: Retrieve user bookmarks from user_bookmarks table
export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  // @ts-ignore
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  let userId = null;

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session?.user) throw new Error('User not authenticated');
    userId = session.user.id;
  } catch (error: any) {
    console.error('Bookmark GET Session Error:', error.message);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');

    // Fetch bookmarks directly from user_bookmarks
    const { data: bookmarks, error: bookmarksError } = await supabaseServer
      .from('user_bookmarks')
      .select(`
        id,
        question_id,
        category_id,
        topic_id,
        domain,
        section_name,
        created_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (bookmarksError) {
      console.error('Error fetching user bookmarks:', bookmarksError);
      return NextResponse.json({ error: 'Failed to fetch user bookmarks' }, { status: 500 });
    }

    if (!bookmarks || bookmarks.length === 0) {
      return NextResponse.json({ bookmarks: [] });
    }

    // --- Fetch related data for enhancement ---
    const questionIds = [...new Set(bookmarks.map(b => b.question_id).filter(Boolean))];
    const topicIds = [...new Set(bookmarks.map(b => b.topic_id).filter(Boolean))];
    const categoryIds = [...new Set(bookmarks.map(b => b.category_id).filter(Boolean))];

    // Fetch question texts
    let questionTexts: Record<number, string> = {};
    if (questionIds.length > 0) {
      const { data: qData, error: qError } = await supabaseServer
        .from('questions')
        .select('id, question_text')
        .in('id', questionIds);
      if (qError) console.error('Error fetching question texts:', qError);
      else questionTexts = qData?.reduce((acc: Record<number, string>, q) => {
        if (q.id !== null && q.id !== undefined) {
          acc[Number(q.id)] = q.question_text;
        }
        return acc;
      }, {}) || {};
    }

    // Fetch topic names
    let topicNames: Record<number, string> = {};
    if (topicIds.length > 0) {
      const { data: tData, error: tError } = await supabaseServer
        .from('topics')
        .select('id, name')
        .in('id', topicIds);
       if (tError) console.error('Error fetching topic names:', tError);
       else topicNames = tData?.reduce((acc: Record<number, string>, t) => {
        if (t.id !== null && t.id !== undefined) {
          acc[Number(t.id)] = t.name;
        }
          return acc;
        }, {}) || {};
    }

    // Fetch category names
    let categoryNames: Record<number, string> = {};
    if (categoryIds.length > 0) {
       const { data: cData, error: cError } = await supabaseServer
         .from('categories')
         .select('id, name')
         .in('id', categoryIds);
       if (cError) console.error('Error fetching category names:', cError);
       else categoryNames = cData?.reduce((acc: Record<number, string>, c) => {
         if (c.id !== null && c.id !== undefined) {
          acc[Number(c.id)] = c.name;
         }
          return acc;
        }, {}) || {};
    }
    // --- End Fetch related data --- 

    // Enhance bookmarks data
    const enhancedBookmarksData = bookmarks.map(bookmark => ({
      id: bookmark.id,
      questionId: bookmark.question_id,
      questionText: bookmark.question_id ? questionTexts[bookmark.question_id] || 'Unknown question' : null,
      topicId: bookmark.topic_id,
      topicName: bookmark.topic_id ? topicNames[bookmark.topic_id] || 'Unknown topic' : null,
      categoryId: bookmark.category_id,
      categoryName: bookmark.category_id ? categoryNames[bookmark.category_id] || 'Unknown category' : null,
      domain: bookmark.domain,
      sectionName: bookmark.section_name,
      createdAt: bookmark.created_at,
      timeAgo: formatTimeAgo(new Date(bookmark.created_at))
    }));

    return NextResponse.json({ bookmarks: enhancedBookmarksData });

  } catch (error: any) {
    console.error('Error in GET /api/user/bookmarks:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

// POST: Add or remove a bookmark in user_bookmarks table
export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  // @ts-ignore
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  let userId = null;

  // Get user session
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session?.user) throw new Error('User not authenticated');
    userId = session.user.id;
  } catch (error: any) {
    console.error('Bookmark POST Session Error:', error.message);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }

  try {
    // We expect questionId, isBookmarked (boolean), topicId, categoryId from the client
    const { questionId, isBookmarked, topicId, categoryId } = await request.json(); 

    // Basic validation
    if (questionId === undefined || isBookmarked === undefined || topicId === undefined || categoryId === undefined) {
      return NextResponse.json({ error: 'Missing required fields: questionId, isBookmarked, topicId, categoryId' }, { status: 400 });
    }

    if (typeof questionId !== 'number' || typeof topicId !== 'number' || typeof categoryId !== 'number') {
       return NextResponse.json({ error: 'Invalid ID type provided' }, { status: 400 });
    }

    if (isBookmarked) {
      // --- Add bookmark --- 
      console.log(`Adding bookmark: User ${userId}, Q:${questionId}, Topic:${topicId}, Cat:${categoryId}`);

      // 1. Fetch domain and section_name from topics table
      let domain: string | null = null;
      let sectionName: string | null = null;
      try {
          const { data: topicData, error: topicError } = await supabaseServer
              .from('topics')
              .select('domain, section_name')
              .eq('id', topicId)
              .maybeSingle(); // Use maybeSingle to handle potential null topic
          
          if (topicError) {
              console.warn(`Failed to get topic details for bookmark: ${topicError.message}`);
              // Proceed without domain/section if lookup fails
          } else if (topicData) {
              domain = topicData.domain;
              sectionName = topicData.section_name;
          }
      } catch (fetchError) {
          console.error('Error fetching topic details:', fetchError);
          // Proceed without domain/section
      }

      // 2. Insert into user_bookmarks
      const { error: insertError } = await supabaseServer
        .from('user_bookmarks')
        .insert({
          user_id: userId,
          question_id: questionId,
          category_id: categoryId,
          topic_id: topicId,
          domain: domain, // Can be null if lookup failed
          section_name: sectionName, // Can be null if lookup failed
          // created_at defaults to now()
        });

      // Handle potential unique constraint violation (user already bookmarked)
      if (insertError && insertError.code === '23505') { // 23505 is unique_violation
        console.log(`Bookmark already exists for User ${userId}, Q:${questionId}. Ignoring duplicate add request.`);
        // Return success even if it already existed
        return NextResponse.json({ success: true, message: 'Bookmark already exists' });
      } else if (insertError) {
        console.error('Error inserting bookmark:', insertError);
        return NextResponse.json({ error: 'Failed to add bookmark', details: insertError.message }, { status: 500 });
      }

      console.log(`Bookmark added successfully for Q:${questionId}`);
      return NextResponse.json({ success: true });

    } else {
      // --- Remove bookmark --- 
      console.log(`Removing bookmark: User ${userId}, Q:${questionId}`);

      const { error: deleteError } = await supabaseServer
        .from('user_bookmarks')
        .delete()
        .eq('user_id', userId)
        .eq('question_id', questionId);

      if (deleteError) {
        console.error('Error deleting bookmark:', deleteError);
        return NextResponse.json({ error: 'Failed to remove bookmark', details: deleteError.message }, { status: 500 });
      }

      console.log(`Bookmark removed successfully for Q:${questionId}`);
      return NextResponse.json({ success: true });
    }

  } catch (error: any) {
    console.error('Error processing bookmark POST request:', error);
    if (error instanceof SyntaxError) { // Handle JSON parsing errors
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
