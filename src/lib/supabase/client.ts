// src/lib/supabase/client.ts
// Supabase client for browser-side usage
// Follows singleton pattern for optimal performance

import { createBrowserClient } from '@supabase/ssr';

// Environment variables (validated at build time)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Singleton instance
let clientInstance: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Get Supabase client instance for browser
 * Creates a new instance only if one doesn't exist
 */
export function getSupabaseClient(): ReturnType<typeof createBrowserClient> {
  if (!clientInstance) {
    clientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return clientInstance;
}

/**
 * Create a new Supabase client instance (use when you need a fresh instance)
 */
export function createSupabaseClient(): ReturnType<typeof createBrowserClient> {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Default export for backward compatibility
export const supabase = getSupabaseClient();
