// src/lib/supabase/server.ts
// Supabase server client for server-side usage (API routes, SSR).
// @supabase/ssr 0.3.0 uses the get/set/remove cookie methods (single cookie
// at a time). The access token is refreshed and persisted across requests.

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseEnv } from './env';

export function createSupabaseServerClient() {
  const { url, anonKey } = getSupabaseEnv();
  const cookieStore = cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      get(key: string) {
        return cookieStore.get(key)?.value;
      },
      set(key: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set(key, value, options);
        } catch {
          // `set` was called from a Server Component.
          // This can be ignored if you have middleware refreshing sessions.
        }
      },
      remove(key: string, options: CookieOptions) {
        try {
          cookieStore.set(key, '', { ...options, maxAge: 0 });
        } catch {
          // `remove` was called from a Server Component.
          // This can be ignored if you have middleware refreshing sessions.
        }
      },
    },
  });
}

export const getSupabaseServerClient = createSupabaseServerClient;
export const createClient = createSupabaseServerClient;
