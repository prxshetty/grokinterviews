import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient, shouldUseAdminClient } from '@/utils/supabase/admin';

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

    // Use admin client in development to bypass RLS
    const supabase = shouldUseAdminClient()
      ? createAdminClient()
      : await createClient();

    console.log(`API - Fetching section headers for domain: ${domain}`);

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

    // Fetch all section headers for the given domain, ordered by display_order
    const { data: sectionHeaders, error } = await supabase
      .from('sections')
      .select('*')
      .eq('domain_id', domainData.id)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching section headers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch section headers' },
        { status: 500 }
      );
    }

    console.log(`API - Returning ${sectionHeaders?.length || 0} distinct section names for domain: ${domain}`);

    return NextResponse.json(
      sectionHeaders || [],
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
