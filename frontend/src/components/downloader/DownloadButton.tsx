"use client";

import { Button } from "@/components/ui/Button";
import { NormalizedQuality, NormalizedContentType } from "@/providers/MediaProvider";
import { track, getDeviceType } from "@/lib/analytics/track";

interface DownloadButtonProps {
  quality: NormalizedQuality;
  contentType: NormalizedContentType;
}

export function DownloadButton({ quality, contentType }: DownloadButtonProps) {
  function handleDownload() {
    track("download_success", {
      content_type: contentType,
      download_quality: quality.label,
      result: "success",
      device_type: getDeviceType(),
    });

    // Trigger a real browser download rather than navigating away.
    const link = document.createElement("a");
    link.href = quality.downloadUrl;
    link.download = "";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <Button size="lg" onClick={handleDownload} className="w-full sm:w-auto">
      Download {quality.label}
    </Button>
  );
}
