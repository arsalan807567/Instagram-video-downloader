/**
 * Anonymous, IP-based rate limiting for the expensive /api/media route.
 *
 * This in-memory implementation is intentionally simple: it's correct for
 * a single edge instance and is enough to stop naive abuse and accidental
 * bill spikes on the free tier. It does NOT share state across Cloudflare
 * PoPs/instances.
 *
 * For stronger, globally-consistent protection, replace this with:
 *   - Cloudflare Rate Limiting Rules (dashboard-configured, free tier
 *     includes a limited allowance), and/or
 *   - Cloudflare Turnstile in front of the form for bot mitigation.
 * Both can be layered on top of this without changing the API contract.
 */

interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 10);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
}

export function checkRateLimit(identifier: string): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(identifier);

  if (!existing || now - existing.windowStart > WINDOW_MS) {
    buckets.set(identifier, { count: 1, windowStart: now });
    return { allowed: true, remaining: MAX_REQUESTS - 1, resetInMs: WINDOW_MS };
  }

  if (existing.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetInMs: WINDOW_MS - (now - existing.windowStart),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: MAX_REQUESTS - existing.count,
    resetInMs: WINDOW_MS - (now - existing.windowStart),
  };
}

// Periodic cleanup so the map doesn't grow unbounded on a long-lived
// instance. No-op concern on Workers (short-lived), useful in Node.
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (now - bucket.windowStart > WINDOW_MS) buckets.delete(key);
    }
  }, WINDOW_MS).unref?.();
}
