export interface FaqItem {
  question: string;
  answer: string;
}

export const faqItems: FaqItem[] = [
  {
    question: "What is an Instagram video downloader?",
    answer:
      "It's a tool that lets you save a copy of a public Instagram video or reel directly to your device, by pasting the post's URL.",
  },
  {
    question: "How do I download an Instagram video?",
    answer:
      "Copy the link to a public video or reel from Instagram, paste it into the box on this page, click Download, then choose a quality and click Download again.",
  },
  {
    question: "Can I download a private Instagram video?",
    answer:
      "No. This tool only works with publicly accessible content and does not access private accounts or bypass any privacy settings.",
  },
  {
    question: "Do I need an Instagram account?",
    answer: "No account or login is required to use this tool.",
  },
  {
    question: "Can I choose the video quality?",
    answer:
      "Yes, when more than one resolution is available for a video you can pick between them, such as 360p, 480p, 720p, or 1080p.",
  },
  {
    question: "Can I download an Instagram Reel?",
    answer: "Yes, public reels are supported the same way as regular videos.",
  },
  {
    question: "Can I use this on iPhone?",
    answer:
      "Yes, the site works in any modern mobile browser on iPhone, and downloaded files are saved through your browser's normal download flow.",
  },
  {
    question: "Can I use this on Android?",
    answer:
      "Yes, it works the same way in any modern Android browser.",
  },
  {
    question: "Where are downloaded videos saved?",
    answer:
      "Files are saved to your device's default downloads location, the same place any file downloaded from your browser would go.",
  },
];
