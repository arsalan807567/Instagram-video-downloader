interface AdSlotProps {
  /** Reserved height in px - prevents layout shift once a real ad loads here. */
  height: number;
  label?: string;
}

/**
 * Placeholder for a future approved advertising provider. Intentionally
 * inert in the MVP: no network request, no script, no tracking. Reserves
 * its final dimensions up front so wiring in a real ad later causes zero
 * layout shift.
 */
export function AdSlot({ height, label = "Advertisement" }: AdSlotProps) {
  if (process.env.NEXT_PUBLIC_ADS_ENABLED !== "true") return null;

  return (
    <div
      role="complementary"
      aria-label={label}
      style={{ minHeight: height }}
      className="flex items-center justify-center rounded-xl border border-dashed border-line text-xs text-ink/30"
    >
      {label}
    </div>
  );
}
