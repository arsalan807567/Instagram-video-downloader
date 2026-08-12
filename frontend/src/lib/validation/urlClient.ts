/**
 * Client-side quick check, purely for UX (disabling the button, inline
 * hint). The server performs the real, authoritative validation in
 * src/lib/validation/url.ts - this must never be relied on for security.
 */
export function looksLikeInstagramUrl(value: string): boolean {
  return /^https:\/\/(www\.)?instagram\.com\/(p|reel|reels|tv)\/[A-Za-z0-9_-]+/.test(
    value.trim(),
  );
}
