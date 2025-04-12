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
    // Include created_at for sorting
    const { data: sectionData, error } = await supabaseServer
      .from('topics')
      .select('section_name, created_at')
      .eq('domain', domain)
      .order('created_at', { ascending: true }); // Sort by created_at in ascending order (oldest first)

    // Log the number of results found
    console.log(`API - Found ${sectionData?.length || 0} section names for domain: ${domain}`);

    if (error) {
      console.error('Error fetching section headers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch section headers' },
        { status: 500 }
      );
    }

    // Get distinct section names to avoid duplicates while preserving order
    const distinctSections = [];
    const sectionNames = new Set();

    // Create a map to track the first occurrence of each section name with its created_at timestamp
    const sectionMap = new Map();

    // First pass: collect all section names with their created_at timestamps
    sectionData?.forEach(item => {
      if (item.section_name && !sectionNames.has(item.section_name)) {
        sectionNames.add(item.section_name);
        sectionMap.set(item.section_name, {
          name: item.section_name,
          created_at: item.created_at
        });
      }
    });

    // Convert the map to an array and sort by created_at (oldest first)
    const sortedSections = Array.from(sectionMap.values())
      .sort((a, b) => {
        // If created_at is null, treat it as newest
        if (!a.created_at) return -1;
        if (!b.created_at) return 1;
        // Sort by created_at in ascending order (oldest first)
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

    // Create the final array with sequential IDs
    sortedSections.forEach((section, index) => {
      distinctSections.push({
        id: index + 1, // Generate sequential IDs
        name: section.name,
        created_at: section.created_at // Include created_at in the response for debugging
      });
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
