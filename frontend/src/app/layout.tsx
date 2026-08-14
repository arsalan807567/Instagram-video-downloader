import type { Metadata } from "next";
import { Inter, Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Analytics } from "@/components/layout/Analytics";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      "https://reelfetch.online",
  ),
  title: {
    default: "Reelfetch - Free Instagram Video & Reels Downloader",
    template: "%s | Reelfetch",
  },
  description:
    "Download public Instagram videos and Reels online for free with Reelfetch. Paste an Instagram URL, choose the available video quality, and download without logging in.",
  keywords: [
    "reelfetch",
    "instagram video downloader",
    "instagram downloader",
    "instagram reels downloader",
    "download instagram videos",
    "download instagram reels",
    "instagram video download",
  ],
  applicationName: "Reelfetch",
  category: "utilities",
  alternates: {
    canonical: "./",
  },
  openGraph: {
    type: "website",
    siteName: "Reelfetch",
    title: "Reelfetch - Free Instagram Video & Reels Downloader",
    description:
      "Download public Instagram videos and Reels online for free. No login required.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Reelfetch - Free Instagram Video Downloader",
    description:
      "Download public Instagram videos and Reels online. No login required.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};


const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "Reelfetch",
      description:
        "Download public Instagram videos and Reels online for free.",
      inLanguage: "en",
    },
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "Reelfetch",
      url: siteUrl,
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${plexMono.variable} antialiased flex min-h-screen flex-col`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-signal focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <Header />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
