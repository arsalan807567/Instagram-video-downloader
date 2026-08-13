import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { WhyUse } from "@/components/home/WhyUse";
import { SupportedContent } from "@/components/home/SupportedContent";
import { Faq } from "@/components/home/Faq";
import { AdSlot } from "@/components/ads/AdSlot";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://instagram-video-downloader-iota-six.vercel.app";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "@id": `${siteUrl}/#application`,
  name: "Instagram Video Downloader",
  url: siteUrl,
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires a modern web browser.",
  description:
    "Download supported public Instagram videos and Reels online without creating an account.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />

      <Hero />

      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <AdSlot height={120} />
      </div>

      <HowItWorks />
      <WhyUse />
      <SupportedContent />
      <Faq />
    </>
  );
}
