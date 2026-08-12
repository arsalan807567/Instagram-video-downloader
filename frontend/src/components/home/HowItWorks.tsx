const steps = [
  {
    title: "Paste the link",
    description:
      "Copy the link to a public Instagram video or reel and paste it into the box above.",
  },
  {
    title: "We check it",
    description:
      "The URL is validated and checked against the content that's actually available.",
  },
  {
    title: "Pick a quality",
    description:
      "If more than one resolution is available, choose the one you want.",
  },
  {
    title: "Download",
    description: "Your browser downloads the file directly - nothing is stored on our end.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-mist py-16 sm:py-20" id="how-it-works">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <h2 className="text-center text-3xl font-semibold text-ink">
          How it works
        </h2>
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
              <p className="mt-1 text-sm text-ink/60">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
