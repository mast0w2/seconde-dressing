// Visitor's choice about audience measurement (the only optional tracker on
// the site). Stored in localStorage, never sent to the server.
//
// CNIL guidance: accepting and refusing must be equally easy, the choice must
// be remembered, and visitors are asked again after six months at most.

export type ConsentChoice = "granted" | "denied";

const STORAGE_KEY = "seconde:consent";
/** Bump to ask everyone again, e.g. when a new tracker is added. */
const CONSENT_VERSION = 1;
export const CONSENT_MAX_AGE_MS = 182 * 24 * 60 * 60 * 1000;

/** Fired on window after the choice changes; detail is the new choice. */
export const CONSENT_CHANGE_EVENT = "seconde:consent-change";
/** Fired on window to reopen the banner (footer and privacy page links). */
export const OPEN_COOKIE_SETTINGS_EVENT = "seconde:open-cookie-settings";

interface StoredConsent {
  version: number;
  analytics: ConsentChoice;
  /** Epoch milliseconds of the choice. */
  at: number;
}

function isStoredConsent(value: unknown): value is StoredConsent {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.version === "number" &&
    (v.analytics === "granted" || v.analytics === "denied") &&
    typeof v.at === "number"
  );
}

/**
 * The stored choice, or null when the visitor has not chosen yet, chose more
 * than six months ago, chose under an older version, or storage is blocked.
 */
export function readConsent(now: number = Date.now()): ConsentChoice | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isStoredConsent(parsed)) return null;
    if (parsed.version !== CONSENT_VERSION) return null;
    if (now - parsed.at > CONSENT_MAX_AGE_MS || parsed.at > now) return null;
    return parsed.analytics;
  } catch {
    return null;
  }
}

export function writeConsent(choice: ConsentChoice, now: number = Date.now()): void {
  const value: StoredConsent = { version: CONSENT_VERSION, analytics: choice, at: now };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Private browsing or blocked storage: the choice still applies to this
    // page view, the banner simply comes back on the next visit.
  }
  window.dispatchEvent(new CustomEvent<ConsentChoice>(CONSENT_CHANGE_EVENT, { detail: choice }));
}

export function openCookieSettings(): void {
  window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT));
}

/**
 * URL sent to the analytics provider: query string and fragment removed, so
 * that tokens or emails in a link never leave the site. Campaign parameters
 * (utm_*) are kept, they carry no personal data.
 */
export function sanitizeAnalyticsUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const kept = new URLSearchParams();
    parsed.searchParams.forEach((value, key) => {
      if (key.startsWith("utm_")) kept.append(key, value);
    });
    const query = kept.toString();
    return `${parsed.origin}${parsed.pathname}${query ? `?${query}` : ""}`;
  } catch {
    return url.split(/[?#]/)[0];
  }
}
