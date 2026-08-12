const points = [
  {
    title: "No account, ever",
    description: "Use the downloader immediately. No sign-up, no password, no email.",
  },
  {
    title: "Honest quality options",
    description:
      "We only ever show resolutions that genuinely exist for that video - never a fabricated 1080p.",
  },
  {
    title: "Nothing stored",
    description:
      "Videos stream straight to your browser. We don't keep a copy on our servers.",
  },
  {
    title: "Built for mobile",
    description: "Large tap targets and a layout that works on any screen size.",
  },
];

export function WhyUse() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <h2 className="text-center text-3xl font-semibold text-ink">
          Why use this tool
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {points.map((point) => (
            <div key={point.title} className="flex gap-4">
              <span
                className="signal-bars mt-1 shrink-0 text-signal"
                aria-hidden="true"
              >
                <span />
                <span />
                <span />
                <span />
              </span>
              <div>
                <h3 className="font-semibold text-ink">{point.title}</h3>
                <p className="mt-1 text-sm text-ink/60">{point.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
