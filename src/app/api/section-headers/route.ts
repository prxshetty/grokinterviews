import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  try {
    const url = new URL(request.url);
    const domain = url.searchParams.get('domain');

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain parameter is required' },
        { status: 400 }
      );
    }

    console.log(`API - Fetching section headers for domain: ${domain}`);

    // Query for distinct sections for the given domain using normalized structure
    const { data: sectionData, error } = await supabase
      .from('sections')
      .select('id, name, created_at, display_order, domains!inner(code)')
      .eq('domains.code', domain)
      .order('display_order', { ascending: true }) // Primary sort by display_order for beginner-friendly learning path
      .order('name', { ascending: true }); // Secondary sort by name for stable ordering

    // Log the number of results found
    console.log(`API - Found ${sectionData?.length || 0} sections for domain: ${domain}`);

    if (error) {
      console.error('Error fetching section headers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch section headers' },
        { status: 500 }
      );
    }

    // Format the sections data - sections are already unique by design
    const formattedSections = sectionData?.map(section => ({
      id: section.id,
      name: section.name,
      created_at: section.created_at,
      display_order: section.display_order
    })) || [];

    console.log(`API - Returning ${formattedSections.length} sections for domain: ${domain}`);

    return NextResponse.json(
      formattedSections,
      {
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1 hour cache
        },
      }
    );
  } catch (error: any) {
    console.error('Error in section headers API route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
