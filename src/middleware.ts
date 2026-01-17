import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  try {
    // Create a Supabase client for the middleware
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            res.cookies.set(name, value, options)
          },
          remove(name: string, options: CookieOptions) {
            res.cookies.delete({ name, ...options })
          },
        },
      }
    )

    // PRODUCTION FIX: More robust authentication check
    let user = null;
    let retryCount = 0;
    const maxRetries = 2;

    // Retry logic for session verification in case of timing issues
    while (!user && retryCount < maxRetries) {
      try {
        const { data: { user: currentUser }, error } = await supabase.auth.getUser();
        if (!error && currentUser) {
          user = currentUser;
          break;
        }
        retryCount++;
        if (retryCount < maxRetries) {
          // Small delay before retry
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (authError) {
        retryCount++;
        if (retryCount >= maxRetries) {
          console.error('Auth verification failed after retries:', authError);
        }
      }
    }

    // Check if the request is for a protected route
    const isProtectedRoute = req.nextUrl.pathname.startsWith('/topics') ||
      req.nextUrl.pathname.startsWith('/transcripts') ||
      req.nextUrl.pathname.startsWith('/voice') ||
      req.nextUrl.pathname.startsWith('/api/');
    const isAuthRoute = req.nextUrl.pathname.startsWith('/auth') || req.nextUrl.pathname.startsWith('/signin');
    const isConfirmRoute = req.nextUrl.pathname === '/auth/confirm';

    // If trying to access a protected route without being logged in
    if (isProtectedRoute && !user) {
      if (req.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const redirectUrl = new URL('/signin', req.url);
      redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Allow access to /auth/confirm even if user is authenticated (for email confirmation)
    if (isConfirmRoute) {
      return res;
    }

    // If trying to access other auth routes while logged in
    if (isAuthRoute && user) {
      return NextResponse.redirect(new URL('/topics', req.url));
    }
  } catch (error) {
    // If there's an error with authentication, allow the request to continue
    // This prevents authentication errors from blocking the entire site
    console.error('Middleware auth error (non-blocking):', error);
  }

  return res;
}

export const config = {
  matcher: [
    '/topics/:path*',
    '/transcripts/:path*',
    '/voice/:path*',
    '/auth/:path*',
    '/signin',
    '/api/generate-answer',
    '/api/test-ai-connection',
    '/api/voice/:path*'
  ],
};
