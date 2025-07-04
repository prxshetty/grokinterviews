import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  try {
    const url = new URL(request.url);
    const domain = url.searchParams.get('domain');
    const sectionId = url.searchParams.get('sectionId');

    if (!domain || !sectionId) {
      return NextResponse.json(
        { error: 'Domain and sectionId parameters are required' },
        { status: 400 }
      );
    }

    console.log(`API - Fetching topics for domain: ${domain}, sectionId: ${sectionId}`);

    // Query for topics in the given section and domain using the section_id
    const { data: topics, error } = await supabase
      .from('topics')
      .select('*, domains!inner(code)')
      .eq('domains.code', domain)
      .eq('section_id', sectionId)
      .order('created_at', { ascending: true });

    // Log the number of results found
    console.log(`API - Found ${topics?.length || 0} topics for sectionId: ${sectionId}`);

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
