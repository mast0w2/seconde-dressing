// src/lib/supabase/client.ts
// Supabase client for browser-side usage
// Follows singleton pattern for optimal performance

import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseEnv } from './env';

/**
 * Create a new Supabase client instance (use when you need a fresh instance)
 */
export function createSupabaseClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient(url, anonKey);
}

export type SupabaseBrowserClient = ReturnType<typeof createSupabaseClient>;

// Singleton instance
let clientInstance: SupabaseBrowserClient | null = null;

/**
 * Get Supabase client instance for browser
 * Creates a new instance only if one doesn't exist
 */
export function getSupabaseClient(): SupabaseBrowserClient {
  if (!clientInstance) {
    clientInstance = createSupabaseClient();
  }
  return clientInstance;
}
