// Bot detection for the public forms, without CAPTCHA or third-party
// service. Two traps, both invisible to people:
//
//   * a honeypot: an input hidden from people (and from screen readers) that
//     naive bots fill in like any other field;
//   * a minimum fill time: the form sends the moment it was displayed, and
//     nobody types a whole form in under three seconds.
//
// The rate limits in src/lib/rate-limit.ts remain the safety net against
// bots that call the API directly.

/** Name of the hidden field. Not a type browsers autofill. */
export const HONEYPOT_FIELD = "website";
/** Name of the field carrying the time the form was displayed (epoch ms). */
export const STARTED_AT_FIELD = "formStartedAt";
export const MIN_FILL_TIME_MS = 3000;

/**
 * True when the submission looks automated. Missing trap fields are not
 * suspicious: a page loaded before a deploy does not send them yet.
 */
export function isLikelySpam(body: unknown, now: number = Date.now()): boolean {
  if (!body || typeof body !== "object") return false;
  const data = body as Record<string, unknown>;

  const honeypot = data[HONEYPOT_FIELD];
  if (typeof honeypot === "string" && honeypot.trim() !== "") return true;

  const startedAt = data[STARTED_AT_FIELD];
  if (typeof startedAt === "number" && Number.isFinite(startedAt)) {
    const elapsed = now - startedAt;
    if (elapsed >= 0 && elapsed < MIN_FILL_TIME_MS) return true;
  }

  return false;
}
