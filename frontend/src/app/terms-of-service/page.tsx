import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  robots: { index: true, follow: true },
  alternates: { canonical: "/terms-of-service" },
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
      name: "Terms of Service",
      item: "/terms-of-service",
    },
  ],
};

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <h1 className="text-4xl font-semibold tracking-tight text-ink">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-ink/50">
        Last updated: [DATE - update before launch]
      </p>

      <div className="mt-10 space-y-8 text-ink/70">
        <section>
          <h2 className="text-xl font-semibold text-ink">
            No affiliation
          </h2>
          <p className="mt-2">
            This site is an independent tool and is not affiliated with,
            endorsed by, or sponsored by Instagram or Meta Platforms, Inc.
            Instagram is a trademark of Meta Platforms, Inc.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink">
            Your responsibility
          </h2>
          <p className="mt-2">
            You are solely responsible for ensuring you have the necessary
            rights or permission to download, store, and use any content
            you retrieve through this site. Downloading a video does not
            transfer any copyright or other rights in that content to you.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink">
            Acceptable use
          </h2>
          <p className="mt-2">
            You agree not to use this site to access private accounts,
            attempt to bypass any technical restriction, or use the
            service in a way that violates Instagram&apos;s own terms or
            applicable law.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink">
            No warranty
          </h2>
          <p className="mt-2">
            This tool is provided &quot;as is,&quot; without warranty of
            any kind. Availability and reliability may change at any time,
            including because of changes outside our control.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink">Contact</h2>
          <p className="mt-2">
            Questions about these terms can be sent to{" "}
            <a href="mailto:hello@example.com" className="text-signal">
              hello@example.com
            </a>
            .
          </p>
        </section>
      </div>
    </article>
  );
}
