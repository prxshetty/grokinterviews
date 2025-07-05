import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server' // Import the updated server client

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient() // Use the new server client
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Check if the user has a profile (optional, but good practice from your original code)
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData?.user) {
        console.error('Error getting user after session exchange:', userError)
        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=UserNotFoundAfterExchange`);
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userData.user.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error checking profile:', profileError)
        // Optionally redirect to an error page or handle differently
        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=ProfileCheckFailed`);
      }

      if (!profileData) {
        console.log('Creating profile for OAuth user:', userData.user.id)
        const { user } = userData
        const email = user.email || ''
        // Supabase user_metadata might not be immediately available after code exchange with ssr client
        // It's safer to rely on user.email and potentially a default username/fullname
        // Or, if essential, make another call to get full user details after session is set.
        // For now, let's use email to derive username and a placeholder for full_name.
        const fullName = user.user_metadata?.full_name || user.user_metadata?.name || 'New User';
        const username = user.user_metadata?.user_name || user.user_metadata?.preferred_username || email.split('@')[0] || `user-${Date.now()}`;
        const avatarUrl = user.user_metadata?.avatar_url || '';

        const { error: insertError } = await supabase.from('profiles').insert([
          {
            id: user.id,
            username,
            full_name: fullName,
            email,
            avatar_url: avatarUrl,
          },
        ])

        if (insertError) {
          console.error('Error creating profile for OAuth user:', insertError)
          return NextResponse.redirect(`${origin}/auth/auth-code-error?error=ProfileCreationFailed`);
        }
      }
      // Successful authentication and profile check/creation
      return NextResponse.redirect(`${origin}/topics`) // Redirect to topics or a user-defined 'next' path
    }
    console.error('Error exchanging code for session:', error)
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${error.message}`);

  }

  // Fallback redirect if no code is present
  console.error('No code found in auth callback')
  return NextResponse.redirect(`${origin}/auth/auth-code-error?error=NoAuthCode`);
}
