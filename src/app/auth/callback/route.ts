import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // The database trigger handle_new_user will automatically create
      // profile and preferences for new users
      console.log('OAuth session exchange successful')
      return NextResponse.redirect(`${origin}/topics`)
    } else {
      console.error('OAuth session exchange failed:', error)
      return NextResponse.redirect(`${origin}/auth/signin?error=oauth_error`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/signin?error=missing_code`)
}
