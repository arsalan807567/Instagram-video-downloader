"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const ENV = process.env.NEXT_PUBLIC_APP_ENV ?? "development";

/**
 * Loads GA4 only in production, and only when an ID is configured.
 * Uses next/script's "afterInteractive" strategy so it never blocks
 * first paint or contributes to LCP.
 */
export function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (ENV !== "production" || !GA_ID || !window.gtag) return;
    window.gtag("event", "page_view", { page_path: pathname });
  }, [pathname]);

  if (ENV !== "production" || !GA_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { send_page_view: false, anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
