const points = [
  {
    title: "No account required",
    description:
      "Download supported public Instagram videos and Reels without creating an account or entering your Instagram password.",
  },
  {
    title: "Use the available quality",
    description:
      "Choose from the video resolutions actually available for the content instead of relying on artificially upscaled quality.",
  },
  {
    title: "Simple online downloader",
    description:
      "Paste an Instagram URL, check the available options, and download directly through your browser.",
  },
  {
    title: "Works on mobile and desktop",
    description:
      "Use the downloader from a modern browser on iPhone, Android, Windows, Mac, or other supported devices.",
  },
];

export function WhyUse() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <h2 className="text-center text-3xl font-semibold text-ink">
          Why use this Instagram downloader?
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
                <p className="mt-1 text-sm text-ink/60">
                  {point.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
