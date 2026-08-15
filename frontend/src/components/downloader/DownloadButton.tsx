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

type Phase = "idle" | "queued" | "downloading";

// How long we'll keep polling the queue before giving up and
// showing an error, rather than polling forever.
const MAX_QUEUE_POLL_ATTEMPTS = 60;
const QUEUE_POLL_INTERVAL_MS = 1500;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function DownloadButton({
  quality,
  contentType,
}: DownloadButtonProps) {
  const [phase, setPhase] = useState<Phase>("idle");

  const [queuePosition, setQueuePosition] =
    useState<number | null>(null);

  const [progress, setProgress] = useState(0);

  const [error, setError] = useState<string | null>(
    null,
  );

  async function handleDownload() {
    if (phase !== "idle") return;

    setError(null);
    setProgress(0);

    try {
      // ------------------------------------------------------
      // 1. Claim a spot in the download queue
      // ------------------------------------------------------

      const joinResponse = await fetch("/api/queue/join", {
        method: "POST",
        cache: "no-store",
      });

      const joinData = await joinResponse.json();

      if (!joinResponse.ok || !joinData.ticket_id) {
        throw new Error(
          joinData.message ??
            "Unable to join the download queue. Please try again.",
        );
      }

      const ticketId: string = joinData.ticket_id;
      let status: string = joinData.status;
      let position: number = joinData.position ?? 0;

      // ------------------------------------------------------
      // 2. If someone's ahead, wait and show a live position
      // ------------------------------------------------------

      if (status !== "ready") {
        setPhase("queued");
        setQueuePosition(position);

        let attempts = 0;

        while (status !== "ready" && attempts < MAX_QUEUE_POLL_ATTEMPTS) {
          await wait(QUEUE_POLL_INTERVAL_MS);
          attempts += 1;

          const statusResponse = await fetch(
            `/api/queue/status?ticket_id=${encodeURIComponent(ticketId)}`,
            { cache: "no-store" },
          );

          const statusData = await statusResponse.json();

          if (!statusResponse.ok) {
            throw new Error(
              statusData.message ??
                "Your download slot expired. Please try again.",
            );
          }

          status = statusData.status;
          position = statusData.position ?? 0;
          setQueuePosition(position);
        }

        if (status !== "ready") {
          throw new Error(
            "Still waiting for a free download slot. Please try again.",
          );
        }
      }

      // ------------------------------------------------------
      // 3. It's our turn - start the actual (heavy) download
      // ------------------------------------------------------

      setPhase("downloading");
      setQueuePosition(null);

      const finalUrl =
        `${quality.downloadUrl}&ticket_id=${encodeURIComponent(ticketId)}`;

      const response = await fetch(
        finalUrl,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      if (!response.ok) {
        let message = `Download failed (${response.status})`;

        try {
          const errorBody = await response.json();
          if (errorBody?.message) {
            message = errorBody.message;
          }
        } catch {
          // response wasn't JSON - keep the generic message
        }

        throw new Error(message);
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
        downloadError instanceof Error
          ? downloadError.message
          : "Download failed. Please try again.",
      );

      track("download_success", {
        content_type: contentType,
        download_quality: quality.label,
        result: "failure",
        device_type: getDeviceType(),
      });
    } finally {
      setTimeout(() => {
        setPhase("idle");
        setProgress(0);
        setQueuePosition(null);
      }, 1200);
    }
  }

  const isBusy = phase !== "idle";

  let buttonLabel = `Download ${quality.label}`;

  if (phase === "queued") {
    buttonLabel =
      queuePosition && queuePosition > 0
        ? `In queue - ${queuePosition} ahead of you`
        : "Almost your turn...";
  } else if (phase === "downloading") {
    buttonLabel =
      progress > 0
        ? `Downloading ${progress}%`
        : `Preparing ${quality.label}...`;
  }

  return (
    <div className="w-full sm:w-auto">
      <Button
        size="lg"
        onClick={handleDownload}
        disabled={isBusy}
        isLoading={isBusy}
        className="w-full sm:w-auto"
      >
        {buttonLabel}
      </Button>

      {phase === "queued" && (
        <p className="mt-2 text-xs text-ink/50">
          {queuePosition && queuePosition > 0
            ? `The server is busy right now - ${queuePosition} ${
                queuePosition === 1 ? "person is" : "people are"
              } ahead of you. Hang tight, this updates automatically.`
            : "A slot is opening up for you..."}
        </p>
      )}

      {phase === "downloading" && (
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

      {phase === "downloading" && (
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
