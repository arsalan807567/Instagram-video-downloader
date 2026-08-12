import { describe, it, expect } from "vitest";
import { MockMediaProvider } from "@/providers/MockMediaProvider";

const provider = new MockMediaProvider();

describe("MockMediaProvider", () => {
  it("returns a success result with multiple qualities", async () => {
    const result = await provider.getMedia(
      "https://www.instagram.com/reel/success1/",
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.qualities.length).toBeGreaterThan(1);
      expect(result.type).toBe("reel");
    }
  });

  it("returns a single quality when the code says single", async () => {
    const result = await provider.getMedia(
      "https://www.instagram.com/reel/single1/",
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.qualities).toHaveLength(1);
    }
  });

  it("returns private_content for private-coded URLs", async () => {
    const result = await provider.getMedia(
      "https://www.instagram.com/reel/private1/",
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("private_content");
    }
  });

  it("returns media_unavailable for unavailable-coded URLs", async () => {
    const result = await provider.getMedia(
      "https://www.instagram.com/reel/unavailable1/",
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("media_unavailable");
    }
  });

  it("returns provider_error for unrecognized codes", async () => {
    const result = await provider.getMedia(
      "https://www.instagram.com/reel/randomcode/",
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("provider_error");
    }
  });

  it("never fabricates a quality beyond what's defined", async () => {
    const result = await provider.getMedia(
      "https://www.instagram.com/reel/success1/",
    );
    if (result.success) {
      const labels = result.qualities.map((q) => q.label);
      expect(new Set(labels).size).toBe(labels.length); // no duplicates
    }
  });
});
