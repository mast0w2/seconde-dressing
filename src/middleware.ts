// src/middleware.ts
// Protect private routes: redirect unauthenticated visitors to /login.
// Refreshes the Supabase auth session on every request so protected pages
// and the middleware itself see a valid access token.
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/appointment-request',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(key: string) {
          return request.cookies.get(key)?.value;
        },
        set(key: string, value: string, options: CookieOptions) {
          request.cookies.set(key, value);
          response.cookies.set(key, value, options);
        },
        remove(key: string, options: CookieOptions) {
          request.cookies.delete(key);
          response.cookies.set(key, '', { ...options, maxAge: 0 });
        },
      },
    }
  );

  // Refresh the session (also refreshes the access token if needed).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtected) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/appointment-request/:path*',
    '/dashboard',
    '/profile',
    '/appointment-request',
  ],
};
