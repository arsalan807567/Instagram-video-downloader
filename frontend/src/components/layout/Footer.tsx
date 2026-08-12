import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-line bg-mist">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-ink/60">
              A simple, fast tool for downloading publicly available
              Instagram videos. No account required.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-ink">Product</h2>
            <ul className="mt-3 space-y-2 text-sm text-ink/60">
              <li>
                <Link href="/instagram-video-downloader" className="hover:text-signal">
                  Video Downloader
                </Link>
              </li>
              <li>
                <Link href="/instagram-reels-downloader" className="hover:text-signal">
                  Reels Downloader
                </Link>
              </li>
              <li>
                <Link href="/how-to-download-instagram-videos" className="hover:text-signal">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-signal">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-ink">Legal</h2>
            <ul className="mt-3 space-y-2 text-sm text-ink/60">
              <li>
                <Link href="/privacy-policy" className="hover:text-signal">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-of-service" className="hover:text-signal">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-ink">Contact</h2>
            <p className="mt-3 text-sm text-ink/60">
              <a href="mailto:hello@example.com" className="hover:text-signal">
                hello@example.com
              </a>
            </p>
          </div>
        </div>

        <div className="mt-10 border-t border-line pt-6 text-xs leading-relaxed text-ink/50">
          <p>
            © {new Date().getFullYear()} Reelfetch. Not affiliated with,
            endorsed by, or sponsored by Instagram or Meta Platforms, Inc.
            Instagram is a trademark of Meta Platforms, Inc. Users are
            solely responsible for ensuring they have the necessary rights
            or permission to download and use any content.
          </p>
        </div>
      </div>
    </footer>
  );
}
