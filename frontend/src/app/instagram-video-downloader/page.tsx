import type { Metadata } from "next";
import { DownloaderForm } from "@/components/downloader/DownloaderForm";
import { Faq } from "@/components/home/Faq";

export const metadata: Metadata = {
  title: "Instagram Video Downloader Online",
  description:
    "Download public Instagram videos in the resolution that's actually available - 360p up to 1080p. No account, no software to install.",
  alternates: { canonical: "/instagram-video-downloader" },
};

export default function InstagramVideoDownloaderPage() {
  return (
    <>
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <h1 className="text-4xl font-semibold tracking-tight text-ink">
          Instagram Video Downloader
        </h1>
        <p className="mt-4 text-lg text-ink/60">
          Paste a link to any public Instagram video below. If more than one
          resolution was uploaded, you&apos;ll be able to choose between
          them before downloading.
        </p>

        <div className="mt-8">
          <DownloaderForm />
        </div>

        <div className="mt-16 space-y-6 text-ink/70">
          <h2 className="text-2xl font-semibold text-ink">
            What counts as a &quot;public&quot; video?
          </h2>
          <p>
            A video is public if anyone can view it on instagram.com without
            logging in or being approved as a follower. If an account is
            set to private, its videos aren&apos;t accessible here - the
            same restriction Instagram itself applies.
          </p>

          <h2 className="text-2xl font-semibold text-ink">
            Why don&apos;t all videos have every quality?
          </h2>
          <p>
            The person who posted the video controls what resolutions get
            uploaded. Some videos are only available in a single quality.
            We show exactly what exists - we never upscale a video or
            invent a higher resolution than what was actually uploaded.
          </p>
        </div>
      </section>

      <Faq />
    </>
  );
}
