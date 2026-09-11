// src/middleware.ts
// Protect private routes: redirect unauthenticated visitors to /login.
// Refreshes the Supabase auth session on every request so protected pages
// and the middleware itself see a valid access token.
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/preferences',
  '/demande-rdv',
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
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
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
    '/preferences/:path*',
    '/demande-rdv/:path*',
    '/dashboard',
    '/profile',
    '/preferences',
    '/demande-rdv',
  ],
};
