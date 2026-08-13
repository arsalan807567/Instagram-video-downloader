import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://instagram-video-downloader-iota-six.vercel.app";

const routes = [
  { path: "", priority: 1.0, frequency: "weekly" as const },
  { path: "/instagram-video-downloader", priority: 0.9, frequency: "weekly" as const },
  { path: "/instagram-reels-downloader", priority: 0.9, frequency: "weekly" as const },
  { path: "/how-to-download-instagram-videos", priority: 0.8, frequency: "monthly" as const },
  { path: "/faq", priority: 0.7, frequency: "monthly" as const },
  { path: "/privacy-policy", priority: 0.3, frequency: "yearly" as const },
  { path: "/terms-of-service", priority: 0.3, frequency: "yearly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map(({ path, priority, frequency }) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: frequency,
    priority,
  }));
}
