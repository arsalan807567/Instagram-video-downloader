export function SupportedContent() {
  return (
    <section className="bg-mist py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="text-center text-3xl font-semibold text-ink">
          What Instagram content can you download?
        </h2>

        <div className="mt-8 space-y-5 text-ink/70">
          <p>
            This Instagram downloader supports publicly accessible Instagram
            videos and Reels. Paste the URL of a public video or Reel to check
            which downloadable qualities are available.
          </p>

          <p>
            Available video quality depends on the original content. If
            multiple resolutions are available, you can choose from the
            qualities provided for that specific video, such as 360p, 480p,
            720p, or 1080p.
          </p>

          <p>
            Private Instagram accounts and content that is not publicly
            accessible are not supported. The downloader does not bypass
            privacy settings or require access to private accounts.
          </p>
        </div>
      </div>
    </section>
  );
}
