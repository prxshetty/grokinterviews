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

    // Query the section_headers table for the specified domain
    const { data: headers, error } = await supabaseServer
      .from('section_headers')
      .select('id, name')
      .eq('domain', domain)
      .order('id');

    console.log(`API - Found ${headers?.length || 0} section headers for domain: ${domain}`);

    if (error) {
      console.error('Error fetching section headers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch section headers' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { headers: headers || [] },
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
