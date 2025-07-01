import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { Topic, Category } from '@/types/database'; // Import Category

// Define the expected structure for a topic with its categories
// This aligns with what Supabase returns for `select('*, categories(*)')`
interface TopicWithCategoriesDetailed extends Topic {
  categories: Category[];
}

// Placeholder for Category if not globally available or imported from @/types/database - REMOVED

const PAGE_SIZE = 1000; // Max rows Supabase/PostgREST seems to return by default or by its own max-rows config

export async function GET(_request: NextRequest) {
  const supabase = await createClient();
  try {
    let allTopics: TopicWithCategoriesDetailed[] = [];
    let page = 0;
    let moreData = true;

    while (moreData) {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      console.log(`Fetching topics from ${from} to ${to}`);

      const { data: topicsPage, error } = await supabase
        .from('topics')
        .select('*, categories(*)')
        .order('name', { ascending: true })
        .range(from, to); // Use .range() for pagination

      if (error) {
        console.error('Error fetching a page of topics with categories:', error);
        // Depending on desired error handling, you might throw, or break and return partial data
        throw error; 
      }

      if (topicsPage && topicsPage.length > 0) {
        allTopics = allTopics.concat(topicsPage as TopicWithCategoriesDetailed[]);
        if (topicsPage.length < PAGE_SIZE) {
          // This was the last page
          moreData = false;
        }
      } else {
        // No more data to fetch
        moreData = false;
      }
      page++;
    }

    console.log(`Total topics fetched after pagination: ${allTopics.length}`);

    return NextResponse.json(allTopics, { // Return the accumulated allTopics
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1 hour cache
      },
    });
  } catch (error) {
    // Log the error for server-side inspection
    console.error('Failed to load detailed topic data with pagination:', error);
    return NextResponse.json(
      { error: 'Failed to load detailed topic data' },
      { status: 500 }
    );
  }
} 