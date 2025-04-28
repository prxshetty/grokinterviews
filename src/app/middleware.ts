import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const { pathname } = url;

  // Prevent automatic redirection from /topics to any specific domain
  if (pathname === '/topics') {
    // Make sure we remain on the topics page
    return NextResponse.next();
  }

  // Allow all other routes to proceed normally
  return NextResponse.next();
}

// Specify paths that middleware will run on
export const config = {
  matcher: ['/topics', '/topics/:path*'],
} 