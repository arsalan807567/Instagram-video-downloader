import type { Metadata } from "next";
import { Faq } from "@/components/home/Faq";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers to common questions about downloading public Instagram videos and reels.",
  alternates: { canonical: "/faq" },
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
      name: "FAQ",
      item: "/faq",
    },
  ],
};

export default function FaqPage() {
  return (
    <div className="py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <div className="mx-auto max-w-2xl px-4 pt-8 text-center sm:px-6">
        <h1 className="text-4xl font-semibold tracking-tight text-ink">
          Frequently asked questions
        </h1>
      </div>
      <Faq />
    </div>
  );
}
