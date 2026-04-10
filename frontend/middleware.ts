import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require being logged OUT (auth pages)
const AUTH_ROUTES = ['/login', '/register'];

// Routes that require being logged IN
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/gigs/post',
  '/messages',
  '/payments',
  '/notifications',
  '/profile',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value
    || request.headers.get('authorization')?.replace('Bearer ', '');

  // For the middleware we use a cookie-based check.
  // The frontend stores token in localStorage, so we also set a cookie on login.
  // If no cookie is found, we check if the path is protected.
  const isProtected = PROTECTED_PREFIXES.some(prefix => pathname.startsWith(prefix));
  const isAuthPage = AUTH_ROUTES.includes(pathname);

  // If accessing a protected route without a token cookie → redirect to login
  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If accessing login/register while already having a token → redirect to dashboard
  // (we'll do fine-grained role redirect on the client side after proper token verification)
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard/student', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/gigs/post',
    '/messages/:path*',
    '/payments/:path*',
    '/notifications/:path*',
    '/profile/:path*',
    '/login',
    '/register',
  ],
};
