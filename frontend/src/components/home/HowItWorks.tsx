const steps = [
  {
    title: "Copy the Instagram link",
    description:
      "Open the public Instagram video or Reel you want to download and copy its URL.",
  },
  {
    title: "Paste the URL",
    description:
      "Paste the Instagram video or Reel URL into the downloader and click Download.",
  },
  {
    title: "Choose a quality",
    description:
      "If multiple resolutions are available, choose the video quality you want.",
  },
  {
    title: "Download the video",
    description:
      "Click Download and your browser will save the video to your device.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-mist py-16 sm:py-20" id="how-it-works">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <h2 className="text-center text-3xl font-semibold text-ink">
          How to download an Instagram video
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-center text-ink/60">
          Downloading a public Instagram video or Reel takes a few simple
          steps. No account or software installation is required.
        </p>

        <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="rounded-2xl border border-line bg-white p-6"
            >
              <span className="font-mono text-sm text-signal">
                {String(index + 1).padStart(2, "0")}
              </span>

              <h3 className="mt-2 text-lg font-semibold text-ink">
                {step.title}
              </h3>

              <p className="mt-1 text-sm text-ink/60">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
