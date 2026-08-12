import {
  MediaProvider,
  MediaResult,
  NormalizedQuality,
} from "./MediaProvider";

const FASTAPI_URL =
  process.env.FASTAPI_URL ??
  "https://instagram-video-downloader-y1cb.onrender.com";

type FastAPIMediaResponse = {
  success: boolean;
  type?: "video" | "reel" | "photo";
  thumbnail?: string;
  duration?: number | null;
  qualities?: Array<{
    label: string;
    width: number;
    height: number;
    format_id: string;
    fileSize?: string | null;
  }>;
  detail?: string;
};

const SUPPORTED_LABELS = [
  "360p",
  "480p",
  "720p",
  "1080p",
  "1440p",
  "2160p",
] as const;

type QualityLabel = (typeof SUPPORTED_LABELS)[number];

function isQualityLabel(
  value: string,
): value is QualityLabel {
  return SUPPORTED_LABELS.includes(
    value as QualityLabel,
  );
}

export class FastAPIMediaProvider implements MediaProvider {
  canHandle(normalizedUrl: string): boolean {
    try {
      const parsed = new URL(normalizedUrl);

      return (
        parsed.hostname === "instagram.com" ||
        parsed.hostname.endsWith(".instagram.com")
      );
    } catch {
      return false;
    }
  }

  async getMedia(
    normalizedUrl: string,
  ): Promise<MediaResult> {
    try {
      const mediaUrl =
        `${FASTAPI_URL}/api/media?url=` +
        encodeURIComponent(normalizedUrl);

      const response = await fetch(mediaUrl, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        console.error(
          "FastAPI media error:",
          response.status,
          await response.text(),
        );

        return {
          success: false,
          code: "media_unavailable",
          message:
            "Unable to retrieve this Instagram video.",
        };
      }

      const data =
        (await response.json()) as FastAPIMediaResponse;

      if (
        !data.success ||
        !data.qualities ||
        data.qualities.length === 0
      ) {
        return {
          success: false,
          code: "media_unavailable",
          message:
            "No downloadable video qualities were found.",
        };
      }

      const qualities: NormalizedQuality[] =
        data.qualities
          .filter((quality) =>
            isQualityLabel(quality.label),
          )
          .map((quality) => ({
            label: quality.label as QualityLabel,
            width: quality.width,
            height: quality.height,
            fileSize:
              quality.fileSize ?? undefined,

            // IMPORTANT:
            // FastAPI expects format_id, not quality.
            downloadUrl:
              `/api/download?url=${encodeURIComponent(
                normalizedUrl,
              )}&format_id=${encodeURIComponent(
                quality.format_id,
              )}`,
          }));

      if (qualities.length === 0) {
        return {
          success: false,
          code: "media_unavailable",
          message:
            "No supported video qualities were found.",
        };
      }

      return {
        success: true,
        type: data.type ?? "reel",
        thumbnail: data.thumbnail ?? "",
        duration:
          data.duration ?? undefined,
        qualities,
      };
    } catch (error) {
      console.error(
        "FastAPI provider error:",
        error,
      );

      return {
        success: false,
        code: "provider_error",
        message:
          "We're having trouble retrieving this video right now. Please try again shortly.",
      };
    }
  }
}
