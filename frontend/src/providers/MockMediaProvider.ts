import {
  MediaProvider,
  MediaResult,
  NormalizedError,
} from "./MediaProvider";

/**
 * MOCK PROVIDER - development and testing only.
 *
 * Returns local demo assets so the full application (UI, API contract,
 * analytics, error states) can be built and tested without depending on
 * any external Instagram retrieval mechanism.
 *
 * The scenario is selected deterministically from the URL's post code so
 * QA and Playwright tests can reliably trigger each state:
 *
 *   /reel/success...      -> full result, 3 qualities
 *   /reel/single...       -> full result, 1 quality only
 *   /reel/private...      -> private_content error
 *   /reel/unavailable...  -> media_unavailable error
 *   /reel/slow...         -> success, after an artificial delay
 *   /p/photo...           -> photo result, no qualities/duration
 *   anything else         -> provider_error (simulates an unexpected failure)
 */
export class MockMediaProvider implements MediaProvider {
  canHandle(normalizedUrl: string): boolean {
    return normalizedUrl.includes("instagram.com");
  }

  async getMedia(normalizedUrl: string): Promise<MediaResult> {
    const code = extractCode(normalizedUrl);

    if (code.startsWith("private")) {
      return err("private_content", "This content isn't publicly available.");
    }

    if (code.startsWith("unavailable")) {
      return err(
        "media_unavailable",
        "We couldn't retrieve this video right now. Please try again.",
      );
    }

    if (code.startsWith("slow")) {
      await delay(3000);
      return successVideo();
    }

    if (code.startsWith("single")) {
      return successVideo({ singleQuality: true });
    }

    if (normalizedUrl.includes("/p/") && code.startsWith("photo")) {
      return {
        success: true,
        type: "photo",
        thumbnail: "/demo/demo-thumb.jpg",
        qualities: [
          {
            label: "1080p",
            width: 1080,
            height: 1080,
            downloadUrl: "/demo/demo-thumb.jpg",
          },
        ],
      };
    }

    if (code.startsWith("success")) {
      return successVideo();
    }

    return err(
      "provider_error",
      "We're having trouble retrieving this video right now. Please try again shortly.",
    );
  }
}

function successVideo({ singleQuality = false } = {}): MediaResult {
  const all = [
    {
      label: "360p" as const,
      width: 640,
      height: 360,
      fileSize: "1.8 MB",
      downloadUrl: "/demo/demo-360p.mp4",
    },
    {
      label: "480p" as const,
      width: 854,
      height: 480,
      fileSize: "2.6 MB",
      downloadUrl: "/demo/demo-480p.mp4",
    },
    {
      label: "720p" as const,
      width: 1280,
      height: 720,
      fileSize: "4.1 MB",
      downloadUrl: "/demo/demo-720p.mp4",
    },
  ];

  return {
    success: true,
    type: "reel",
    thumbnail: "/demo/demo-thumb.jpg",
    duration: 4,
    qualities: singleQuality ? [all[2]] : all,
  };
}

function err(code: NormalizedError["code"], message: string): NormalizedError {
  return { success: false, code, message };
}

function extractCode(normalizedUrl: string): string {
  const match = normalizedUrl.match(/\/(?:p|reel|reels|tv)\/([^/?]+)/);
  return match?.[1]?.toLowerCase() ?? "";
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
