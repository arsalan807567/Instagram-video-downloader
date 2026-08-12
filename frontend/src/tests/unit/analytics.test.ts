import { describe, it, expect, beforeEach, vi } from "vitest";
import { track } from "@/lib/analytics/track";

describe("track", () => {
  beforeEach(() => {
    window.gtag = vi.fn();
  });

  it("only forwards allow-listed param keys", () => {
    track("download_success", {
      content_type: "reel",
      download_quality: "720p",
      // @ts-expect-error - deliberately testing a disallowed key
      raw_url: "https://instagram.com/reel/secret123",
    });

    expect(window.gtag).toHaveBeenCalledWith(
      "event",
      "download_success",
      expect.objectContaining({ content_type: "reel", download_quality: "720p" }),
    );
    const callArgs = (window.gtag as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(callArgs[2]).not.toHaveProperty("raw_url");
  });

  it("no-ops when gtag is not present", () => {
    window.gtag = undefined;
    expect(() => track("page_view")).not.toThrow();
  });
});
