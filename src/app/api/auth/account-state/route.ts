// State of an email address, queried by the login page before it asks for
// anything else.
//
// Three possible answers, and that is the whole point of this route: until now
// the page asked everyone for a password, and `signInWithPassword` returned
// the same error for an unknown address and for a space created from the
// appointment request form, which never had a password.
//
// The read goes through the `account_password_state` function
// (supabase/migrations/0012), the only thing able to look at
// `auth.users.encrypted_password`, and reserved to the service role key.
// Without it we answer `unavailable` and the login page falls back to its
// former, complete form.

import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { allowRequest, clientIp } from "@/lib/rate-limit";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// This route tells the caller who has an account here. That is deliberate —
// the flow requires it — but we do not let it sweep a whole address book:
// 30 lookups per IP every 10 minutes, counted in the database so every
// server instance shares the same numbers.
const WINDOW_SECONDS = 600;
const MAX_PER_WINDOW = 30;

interface AccountRow {
  account_exists: boolean | null;
  has_password: boolean | null;
}

export async function POST(request: Request) {
  let body: { email?: unknown };
  try {
    body = (await request.json()) as { email?: unknown };
  } catch {
    return NextResponse.json({ status: "error" }, { status: 400 });
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ status: "invalid_email" }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    console.warn(
      "[Auth account state] SUPABASE_SERVICE_ROLE_KEY missing: account state unknown."
    );
    return NextResponse.json({ status: "unavailable" });
  }

  const allowed = await allowRequest({
    key: `account-state:ip:${clientIp(request)}`,
    max: MAX_PER_WINDOW,
    windowSeconds: WINDOW_SECONDS,
  });
  if (!allowed) {
    return NextResponse.json({ status: "rate_limited" }, { status: 429 });
  }

  const { data, error } = await admin.rpc("account_password_state", {
    account_email: email,
  });

  if (error) {
    // Migration 0012 not applied yet, or the grant was revoked: we do not
    // shut anyone out, the login page goes back to its complete form.
    console.error("[Auth account state] Read failed:", error.message);
    return NextResponse.json({ status: "unavailable" });
  }

  const row = (Array.isArray(data) ? data[0] : data) as AccountRow | undefined;

  if (!row?.account_exists) {
    return NextResponse.json({ status: "no_account" });
  }

  return NextResponse.json({
    status: row.has_password ? "has_password" : "no_password",
  });
}
