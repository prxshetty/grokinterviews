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

    // Check if the user is authenticated
    const { data: { user } } = await supabase.auth.getUser();

    // Check if the request is for a protected route
    const isProtectedRoute = req.nextUrl.pathname.startsWith('/dashboard');
    const isAuthRoute = req.nextUrl.pathname.startsWith('/auth') || req.nextUrl.pathname.startsWith('/signin');

    // If trying to access a protected route without being logged in
    if (isProtectedRoute && !user) {
      const redirectUrl = new URL('/signin', req.url);
      redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // If trying to access auth routes while logged in
    if (isAuthRoute && user) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  } catch {
    // If there's an error with authentication, allow the request to continue
    // This prevents authentication errors from blocking the entire site
    // Error is handled silently to prevent authentication errors from blocking the site
  }

  return res;
}

// Specify which routes this middleware should run on
export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*', '/signin'],
};
