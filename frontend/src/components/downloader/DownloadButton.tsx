"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  NormalizedQuality,
  NormalizedContentType,
} from "@/providers/MediaProvider";
import { track, getDeviceType } from "@/lib/analytics/track";

interface DownloadButtonProps {
  quality: NormalizedQuality;
  contentType: NormalizedContentType;
}

export function DownloadButton({
  quality,
  contentType,
}: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    if (isDownloading) return;

    setIsDownloading(true);

    track("download_success", {
      content_type: contentType,
      download_quality: quality.label,
      result: "success",
      device_type: getDeviceType(),
    });

    try {
      const link = document.createElement("a");

      link.href = quality.downloadUrl;
      link.download = "";
      link.rel = "noopener";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Keep the loading state visible briefly so the user
      // gets clear feedback that the download has started.
      window.setTimeout(() => {
        setIsDownloading(false);
      }, 1500);
    } catch (error) {
      console.error("Download error:", error);
      setIsDownloading(false);
    }
  }

  return (
    <Button
      size="lg"
      onClick={handleDownload}
      disabled={isDownloading}
      isLoading={isDownloading}
      className="w-full sm:w-auto"
    >
      {isDownloading
        ? `Preparing ${quality.label}...`
        : `Download ${quality.label}`}
    </Button>
  );
}
