// src/lib/auth/account-state.ts
// What the login page asks the server after its first step: does this address
// have an account, and does that account have a password?
//
// The answer decides the rest of the flow — password form, password-setup
// link, or an invitation to sign up — instead of demanding a password from
// everyone and letting Supabase return the same error in all three cases.

export type AccountState =
  /** No account behind this address. */
  | "no_account"
  /** The space exists (born from the request form) but has no password. */
  | "no_password"
  /** Full account: ask for the password. */
  | "has_password"
  | "invalid_email"
  | "rate_limited"
  /**
   * The server cannot answer (service role key missing, migration 0012 not
   * applied yet). The login page then falls back to its complete form:
   * password plus the emailed-link escape hatch.
   */
  | "unavailable";

export async function readAccountState(email: string): Promise<AccountState> {
  try {
    const response = await fetch("/api/auth/account-state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const body = (await response.json().catch(() => ({}))) as { status?: string };

    switch (body.status) {
      case "no_account":
      case "no_password":
      case "has_password":
      case "invalid_email":
      case "rate_limited":
      case "unavailable":
        return body.status;
      default:
        return "unavailable";
    }
  } catch (error) {
    console.warn(
      "[account-state] Could not call /api/auth/account-state:",
      error instanceof Error ? error.message : String(error)
    );
    // A network failure must not shut the door: let the page show its
    // complete form.
    return "unavailable";
  }
}

export type PasswordSetupResult = "sent" | "rate_limited" | "failed";

/**
 * Asks for the link that lets someone choose a password, for a space that
 * does not have one yet.
 */
export async function sendPasswordSetupLink(
  email: string
): Promise<PasswordSetupResult> {
  try {
    const response = await fetch("/api/auth/password-setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const body = (await response.json().catch(() => ({}))) as { status?: string };

    switch (body.status) {
      case "sent":
        return "sent";
      case "rate_limited":
        return "rate_limited";
      default:
        return "failed";
    }
  } catch (error) {
    console.warn(
      "[account-state] Could not call /api/auth/password-setup:",
      error instanceof Error ? error.message : String(error)
    );
    return "failed";
  }
}
