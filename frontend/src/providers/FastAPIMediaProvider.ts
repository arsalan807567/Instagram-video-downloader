import {
  MediaProvider,
  MediaResult,
} from "./MediaProvider";

const FASTAPI_URL =
  process.env.FASTAPI_URL ??
  "https://instagram-video-downloader-y1cb.onrender.com";

export class FastAPIMediaProvider implements MediaProvider {
  canHandle(normalizedUrl: string): boolean {
    return normalizedUrl.includes("instagram.com");
  }

  async getMedia(normalizedUrl: string): Promise<MediaResult> {
    try {
      const downloadUrl =
        `/api/download?url=${encodeURIComponent(normalizedUrl)}`;

      return {
        success: true,
        type: "reel",
        thumbnail: "",
        qualities: [
          {
            label: "720p",
            width: 1280,
            height: 720,
            downloadUrl,
          },
        ],
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
