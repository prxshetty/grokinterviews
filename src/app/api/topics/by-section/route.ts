import { NextRequest, NextResponse } from 'next/server';
import supabaseServer from '@/utils/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const domain = url.searchParams.get('domain');
    const sectionName = url.searchParams.get('sectionName');

    if (!domain || !sectionName) {
      return NextResponse.json(
        { error: 'Domain and sectionName parameters are required' },
        { status: 400 }
      );
    }

    console.log(`API - Fetching topics for domain: ${domain}, section: ${sectionName}`);

    // Query for topics in the given section and domain
    const { data: topics, error } = await supabaseServer
      .from('topics')
      .select('*')
      .eq('domain', domain)
      .eq('section_name', sectionName)
      .order('created_at', { ascending: true }); // Sort by created_at in ascending order (oldest first)

    // Log the number of results found
    console.log(`API - Found ${topics?.length || 0} topics for section: ${sectionName}`);

    if (error) {
      console.error('Error fetching topics by section:', error);
      return NextResponse.json(
        { error: 'Failed to fetch topics' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      topics || [],
      {
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1 hour cache
        },
      }
    );
  } catch (error: any) {
    console.error('Error in topics by section API route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
