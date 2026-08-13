import type { Metadata } from "next";
import { DownloaderForm } from "@/components/downloader/DownloaderForm";

export const metadata: Metadata = {
  title: "Instagram Reels Downloader",
  description:
    "Download public Instagram Reels online in the available quality. Paste a reel link, no account required.",
  alternates: { canonical: "/instagram-reels-downloader" },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "/",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Instagram Reels Downloader",
      item: "/instagram-reels-downloader",
    },
  ],
};

export default function ReelsDownloaderPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <h1 className="text-4xl font-semibold tracking-tight text-ink">
        Instagram Reels Downloader
      </h1>
      <p className="mt-4 text-lg text-ink/60">
        Reels work the same way as regular videos here - paste the reel&apos;s
        link and download it directly.
      </p>

      <div className="mt-8">
        <DownloaderForm />
      </div>

      <div className="mt-16 space-y-6 text-ink/70">
        <h2 className="text-2xl font-semibold text-ink">
          Finding a reel&apos;s link
        </h2>
        <p>
          Open the reel in the Instagram app or on instagram.com, tap the
          share icon, and choose &quot;Copy Link.&quot; Paste that link into
          the box above.
        </p>

        <h2 className="text-2xl font-semibold text-ink">
          Reel quality options
        </h2>
        <p>
          Like regular videos, reels may be available in more than one
          resolution. You&apos;ll only see the qualities that genuinely
          exist for that specific reel.
        </p>
      </div>
    </section>
  );
}
