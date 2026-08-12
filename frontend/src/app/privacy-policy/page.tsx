import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  robots: { index: true, follow: true },
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-20">
      <h1 className="text-4xl font-semibold tracking-tight text-ink">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-ink/50">
        Last updated: [DATE - update before launch]
      </p>

      <div className="mt-10 space-y-8 text-ink/70">
        <section>
          <h2 className="text-xl font-semibold text-ink">
            What we collect
          </h2>
          <p className="mt-2">
            We do not require an account, so we don&apos;t collect names,
            emails, or passwords. When you use the downloader, the
            Instagram URL you submit is sent to our server to process your
            request, and is not permanently stored.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink">Analytics</h2>
          <p className="mt-2">
            We use Google Analytics 4 and Google Search Console to
            understand traffic and usage in aggregate. Analytics events
            record categorical information such as content type (video,
            reel, photo), selected quality, success or failure, and device
            type. We do not send full URLs, passwords, cookies, tokens, or
            other identifying information to analytics.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink">
            Why we collect it
          </h2>
          <p className="mt-2">
            This information helps us understand how the tool is used,
            identify and fix failures, and improve the product and our
            search visibility.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink">Retention</h2>
          <p className="mt-2">
            Submitted URLs are processed in memory and are not written to
            persistent storage. Aggregate analytics data is retained
            according to Google Analytics&apos; default retention settings.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink">
            Advertising
          </h2>
          <p className="mt-2">
            This site does not currently show advertisements. If
            advertising is added in the future, this policy will be
            updated to describe what is collected and how it&apos;s used
            before ads go live.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink">
            Your choices
          </h2>
          <p className="mt-2">
            [Add region-specific consent/opt-out mechanism details here
            once applicable privacy requirements for your target markets
            have been reviewed - see README for guidance.]
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink">Contact</h2>
          <p className="mt-2">
            Questions about this policy can be sent to{" "}
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
