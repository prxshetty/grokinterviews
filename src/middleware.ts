import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  try {
    // Create a Supabase client for the middleware
    const supabase = createMiddlewareClient({ req, res });

    // Check if the user is authenticated
    const { data: { session } } = await supabase.auth.getSession();

    // Check if the request is for a protected route
    const isProtectedRoute = req.nextUrl.pathname.startsWith('/dashboard');
    const isAuthRoute = req.nextUrl.pathname.startsWith('/auth') || req.nextUrl.pathname.startsWith('/signin');

    // If trying to access a protected route without being logged in
    if (isProtectedRoute && !session) {
      const redirectUrl = new URL('/signin', req.url);
      redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // If trying to access auth routes while logged in
    if (isAuthRoute && session) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  } catch (error) {
    console.error('Middleware error:', error);
    // If there's an error with authentication, allow the request to continue
    // This prevents authentication errors from blocking the entire site
  }

  return res;
}

// Specify which routes this middleware should run on
export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*', '/signin'],
};
