"use client";

import { useState } from "react";
import { faqItems } from "./faqData";
import { track } from "@/lib/analytics/track";

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-16 sm:py-20" id="faq">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <h2 className="text-center text-3xl font-semibold text-ink">
          Frequently asked questions
        </h2>
        <div className="mt-8 divide-y divide-line rounded-2xl border border-line">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={item.question}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => {
                    const next = isOpen ? null : index;
                    setOpenIndex(next);
                    if (next !== null) track("faq_opened");
                  }}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-ink"
                >
                  {item.question}
                  <span
                    className="shrink-0 text-signal transition-transform"
                    style={{ transform: isOpen ? "rotate(45deg)" : "none" }}
                    aria-hidden="true"
                  >
                    +
                  </span>
                </button>
                {isOpen && (
                  <p className="px-5 pb-4 text-sm text-ink/60">{item.answer}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Structured data for AEO / rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqItems.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: item.answer,
              },
            })),
          }),
        }}
      />
    </section>
  );
}
