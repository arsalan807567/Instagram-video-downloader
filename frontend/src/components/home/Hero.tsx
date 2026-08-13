import { DownloaderForm } from "@/components/downloader/DownloaderForm";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-24">
        <div
          className="mx-auto mb-6 flex w-fit items-center gap-1 rounded-full border border-line px-3 py-1 text-xs font-medium text-ink/60"
        >
          <span className="signal-bars text-signal" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </span>
          Real available video qualities — never guessed
        </div>

        <h1 className="text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Instagram Video Downloader
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-lg text-ink/60">
          Download public Instagram videos and Reels online for free. Paste
          an Instagram video URL, choose an available quality, and download
          the video to your device without creating an account.
        </p>

        <div className="mx-auto mt-8 max-w-xl text-left">
          <DownloaderForm />
        </div>
      </div>
    </section>
  );
}
