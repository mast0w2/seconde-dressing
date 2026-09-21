// src/lib/supabase/env.ts
// Shared validation of the public Supabase environment variables.
// Fails fast with an explicit message instead of letting @supabase/ssr
// throw a generic error later (e.g. during prerendering in CI).

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  return { url, anonKey };
}
