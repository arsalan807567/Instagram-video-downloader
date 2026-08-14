import Link from "next/link";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";

const CONTACT_EMAIL = "arslankhan807567@gmail.com";

const navLinks = [
  { href: "/instagram-video-downloader", label: "Video Downloader" },
  { href: "/instagram-reels-downloader", label: "Reels Downloader" },
  { href: "/how-to-download-instagram-videos", label: "How It Works" },
  { href: "/faq", label: "FAQ" },
];

const mobileLinks = [
  ...navLinks,
  { href: `mailto:${CONTACT_EMAIL}`, label: "Contact" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Logo />
        <nav
          aria-label="Primary"
          className="hidden items-center gap-8 md:flex"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink/70 transition-colors hover:text-signal"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="rounded-lg bg-signal px-4 py-2 text-sm font-medium text-white transition-colors hover:bz-signal/90"
          >
            Contact
          </a>
        </nav>
        <MobileMenu links={mobileLinks} />
      </div>
    </header>
  );
}
