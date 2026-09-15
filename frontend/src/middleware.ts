import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Edge Middleware.
 * Answers strictly: "Does a session exist?"
 * Checks presence of access_token or refresh_token cookie directly.
 * Backend and Route Guard components enforce role-based authorization.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected paths that require an active session
  const isProtectedPath =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/mystery-box');

  if (isProtectedPath) {
    const hasAccessToken = request.cookies.has('access_token');
    const hasRefreshToken = request.cookies.has('refresh_token');

    if (!hasAccessToken && !hasRefreshToken) {
      const signInUrl = new URL('/', request.url);
      signInUrl.searchParams.set('auth', 'signin');
      signInUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match protected paths, excluding static assets, images, and API routes
     */
    '/admin/:path*',
    '/mystery-box/:path*',
  ],
};
