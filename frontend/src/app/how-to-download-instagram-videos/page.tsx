import type { Metadata } from "next";
import { DownloaderForm } from "@/components/downloader/DownloaderForm";

export const metadata: Metadata = {
  title: "How to Download Instagram Videos",
  description:
    "A step-by-step guide to downloading public Instagram videos and reels on iPhone, Android, or desktop.",
  alternates: { canonical: "/how-to-download-instagram-videos" },
};

const steps = [
  {
    title: "Find the video",
    body: "Open the public video or reel you want to download, either in the Instagram app or at instagram.com.",
  },
  {
    title: "Copy the link",
    body: 'Tap the share icon (the paper airplane) and choose "Copy Link." On desktop, click the three-dot menu on the post and choose "Copy Link."',
  },
  {
    title: "Paste it here",
    body: "Come back to this page and paste the link into the input box, then click Download.",
  },
  {
    title: "Choose a quality",
    body: "If the video has more than one available resolution, pick the one you want from the options shown.",
  },
  {
    title: "Download",
    body: "Click the Download button. Your browser will save the file to its default downloads location.",
  },
];

export default function HowToPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <h1 className="text-4xl font-semibold tracking-tight text-ink">
        How to Download Instagram Videos
      </h1>
      <p className="mt-4 text-lg text-ink/60">
        The same steps work whether you&apos;re on iPhone, Android, or a
        computer - only the way you copy the link changes slightly.
      </p>

      <ol className="mt-10 space-y-8">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-signal/10 font-mono text-sm font-medium text-signal">
              {index + 1}
            </span>
            <div>
              <h2 className="text-lg font-semibold text-ink">{step.title}</h2>
              <p className="mt-1 text-ink/60">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-16 rounded-2xl border border-line bg-mist p-6">
        <h2 className="text-xl font-semibold text-ink">Try it now</h2>
        <div className="mt-4">
          <DownloaderForm />
        </div>
      </div>

      <div className="mt-16 space-y-6 text-ink/70">
        <h2 className="text-2xl font-semibold text-ink">
          A note on private accounts
        </h2>
        <p>
          If the account is private, the link won&apos;t work here - the
          same way it wouldn&apos;t work for anyone who isn&apos;t an
          approved follower. This tool only retrieves content that&apos;s
          already publicly visible on Instagram.
        </p>
      </div>
    </article>
  );
}
