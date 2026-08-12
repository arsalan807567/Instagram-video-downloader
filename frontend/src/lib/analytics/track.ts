/**
 * Centralized analytics wrapper.
 *
 * Rules enforced here (do not bypass by calling gtag directly elsewhere):
 * - Only an allow-listed set of event names may be sent.
 * - Only an allow-listed set of param keys may be sent.
 * - Never pass a raw URL, token, or free-text string as a param value.
 * - No-ops safely if GA hasn't loaded or the user is in an environment
 *   where analytics is disabled (e.g. NEXT_PUBLIC_ANALYTICS_ID unset).
 */

export type AnalyticsEvent =
  | "page_view"
  | "url_pasted"
  | "download_attempt"
  | "media_found"
  | "quality_selected"
  | "download_success"
  | "download_failure"
  | "faq_opened"
  | "copy_url_clicked";

type ContentType = "video" | "reel" | "photo" | "unknown";
type DownloadQuality = "360p" | "480p" | "720p" | "1080p" | "1440p" | "2160p" | "unknown";
type Result = "success" | "failure";
type FailureReason =
  | "invalid_url"
  | "unsupported_content"
  | "media_unavailable"
  | "provider_error"
  | "timeout"
  | "rate_limited";
type DeviceType = "mobile" | "tablet" | "desktop";

export interface AnalyticsParams {
  content_type?: ContentType;
  download_quality?: DownloadQuality;
  result?: Result;
  failure_reason?: FailureReason;
  device_type?: DeviceType;
}

const ALLOWED_PARAM_KEYS = new Set<keyof AnalyticsParams>([
  "content_type",
  "download_quality",
  "result",
  "failure_reason",
  "device_type",
]);

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function sanitizeParams(params: AnalyticsParams = {}): Record<string, string> {
  const safe: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (ALLOWED_PARAM_KEYS.has(key as keyof AnalyticsParams) && value) {
      safe[key] = String(value);
    }
  }
  return safe;
}

export function track(event: AnalyticsEvent, params?: AnalyticsParams): void {
  if (typeof window === "undefined") return;
  if (!window.gtag) return; // analytics not loaded (dev, consent declined, etc.)

  window.gtag("event", event, sanitizeParams(params));
}

export function getDeviceType(): DeviceType {
  if (typeof window === "undefined") return "desktop";
  const width = window.innerWidth;
  if (width < 640) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}
