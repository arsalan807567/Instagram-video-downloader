export function LoadingState() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-3 rounded-2xl border border-line bg-mist px-6 py-5 text-sm text-ink/70"
    >
      <span
        className="h-5 w-5 animate-spin rounded-full border-2 border-signal border-t-transparent"
        aria-hidden="true"
      />
      Fetching video…
    </div>
  );
}
