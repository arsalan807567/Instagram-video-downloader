"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  NormalizedQuality,
  NormalizedContentType,
} from "@/providers/MediaProvider";
import {
  track,
  getDeviceType,
} from "@/lib/analytics/track";

interface DownloadButtonProps {
  quality: NormalizedQuality;
  contentType: NormalizedContentType;
}

export function DownloadButton({
  quality,
  contentType,
}: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] =
    useState(false);

  const [progress, setProgress] = useState(0);

  const [error, setError] = useState<string | null>(
    null,
  );

  async function handleDownload() {
    if (isDownloading) return;

    setIsDownloading(true);
    setProgress(0);
    setError(null);

    try {
      const response = await fetch(
        quality.downloadUrl,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error(
          `Download failed (${response.status})`,
        );
      }

      if (!response.body) {
        throw new Error(
          "The download stream is unavailable.",
        );
      }

      const contentLength = Number(
        response.headers.get("content-length") ?? 0,
      );

      const reader = response.body.getReader();

      const chunks: Uint8Array[] = [];

      let received = 0;

      while (true) {
        const { done, value } =
          await reader.read();

        if (done) break;

        if (value) {
          chunks.push(value);
          received += value.length;

          if (contentLength > 0) {
            setProgress(
              Math.min(
                100,
                Math.round(
                  (received / contentLength) * 100,
                ),
              ),
            );
          }
        }
      }

      const blobParts = chunks.map((chunk) => {
        const buffer = new ArrayBuffer(chunk.byteLength);
        new Uint8Array(buffer).set(chunk);
        return buffer;
      });

      const blob = new Blob(blobParts, {
        type:
          response.headers.get("content-type") ||
          "video/mp4",
      });

      const disposition =
        response.headers.get(
          "content-disposition",
        );

      let filename = `instagram_${quality.label}.mp4`;

      const filenameMatch =
        disposition?.match(
          /filename="([^"]+)"/i,
        );

      if (filenameMatch?.[1]) {
        filename = filenameMatch[1];
      }

      const blobUrl =
        URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = blobUrl;
      link.download = filename;
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(blobUrl);

      setProgress(100);

      track("download_success", {
        content_type: contentType,
        download_quality: quality.label,
        result: "success",
        device_type: getDeviceType(),
      });
    } catch (downloadError) {
      console.error(
        "Download error:",
        downloadError,
      );

      setError(
        "Download failed. Please try again.",
      );

      track("download_success", {
        content_type: contentType,
        download_quality: quality.label,
        result: "failure",
        device_type: getDeviceType(),
      });
    } finally {
      setTimeout(() => {
        setIsDownloading(false);
        setProgress(0);
      }, 1200);
    }
  }

  return (
    <div className="w-full sm:w-auto">
      <Button
        size="lg"
        onClick={handleDownload}
        disabled={isDownloading}
        isLoading={isDownloading}
        className="w-full sm:w-auto"
      >
        {isDownloading
          ? progress > 0
            ? `Downloading ${progress}%`
            : `Preparing ${quality.label}...`
          : `Download ${quality.label}`}
      </Button>

      {isDownloading && (
        <div
          className="mt-3 h-2 w-full overflow-hidden rounded-full bg-mist"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <div
            className="h-full rounded-full bg-signal transition-[width] duration-200"
            style={{
              width:
                progress > 0
                  ? `${progress}%`
                  : "8%",
            }}
          />
        </div>
      )}

      {isDownloading && (
        <p className="mt-2 text-xs text-ink/50">
          {progress > 0
            ? `${progress}% downloaded`
            : "Preparing your video..."}
        </p>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
