// src/lib/safe-redirect.ts
// `?redirect=` comes from the URL, so anyone can craft a link carrying it.
// It is only followed to a path on this site: "/dashboard/seller" yes;
// "https://evil.example", "//evil.example", "/\evil.example" or
// "javascript:…" no. Browsers turn backslashes into slashes and drop tabs and
// newlines, which is why those are refused outright.

const BASE = "https://seconde.invalid";

export function safeRedirectPath(target: string | null | undefined): string | null {
  if (!target || !target.startsWith("/") || target.startsWith("//")) {
    return null;
  }
  if (/[\\\u0000-\u001f\u007f]/.test(target)) {
    return null;
  }

  try {
    const url = new URL(target, BASE);
    if (url.origin !== BASE) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
