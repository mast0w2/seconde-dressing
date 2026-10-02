// Audience measurement without a consent banner.
//
// Vercel Web Analytics sets no cookie, keeps no IP address and does not
// follow visitors across sites: the CNIL exempts this kind of strictly
// anonymous, first-party statistics from prior consent, provided visitors
// are informed and can object. They object from the privacy policy; the
// choice is kept in localStorage and never sent to the server. A browser
// sending Global Privacy Control is treated as having objected.

const STORAGE_KEY = "seconde:analytics-opt-out";

/** Fired on window after the visitor changes their choice. */
export const ANALYTICS_PREFERENCE_EVENT = "seconde:analytics-preference";

function sendsGlobalPrivacyControl(): boolean {
  return (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
}

/** True when the visitor objected, here or through their browser (GPC). */
export function isAnalyticsOptedOut(): boolean {
  if (sendsGlobalPrivacyControl()) return true;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/** True when the objection comes from the browser and cannot be undone here. */
export function isOptOutFromBrowser(): boolean {
  return sendsGlobalPrivacyControl();
}

export function setAnalyticsOptOut(optOut: boolean): void {
  try {
    if (optOut) window.localStorage.setItem(STORAGE_KEY, "1");
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Blocked storage: the choice still applies until the page is closed.
  }
  window.dispatchEvent(new CustomEvent<boolean>(ANALYTICS_PREFERENCE_EVENT, { detail: optOut }));
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
