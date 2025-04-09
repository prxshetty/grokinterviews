import { NextRequest, NextResponse } from 'next/server';
import supabaseServer from '@/utils/supabase-server';

export async function GET(request: NextRequest) {
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

    // Query for distinct section_name values for the given domain
    const { data: sectionData, error } = await supabaseServer
      .from('topics')
      .select('section_name')
      .eq('domain', domain)
      .order('section_name');

    // Log the number of results found
    console.log(`API - Found ${sectionData?.length || 0} section names for domain: ${domain}`);

    if (error) {
      console.error('Error fetching section headers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch section headers' },
        { status: 500 }
      );
    }

    // Get distinct section names to avoid duplicates
    const distinctSections = [];
    const sectionNames = new Set();

    sectionData?.forEach(item => {
      if (item.section_name && !sectionNames.has(item.section_name)) {
        sectionNames.add(item.section_name);
        distinctSections.push({
          id: distinctSections.length + 1, // Generate sequential IDs
          name: item.section_name
        });
      }
    });

    console.log(`API - Returning ${distinctSections.length} distinct section names for domain: ${domain}`);

    return NextResponse.json(
      distinctSections,
      {
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1 hour cache
        },
      }
    );
  } catch (error) {
    console.error('Error in section headers API route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
