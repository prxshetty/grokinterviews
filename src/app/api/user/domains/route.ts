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
        .from('topics')
        .select('domain', { count: 'exact', head: true })
        .not('domain', 'is', null);

      if (countError) {
        console.error('Error fetching total domains count:', countError);
      }
      
      return NextResponse.json({
        domains: domainStats || [],
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

// Helper function to get a color for each domain
function getDomainColor(domain: string): string {
  const colorMap: Record<string, string> = {
    'dsa': '#8B5CF6', // Purple
    'ml': '#EC4899', // Pink
    'sdesign': '#3B82F6', // Blue
    'ai': '#10B981', // Green
    'backend': '#F59E0B', // Amber
    'frontend': '#EF4444', // Red
    'devops': '#6366F1', // Indigo
    'mobile': '#14B8A6', // Teal
    'security': '#F97316', // Orange
    'cloud': '#8B5CF6', // Purple
  };

  return colorMap[domain] || '#8B5CF6'; // Default to purple
}

// Helper function to get a friendly name for each domain
function getDomainFriendlyName(domain: string): string {
  const nameMap: Record<string, string> = {
    'dsa': 'Data Structures & Algorithms',
    'ml': 'Machine Learning',
    'sdesign': 'System Design',
    'ai': 'Artificial Intelligence',
    'backend': 'Backend Development',
    'frontend': 'Frontend Development',
    'devops': 'DevOps',
    'mobile': 'Mobile Development',
    'security': 'Security',
    'cloud': 'Cloud Computing',
  };

  if (nameMap[domain]) {
    return nameMap[domain];
  }

  // Capitalize first letter of each word
  return domain.split('_')
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
