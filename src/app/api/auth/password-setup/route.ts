// Password-setup link, for a space that does not have a password yet.
//
// A space born from the appointment request form exists in `auth.users`
// without a password: its owner never really "created an account". When she
// reaches the login page, it sends her this link instead of asking for a
// password that does not exist.
//
// The token is a `recovery` one — the only kind that opens a session *and*
// allows `updateUser({ password })` right after. As in /api/auth/espace,
// Supabase merely mints the token and Brevo sends the message: the built-in
// mailer is capped at two emails per hour.

import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { notificationService } from "@/lib/email";
import { allowRequest, clientIp } from "@/lib/rate-limit";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Same guardrail as /api/auth/espace: this route sends an email to an
// arbitrary address. Counted in the database, shared by every instance.
async function tooManyRequests(request: Request, email: string): Promise<boolean> {
  const allowed = await allowRequest(
    { key: `password-setup:ip:${clientIp(request)}`, max: 20, windowSeconds: 3600 },
    { key: `password-setup:to:${email}:minute`, max: 1, windowSeconds: 60 },
    { key: `password-setup:to:${email}:hour`, max: 5, windowSeconds: 3600 }
  );
  return !allowed;
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
  if (!admin || !process.env.BREVO_API_KEY) {
    console.warn(
      "[Auth password setup] Service role or Brevo key missing: cannot send the link."
    );
    return NextResponse.json({ status: "unavailable" });
  }

  if (await tooManyRequests(request, email)) {
    return NextResponse.json({ status: "rate_limited" }, { status: 429 });
  }

  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
  });

  const hashedToken = data?.properties?.hashed_token;
  if (error || !hashedToken) {
    // Unknown address included: the login page only calls this route after
    // /api/auth/account-state, so a failure here really is a failure.
    console.error(
      "[Auth password setup] Could not generate the link:",
      error?.message ?? "hashed_token missing"
    );
    return NextResponse.json({ status: "error" }, { status: 500 });
  }

  // The site URL comes from the request, so Vercel previews keep a link that
  // points back at themselves.
  const origin = new URL(request.url).origin;
  const base = (process.env.NEXT_PUBLIC_SITE_URL || origin).replace(/\/$/, "");
  const link = `${base}/api/auth/confirm?token_hash=${encodeURIComponent(
    hashedToken
  )}&type=recovery`;

  const sent = await notificationService.sendPasswordSetupLink(email, link);

  if (!sent.success) {
    console.error(
      "[Auth password setup] Could not send the link to",
      email,
      "-",
      sent.error || sent.message
    );
    return NextResponse.json({ status: "error" }, { status: 500 });
  }

  return NextResponse.json({ status: "sent" });
}
