import {
  MediaProvider,
  MediaResult,
  NormalizedQuality,
} from "./MediaProvider";

const FASTAPI_URL =
  process.env.FASTAPI_URL ??
  "https://instagram-video-downloader-y1cb.onrender.com";

type FastAPIQuality = {
  label?: string;
  width?: number;
  height?: number;
  fileSize?: string | null;
  format_id?: string;
};

type FastAPIMediaResponse = {
  success?: boolean;
  type?: "video" | "reel" | "photo";
  thumbnail?: string;
  duration?: number | null;
  qualities?: FastAPIQuality[];
  detail?: string;
};

const ALLOWED_QUALITIES = new Set([
  "360p",
  "480p",
  "720p",
  "1080p",
  "1440p",
  "2160p",
]);

export class FastAPIMediaProvider implements MediaProvider {
  canHandle(normalizedUrl: string): boolean {
    return normalizedUrl.includes("instagram.com");
  }

  async getMedia(normalizedUrl: string): Promise<MediaResult> {
    try {
      const endpoint =
        `${FASTAPI_URL}/api/media?url=` +
        encodeURIComponent(normalizedUrl);

      const response = await fetch(endpoint, {
        method: "GET",
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });

      const data =
        (await response.json()) as FastAPIMediaResponse;

      if (!response.ok || !data.success) {
        return {
          success: false,
          code: "media_unavailable",
          message:
            data.detail ??
            "Unable to retrieve this Instagram media.",
        };
      }

      const qualities: NormalizedQuality[] = (data.qualities ?? [])
        .filter(
          (quality) =>
            typeof quality.label === "string" &&
            ALLOWED_QUALITIES.has(quality.label) &&
            typeof quality.width === "number" &&
            typeof quality.height === "number",
        )
        .map((quality) => {
          const label = quality.label as NormalizedQuality["label"];

          return {
            label,
            width: quality.width!,
            height: quality.height!,
            fileSize: quality.fileSize ?? undefined,
            downloadUrl:
              `/api/download?url=${encodeURIComponent(normalizedUrl)}` +
              `&quality=${encodeURIComponent(label)}`,
          };
        })
        .sort((a, b) => a.height - b.height);

      if (qualities.length === 0) {
        return {
          success: false,
          code: "media_unavailable",
          message: "No downloadable video qualities were found.",
        };
      }

      return {
        success: true,
        type: data.type ?? "reel",
        thumbnail: data.thumbnail ?? "",
        duration:
          typeof data.duration === "number"
            ? data.duration
            : undefined,
        qualities,
      };
    } catch (error) {
      console.error("FastAPI provider error:", error);

      return {
        success: false,
        code: "provider_error",
        message:
          "We're having trouble retrieving this video right now. Please try again shortly.",
      };
    }
  }
}
