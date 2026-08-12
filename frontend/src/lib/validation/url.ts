/**
 * Server-side URL validation. This is the authoritative check - client-side
 * validation exists only for UX and must never be trusted on its own.
 *
 * Guards against:
 * - Non-Instagram hostnames (strict allowlist, not a substring match)
 * - Non-HTTPS protocols
 * - Excessively long input (resource exhaustion)
 * - Path shapes that don't match a supported content type
 */

const ALLOWED_HOSTNAMES = new Set(["instagram.com", "www.instagram.com"]);
const MAX_URL_LENGTH = 500;

// /p/<code>, /reel/<code>, /tv/<code> - the public post/reel URL shapes.
const SUPPORTED_PATH_PATTERN = /^\/(p|reel|reels|tv)\/[A-Za-z0-9_-]+\/?$/;

export type ContentTypeGuess = "photo" | "video" | "reel" | "unknown";

export interface UrlValidationResult {
  valid: boolean;
  normalizedUrl?: string;
  contentTypeGuess?: ContentTypeGuess;
  error?: "invalid_format" | "unsupported_host" | "unsupported_path" | "too_long";
}

export function validateInstagramUrl(rawUrl: string): UrlValidationResult {
  if (typeof rawUrl !== "string" || rawUrl.length === 0) {
    return { valid: false, error: "invalid_format" };
  }

  if (rawUrl.length > MAX_URL_LENGTH) {
    return { valid: false, error: "too_long" };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return { valid: false, error: "invalid_format" };
  }

  // Strict protocol check - blocks javascript:, data:, file:, etc.
  if (parsed.protocol !== "https:") {
    return { valid: false, error: "invalid_format" };
  }

  // Exact hostname allowlist (not "includes instagram.com" - that would
  // allow attacker-controlled hosts like instagram.com.evil.example).
  if (!ALLOWED_HOSTNAMES.has(parsed.hostname.toLowerCase())) {
    return { valid: false, error: "unsupported_host" };
  }

  if (!SUPPORTED_PATH_PATTERN.test(parsed.pathname)) {
    return { valid: false, error: "unsupported_path" };
  }

  const contentTypeGuess: ContentTypeGuess = parsed.pathname.startsWith("/reel")
    ? "reel"
    : parsed.pathname.startsWith("/tv")
    ? "video"
    : "unknown"; // /p/ can be photo or video - provider will tell us

  // Normalize: strip query params/fragments (tracking params, etc.) before
  // it ever reaches a provider or gets logged.
  const normalizedUrl = `https://www.instagram.com${parsed.pathname}`;

  return { valid: true, normalizedUrl, contentTypeGuess };
}
