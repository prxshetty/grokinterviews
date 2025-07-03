import { NextRequest, NextResponse } from 'next/server';
// import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'; // Old import
// import { cookies } from 'next/headers'; // Old import
import { createClient } from '@/utils/supabase/server'; // New import for @supabase/ssr server client
// import supabaseServer from '@/utils/supabase-server'; // Will be removed

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
  const supabase = await createClient();
  let userId = null;

  // Get the user using Supabase auth
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser(); // Changed getSession to getUser
    if (userError) throw userError;
    if (!user) throw new Error('User not authenticated');
    userId = user.id;
    console.log('Found user ID from auth for bookmarks GET:', userId); // Updated log
  } catch (error: any) {
    console.error('Bookmark GET User/Auth Error:', error.message); // Updated log
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');

    const { data: bookmarks, error: bookmarksError } = await supabase
      .from('user_bookmarks')
      .select('id, question_id, category_id, topic_id, section_name, created_at, domains!inner(code)')
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
      const { data: qData, error: qError } = await supabase
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
      const { data: tData, error: tError } = await supabase
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
       const { data: cData, error: cError } = await supabase
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
      domain: (bookmark as any).domains?.code,
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
  const supabase = await createClient();
  let userId = null;

  // Get user using Supabase auth
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser(); // Changed getSession to getUser
    if (userError) throw userError;
    if (!user) throw new Error('User not authenticated');
    userId = user.id;
    console.log('Found user ID from auth for bookmarks POST:', userId); // Updated log
  } catch (error: any) {
    console.error('Bookmark POST User/Auth Error:', error.message); // Updated log
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

    // Validate that IDs are positive (not 0 or negative)
    if (questionId <= 0 || topicId <= 0 || categoryId <= 0) {
      return NextResponse.json({ error: 'Invalid ID values: IDs must be positive numbers' }, { status: 400 });
    }

    if (isBookmarked) {
      // --- Add bookmark --- 
      console.log(`Adding bookmark: User ${userId}, Q:${questionId}, Topic:${topicId}, Cat:${categoryId}`);

      // 1. Fetch domain and section info from topics table using new schema
      let domainCode: string | null = null;
      let sectionName: string | null = null;
      try {
          // Get topic with domain_id and section_id
          const { data: topicData, error: topicError } = await supabase
              .from('topics')
              .select('domain_id, section_id')
              .eq('id', topicId)
              .maybeSingle();
          
          if (topicError) {
              console.warn(`Failed to get topic details for bookmark: ${topicError.message}`);
          } else if (topicData) {
              // Get domain code from domain_id
              if (topicData.domain_id) {
                  const { data: domainData } = await supabase
                      .from('domains')
                      .select('code')
                      .eq('id', topicData.domain_id)
                      .maybeSingle();
                  domainCode = domainData?.code || null;
              }
              
              // Get section name from section_id
              if (topicData.section_id) {
                  const { data: sectionData } = await supabase
                      .from('sections')
                      .select('name')
                      .eq('id', topicData.section_id)
                      .maybeSingle();
                  sectionName = sectionData?.name || null;
              }
          }
      } catch (fetchError: any) {
          console.error('Error fetching topic details:', fetchError.message);
          // Proceed without domain/section
      }

      // First, get the domain_id from the domain code
      let domainId: number | null = null;
      if (domainCode) {
        const { data: domainData, error: domainError } = await supabase
          .from('domains')
          .select('id')
          .eq('code', domainCode)
          .maybeSingle();
        
        if (!domainError && domainData) {
          domainId = domainData.id;
        }
      }

      // 2. Insert into user_bookmarks
      const { error: insertError } = await supabase
        .from('user_bookmarks')
        .insert({
          user_id: userId,
          question_id: questionId,
          category_id: categoryId,
          topic_id: topicId,
          domain_id: domainId, // Use domain_id instead of domain
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

      const { error: deleteError } = await supabase
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
