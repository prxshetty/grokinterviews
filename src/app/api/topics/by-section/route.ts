import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient, shouldUseAdminClient } from '@/utils/supabase/admin';

export async function GET(request: NextRequest) {
  // Use admin client in development to bypass RLS
  const supabase = shouldUseAdminClient()
    ? createAdminClient()
    : await createClient();
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

    // First get the domain_id from the domain code
    const { data: domainData, error: domainError } = await supabase
      .from('domains')
      .select('id')
      .eq('code', domain)
      .single();

    if (domainError || !domainData) {
      console.error('Error fetching domain:', domainError);
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      );
    }

    // Then get the section_id from the section name and domain
    const { data: sectionData, error: sectionError } = await supabase
      .from('sections')
      .select('id')
      .eq('name', sectionName)
      .eq('domain_id', domainData.id)
      .single();

    if (sectionError || !sectionData) {
      console.error('Error fetching section:', sectionError);
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      );
    }

    // Query for topics using the foreign keys
    const { data: topics, error } = await supabase
      .from('topics')
      .select('*')
      .eq('domain_id', domainData.id)
      .eq('section_id', sectionData.id)
      .order('created_at', { ascending: true });

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
