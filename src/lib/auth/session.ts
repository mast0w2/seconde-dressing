// src/lib/auth/session.ts
// Server-side authentication and RBAC helpers
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Profile, Role } from '@/types/database';

/** Build a server Supabase client bound to the current request cookies. */
export function getAuthClient() {
  return createSupabaseServerClient();
}

/** Return the current authenticated user, or null if none. */
export async function getSessionUser() {
  const supabase = getAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Return the current authenticated user's profile, or null if none. */
export async function getProfile(): Promise<Profile | null> {
  const user = await getSessionUser();
  if (!user) return null;

  const supabase = getAuthClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile as Profile | null;
}

/**
 * Require an authenticated session. Redirects to /login if missing.
 * Returns the user id and the profile.
 */
export async function requireSession() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }
  const profile = await getProfile();
  if (!profile) {
    redirect('/signup');
  }
  return { user, profile };
}

/**
 * Require an authenticated session with a specific role.
 * Redirects to the role's dashboard if the role does not match.
 */
export async function requireRole(role: Role) {
  const { user, profile } = await requireSession();
  if (profile.role !== role) {
    redirect(profile.role === 'seller' ? '/dashboard/vendeur' : '/dashboard/client');
  }
  return { user, profile };
}
