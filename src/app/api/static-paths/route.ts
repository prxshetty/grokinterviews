import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server' // Assuming this utility exists

export async function GET() {
  const supabase = await createClient()

  try {
    // Corrected select string for Supabase query
    const selectQuery = 'domain, slug, categories (slug)';

    const { data: topicsData, error: topicsError } = await supabase
      .from('topics')
      .select(selectQuery)

    if (topicsError) {
      console.error('Error fetching topics for static paths:', topicsError)
      return NextResponse.json({ error: 'Failed to fetch topic data', details: topicsError.message }, { status: 500 })
    }

    if (!topicsData) {
      return NextResponse.json({ paths: [] })
    }

    const paths = topicsData.flatMap((topic: any) =>
      (topic.categories || []).map((category: any) => ({
        domain: topic.domain,
        section: topic.slug,
        topic: category.slug,
      }))
    ).filter(path => path.domain && path.section && path.topic);

    return NextResponse.json({ paths })
  } catch (error) {
    console.error('Unexpected error in /api/static-paths:', error)
    let message = 'An unexpected error occurred';
    if (error instanceof Error) {
        message = error.message;
    }
    return NextResponse.json({ error: 'An unexpected error occurred', details: message }, { status: 500 })
  }
}

// Add a dummy POST, PUT, DELETE, PATCH, HEAD, OPTIONS handler to satisfy Next.js
// if only GET is defined for a route segment, Next.js will treat it as statically generated at build time.
// We want this to be dynamically called at build time by generateStaticParams.
export async function POST() {
  return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
} 