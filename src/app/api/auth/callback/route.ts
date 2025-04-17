import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });

    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Error exchanging code for session:', error);
    } else if (data?.user) {
      // Check if the user has a profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is the error code for no rows returned
        console.error('Error checking profile:', profileError);
      }

      // If no profile exists, create one
      if (!profileData) {
        console.log('Creating profile for OAuth user:', data.user.id);

        // Extract user information from OAuth metadata
        const { user } = data;
        const email = user.email || '';
        const fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
        const username = user.user_metadata?.username || user.user_metadata?.preferred_username || email.split('@')[0];
        const avatarUrl = user.user_metadata?.avatar_url || '';

        const { error: insertError } = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              username,
              full_name: fullName,
              email,
              avatar_url: avatarUrl,
            },
          ]);

        if (insertError) {
          console.error('Error creating profile for OAuth user:', insertError);
        }
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL('/dashboard', request.url));
}
