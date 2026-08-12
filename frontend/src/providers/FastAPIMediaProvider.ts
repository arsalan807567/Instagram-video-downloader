import {
  MediaProvider,
  MediaResult,
  NormalizedQuality,
} from "./MediaProvider";

const FASTAPI_URL =
  process.env.FASTAPI_URL ??
  "https://instagram-video-downloader-y1cb.onrender.com";

type FastAPIFormat = {
  format_id?: string;
  ext?: string;
  width?: number;
  height?: number;
  filesize?: number;
  filesize_approx?: number;
  url?: string;
};

function formatFileSize(bytes?: number): string | undefined {
  if (!bytes || bytes <= 0) return undefined;

  const mb = bytes / (1024 * 1024);

  if (mb < 1) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${mb.toFixed(1)} MB`;
}

function normalizeQuality(
  format: FastAPIFormat,
  normalizedUrl: string,
): NormalizedQuality | null {
  const height = format.height;

  if (!height || !format.width) {
    return null;
  }

  const supportedHeights = [360, 480, 720, 1080];

  const closestHeight = supportedHeights.reduce((previous, current) =>
    Math.abs(current - height) < Math.abs(previous - height)
      ? current
      : previous,
  );

  const downloadUrl =
    `/api/download?url=${encodeURIComponent(normalizedUrl)}&quality=${closestHeight}`;

  return {
    label: `${closestHeight}p` as "360p" | "480p" | "720p" | "1080p",
    width: format.width,
    height: closestHeight,
    fileSize: formatFileSize(
      format.filesize ?? format.filesize_approx,
    ),
    downloadUrl,
  };
}

export class FastAPIMediaProvider implements MediaProvider {
  canHandle(normalizedUrl: string): boolean {
    return normalizedUrl.includes("instagram.com");
  }

  async getMedia(normalizedUrl: string): Promise<MediaResult> {
    try {
      /*
       * The FastAPI service currently downloads the video directly.
       *
       * The frontend API proxy handles the actual download.
       *
       * We expose the quality choices here so the UI can show
       * multiple options.
       */

      const qualities: NormalizedQuality[] = [
        {
          label: "360p",
          width: 640,
          height: 360,
          downloadUrl:
            `/api/download?url=${encodeURIComponent(normalizedUrl)}&quality=360`,
        },
        {
          label: "480p",
          width: 854,
          height: 480,
          downloadUrl:
            `/api/download?url=${encodeURIComponent(normalizedUrl)}&quality=480`,
        },
        {
          label: "720p",
          width: 1280,
          height: 720,
          downloadUrl:
            `/api/download?url=${encodeURIComponent(normalizedUrl)}&quality=720`,
        },
        {
          label: "1080p",
          width: 1920,
          height: 1080,
          downloadUrl:
            `/api/download?url=${encodeURIComponent(normalizedUrl)}&quality=1080`,
        },
      ];

      return {
        success: true,
        type: "reel",
        thumbnail: "",
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
