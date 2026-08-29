// src/lib/supabase/server.ts
// Supabase server client for server-side usage (API routes, SSR)
// Follows singleton pattern with cookie handling

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Environment variables (validated at build time)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Singleton instance cache (per request in server components)
let clientInstance: ReturnType<typeof createServerClient> | null = null;

/**
 * Get or create Supabase server client
 * Note: In server components, each request gets its own instance
 */
export function getSupabaseServerClient(): ReturnType<typeof createServerClient> {
  // Always create new instance in server context to ensure proper cookie handling
  const cookieStore = cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: () => cookieStore,
  });
}

/**
 * Create Supabase server client with custom cookie store
 * Use this when you need to pass a specific cookie store
 */
export function createSupabaseServerClient(cookieStore?: ReturnType<typeof cookies>) {
  const actualCookieStore = cookieStore || cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: () => actualCookieStore,
  });
}

// Default export for backward compatibility
export const createClient = getSupabaseServerClient;
