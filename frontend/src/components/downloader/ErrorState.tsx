import { MediaErrorCode } from "@/providers/MediaProvider";

const MESSAGES: Record<MediaErrorCode, string> = {
  invalid_url: "Please enter a valid Instagram URL.",
  unsupported_content: "This type of Instagram content isn't currently supported.",
  private_content: "This content isn't publicly available.",
  media_unavailable: "We couldn't retrieve this video right now. Please try again.",
  provider_error:
    "We're having trouble retrieving this video right now. Please try again shortly.",
  timeout: "This is taking longer than expected. Please try again.",
  rate_limited: "Too many requests. Please wait a moment and try again.",
};

export function ErrorState({ code }: { code: MediaErrorCode }) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-bad/30 bg-bad/5 px-6 py-5 text-sm text-bad"
    >
      {MESSAGES[code] ?? MESSAGES.provider_error}
    </div>
  );
}
