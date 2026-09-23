// src/lib/auth/post-signin.ts
// What happens right after a session has just been opened, whichever road was
// taken: a link sent by Supabase (/api/auth/callback), a link sent by Brevo
// (/api/auth/confirm), or a password chosen at /reset-password.
//
// Two routes used to duplicate this code and only one of them created the
// profile row, which left accounts without a profile. That matters more than
// it sounds: `requireSession()` redirects to /signup when the profile is
// missing, so such an account can sign in and still be bounced out of its own
// dashboard.

import type { SupabaseClient } from "@supabase/supabase-js";
import { isProfileComplete, dashboardPathForRole } from "@/lib/profile";
import { attachAnonymousRequests } from "@/lib/requests-attach";
import { roleFromMetadata } from "@/lib/auth/role";
import type { Profile } from "@/types/database";

export interface PostSignInOptions {
  /**
   * True when the link confirmed a signup rather than a sign-in. We then do
   * not keep the session: the person goes back to /login and signs in with
   * the password they just chose, as the confirmation screen told them.
   */
  flowSignup?: boolean;
}

export type EnsureProfileResult =
  | { status: "ok"; profile: Partial<Profile> }
  /** Nobody is signed in. */
  | { status: "noSession" }
  /** Someone is signed in, but the profile row could not be created. */
  | { status: "failed" };

/**
 * Makes sure the signed-in account has a profile row, and attaches the
 * requests it made before it had an account.
 *
 * Every path that opens a session must go through this, including the
 * password-setup link: an account born from the appointment request form has
 * no profile until its first arrival, and whichever link gets there first is
 * the one that has to create it.
 */
export async function ensureProfile(
  supabase: SupabaseClient
): Promise<EnsureProfileResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "noSession" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[post-signin] Could not read the profile:", profileError.message);
  }

  if (profile) {
    await attachAnonymousRequests(supabase);
    return { status: "ok", profile };
  }

  // No profile yet: first arrival through a link. Whatever was typed at
  // signup or in the request form travels in the account metadata, so we
  // create the profile here without asking for any of it again. Missing or
  // broken metadata still yields a minimal profile rather than a dead end —
  // the person is authenticated, and signing up again would fail since the
  // account already exists.
  const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
  const newProfile = {
    id: user.id,
    email: user.email,
    first_name: meta.first_name ?? "",
    last_name: meta.last_name ?? "",
    phone: meta.phone ?? null,
    street_address: meta.street_address ?? null,
    role: roleFromMetadata(user.user_metadata),
  };

  const { error: creationError } = await supabase.from("profiles").insert(newProfile);

  if (creationError) {
    console.error("[post-signin] Could not create the profile:", creationError.message);
    return { status: "failed" };
  }

  await attachAnonymousRequests(supabase);

  return { status: "ok", profile: newProfile };
}

/**
 * Creates the profile if needed, attaches anonymous requests, and returns the
 * path to send the signed-in person to.
 */
export async function resolvePostSignInDestination(
  supabase: SupabaseClient,
  { flowSignup = false }: PostSignInOptions = {}
): Promise<string> {
  const result = await ensureProfile(supabase);

  if (result.status === "noSession") {
    return "/login";
  }

  // A signup confirmation: the session the link opened is not meant to last.
  const finish = async (destination: string) => {
    if (!flowSignup) return destination;
    await supabase.auth.signOut();
    return "/login?confirmed=1";
  };

  if (result.status === "failed") {
    // The session is open regardless: /profile knows how to create a minimal
    // profile, which beats looping back to /login.
    return finish("/profile?incomplete=1");
  }

  // Incomplete profile: have the phone and address filled in before sending
  // anyone to a dashboard.
  return finish(
    isProfileComplete(result.profile) && result.profile.role
      ? dashboardPathForRole(result.profile.role)
      : "/profile?incomplete=1"
  );
}
