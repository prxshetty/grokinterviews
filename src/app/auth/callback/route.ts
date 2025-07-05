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

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116: No rows found
        console.error('Error checking profile:', profileError)
        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=ProfileCheckFailed`);
      }

      if (!profileData) {
        console.log('Creating profile for OAuth user:', userData.user.id)
        const { user } = userData
        const email = user.email || ''
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

        // Create default user preferences for OAuth user
        console.log('Creating default user preferences for OAuth user:', user.id)
        const defaultPreferences = {
          user_id: user.id,
          specific_model_id: 'llama-3.1-8b-instant',
          preferred_model: 'groq',
          use_youtube_sources: true,
          use_pdf_sources: true,
          use_paper_sources: true,
          use_website_sources: true,
          use_book_sources: false,
          use_image_sources: true,
          preferred_answer_format: 'markdown',
          preferred_answer_depth: 'standard',
          include_code_snippets: true,
          include_latex_formulas: false,
          custom_formatting_instructions: null,
          theme: 'system',
          email_notifications: true,
        }

        const { error: preferencesError } = await supabase
          .from('user_preferences')
          .insert(defaultPreferences)

        if (preferencesError) {
          console.error('Error creating default preferences for OAuth user:', preferencesError)
          // Don't fail the entire flow, just log the error
        } else {
          console.log('Default preferences created successfully for OAuth user:', user.id)
        }
      }
      return NextResponse.redirect(`${origin}/topics`)
    }
    console.error('Error exchanging code for session:', error)
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${error.message}`);

  }

  // Fallback redirect if no code is present
  console.error('No code found in auth callback')
  return NextResponse.redirect(`${origin}/auth/auth-code-error?error=NoAuthCode`);
}
