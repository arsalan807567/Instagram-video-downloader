"use client";

import { useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { QualitySelector } from "./QualitySelector";
import { DownloadButton } from "./DownloadButton";
import { NormalizedMedia, NormalizedQuality } from "@/providers/MediaProvider";
import { track, getDeviceType } from "@/lib/analytics/track";

const CONTENT_LABEL: Record<NormalizedMedia["type"], string> = {
  video: "Instagram Video",
  reel: "Instagram Reel",
  photo: "Instagram Photo",
};

export function DownloaderResult({ result }: { result: NormalizedMedia }) {
  const highestQuality = result.qualities[result.qualities.length - 1];
  const [selected, setSelected] = useState<NormalizedQuality>(highestQuality);

  return (
    <Card className="mt-6">
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="relative aspect-[9/16] w-full max-w-[180px] shrink-0 overflow-hidden rounded-xl bg-mist sm:w-[180px]">
          <Image
            src={result.thumbnail}
            alt={`Preview of the ${CONTENT_LABEL[result.type]}`}
            fill
            className="object-cover"
            sizes="180px"
          />
        </div>

        <div className="flex flex-1 flex-col gap-4">
          <div>
            <p className="text-sm font-medium text-signal">
              {CONTENT_LABEL[result.type]}
            </p>
            {result.duration !== undefined && (
              <p className="text-sm text-ink/50">{result.duration}s</p>
            )}
          </div>

          <QualitySelector
            qualities={result.qualities}
            selected={selected}
            onSelect={(quality) => {
              setSelected(quality);
              track("quality_selected", {
                content_type: result.type,
                download_quality: quality.label,
                device_type: getDeviceType(),
              });
            }}
          />

          <div>
            <DownloadButton quality={selected} contentType={result.type} />
            {selected.fileSize && (
              <p className="mt-2 text-xs text-ink/40">
                Approx. {selected.fileSize}
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
