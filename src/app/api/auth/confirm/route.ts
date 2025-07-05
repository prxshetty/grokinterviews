import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/topics'
  const origin = request.nextUrl.origin

  console.log('Email confirmation attempt:', { token_hash: !!token_hash, type, next })

  if (token_hash && type) {
    // Create response object first
    let response = NextResponse.next()
    
    // Create Supabase client with proper cookie handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set(name, value, options)
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.delete({ name, ...options })
          },
        },
      }
    )

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      })

      console.log('OTP verification result:', { 
        success: !!data?.user, 
        userId: data?.user?.id,
        hasSession: !!data?.session,
        error: error?.message 
      })

      if (error) {
        console.error('OTP Verification Error:', error.message)
        const redirectUrl = new URL('/auth/confirm', origin)
        redirectUrl.searchParams.set('error', 'invalid_token')
        return NextResponse.redirect(redirectUrl)
      }

      // If verification is successful, data.user will be populated
      if (data?.user && data?.session) {
        console.log('User verified successfully, checking/creating profile...')
        
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', data.user.id)
            .single()

          console.log('Profile check result:', { 
            profileExists: !!profile, 
            profileError: profileError?.message 
          })

          // If profile doesn't exist, create it
          if (!profile && profileError?.code === 'PGRST116') {
            const { error: insertError } = await supabase.from('profiles').insert({
              id: data.user.id,
              email: data.user.email,
              full_name: data.user.user_metadata?.full_name ?? 
                         (data.user.user_metadata?.first_name && data.user.user_metadata?.last_name 
                         ? `${data.user.user_metadata.first_name} ${data.user.user_metadata.last_name}` 
                         : 'New User'),
              username: data.user.user_metadata?.username ?? data.user.email?.split('@')[0] ?? `user-${Date.now()}`,
              avatar_url: data.user.user_metadata?.avatar_url,
            })

            if (insertError) {
              console.error(`Error creating profile for user ${data.user.id}:`, insertError)
            } else {
              console.log('Profile created successfully for user:', data.user.id)

              // Create default user preferences for email confirmed user
              console.log('Creating default user preferences for email confirmed user:', data.user.id)
              const defaultPreferences = {
                user_id: data.user.id,
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
                console.error('Error creating default preferences for email confirmed user:', preferencesError)
                // Don't fail the entire flow, just log the error
              } else {
                console.log('Default preferences created successfully for email confirmed user:', data.user.id)
              }
            }
          }

        } catch (profileError) {
          console.error(`Error checking/creating profile for user ${data.user.id}:`, profileError)
          // Don't block the user, continue with redirect
        }

        // Create the redirect response with success parameters
        const redirectUrl = new URL('/auth/confirm', origin)
        redirectUrl.searchParams.set('success', 'true')
        redirectUrl.searchParams.set('next', next)
        
        console.log('Redirecting to:', redirectUrl.toString())
        
        // Update response to be a redirect while preserving cookies
        response = NextResponse.redirect(redirectUrl)
        
        // The cookies should already be set by the supabase client above
        return response
      } else {
        console.error('No user or session returned from verifyOtp')
        const redirectUrl = new URL('/auth/confirm', origin)
        redirectUrl.searchParams.set('error', 'no_session')
        return NextResponse.redirect(redirectUrl)
      }

    } catch (verifyError) {
      console.error('Error during OTP verification:', verifyError)
      const redirectUrl = new URL('/auth/confirm', origin)
      redirectUrl.searchParams.set('error', 'verification_failed')
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Fallback for missing params
  console.error('Missing token_hash or type parameters')
  const redirectUrl = new URL('/auth/confirm', origin)
  redirectUrl.searchParams.set('error', 'missing_parameters')
  return NextResponse.redirect(redirectUrl)
} 