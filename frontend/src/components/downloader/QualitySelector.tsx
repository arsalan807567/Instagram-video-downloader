import { NormalizedQuality } from "@/providers/MediaProvider";

interface QualitySelectorProps {
  qualities: NormalizedQuality[];
  selected: NormalizedQuality;
  onSelect: (quality: NormalizedQuality) => void;
}

// Bars filled per label - literal use of the signature signal-bars motif
// as a functional quality indicator, not just a logo.
const BAR_COUNT: Record<NormalizedQuality["label"], number> = {
  "360p": 1,
  "480p": 2,
  "720p": 3,
  "1080p": 4,
};

export function QualitySelector({
  qualities,
  selected,
  onSelect,
}: QualitySelectorProps) {
  if (qualities.length === 1) {
    // Simplified UI per spec: don't show a selector for a single option.
    return null;
  }

  return (
    <fieldset>
      <legend className="text-sm font-medium text-ink/70">
        Available quality
      </legend>
      <div className="mt-2 flex flex-wrap gap-2" role="radiogroup">
        {qualities.map((quality) => {
          const isSelected = quality.label === selected.label;
          const filled = BAR_COUNT[quality.label];
          return (
            <button
              key={quality.label}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(quality)}
              className={`flex min-h-11 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                isSelected
                  ? "border-signal bg-signal/5 text-signal"
                  : "border-line text-ink/70 hover:border-signal/50"
              }`}
            >
              <span className="signal-bars" aria-hidden="true">
                {[1, 2, 3, 4].map((bar) => (
                  <span
                    key={bar}
                    style={{
                      opacity: bar <= filled ? 1 : 0.2,
                    }}
                  />
                ))}
              </span>
              {quality.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
