import { NextRequest, NextResponse } from 'next/server';
// import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'; // Old import
// import { cookies } from 'next/headers'; // Old import
import { createClient } from '@/utils/supabase/server'; // New import for @supabase/ssr server client

export const revalidate = 0;

// GET: Retrieve user domain completion statistics
export async function GET(_request: NextRequest) {
  // Create Supabase client using the new server utility
  const supabase = await createClient();

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('User fetch Error:', userError.message);
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
    } else if (user) {
      const userId = user.id;
      console.log('Found user ID from auth for domains:', userId);

      const { data: domainStats, error: rpcError } = await supabase
        .rpc('get_user_domain_stats', { p_user_id: userId });

      if (rpcError) {
        console.error('Error fetching user domain stats:', rpcError);
        return NextResponse.json({ error: 'Failed to fetch user domain stats' }, { status: 500 });
      }

      const { count: totalDomains, error: countError } = await supabase
        .from('domains')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('Error fetching total domains count:', countError);
      }

      return NextResponse.json({
        domains: domainStats,
        totalDomains: totalDomains || 0
      });
    } else {
      console.log('No user found from auth for domains');
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

  } catch (error) {
    console.error('An unexpected error occurred:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
