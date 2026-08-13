import { validateInstagramUrl } from "@/lib/validation/url";
import { getMediaProvider } from "@/providers";
import { MediaResult } from "@/providers/MediaProvider";

const PROVIDER_TIMEOUT_MS = Number(process.env.PROVIDER_TIMEOUT_MS ?? 20_000);

export async function resolveMedia(rawUrl: string): Promise<MediaResult> {
  const validation = validateInstagramUrl(rawUrl);

  if (!validation.valid || !validation.normalizedUrl) {
    return {
      success: false,
      code: "invalid_url",
      message: "Please enter a valid Instagram URL.",
    };
  }

  const provider = getMediaProvider();

  if (!provider.canHandle(validation.normalizedUrl)) {
    return {
      success: false,
      code: "unsupported_content",
      message: "This type of Instagram content isn't currently supported.",
    };
  }

  try {
    return await withTimeout(
      provider.getMedia(validation.normalizedUrl),
      PROVIDER_TIMEOUT_MS,
    );
  } catch (error) {
    if (error instanceof TimeoutError) {
      return {
        success: false,
        code: "timeout",
        message: "This is taking longer than expected. Please try again.",
      };
    }

    // Never leak the raw error (stack trace, provider internals) to the
    // client. Log server-side with an internal id for debugging instead.
    const internalId = crypto.randomUUID();
    console.error(`[mediaService:${internalId}]`, error);

    return {
      success: false,
      code: "provider_error",
      message:
        "We're having trouble retrieving this video right now. Please try again shortly.",
    };
  }
}

class TimeoutError extends Error {}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError()), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
