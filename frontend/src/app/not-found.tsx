import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center sm:px-6">
      <span className="signal-bars text-line" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </span>
      <h1 className="mt-6 text-3xl font-semibold text-ink">
        Page not found
      </h1>
      <p className="mt-2 text-ink/60">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <Link href="/" className="mt-8">
        <Button>Back to the downloader</Button>
      </Link>
    </div>
  );
}
