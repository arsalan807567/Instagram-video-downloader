import Link from "next/link";

export function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 font-display text-lg font-semibold text-ink"
    >
      <span className="signal-bars text-signal" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </span>
      Reelfetch
    </Link>
  );
}
