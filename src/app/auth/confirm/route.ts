import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/dashboard';

  console.log('Auth confirm route called with:', { token_hash, type, next });
  console.log('Full URL:', request.url);

  if (token_hash && type) {
    try {
      console.log('Creating Supabase client...');
      const supabase = await createClient();

      console.log('Verifying OTP with:', { type, token_hash });
      const { data, error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      });

      console.log('OTP verification result:', { data, error });

      if (!error) {
        // Redirect user to the dashboard or specified redirect URL
        return NextResponse.redirect(new URL(next, request.url));
      }

      // If there was an error, redirect to the sign-in page with the error
      console.error('Error verifying OTP:', error);
      return NextResponse.redirect(
        new URL(`/signin?error=${encodeURIComponent(error.message)}`, request.url)
      );
    } catch (error) {
      console.error('Exception in auth confirm:', error);
      return NextResponse.redirect(
        new URL('/signin?error=Authentication+error', request.url)
      );
    }
  }

  // If no token_hash or type, redirect to the sign-in page
  return NextResponse.redirect(new URL('/signin?error=Invalid+confirmation+link', request.url));
}
