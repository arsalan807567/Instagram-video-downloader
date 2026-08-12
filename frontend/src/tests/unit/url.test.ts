import { describe, it, expect } from "vitest";
import { validateInstagramUrl } from "@/lib/validation/url";

describe("validateInstagramUrl", () => {
  it("accepts a valid reel URL", () => {
    const result = validateInstagramUrl(
      "https://www.instagram.com/reel/ABC123/",
    );
    expect(result.valid).toBe(true);
    expect(result.normalizedUrl).toBe(
      "https://www.instagram.com/reel/ABC123/",
    );
  });

  it("accepts a valid post URL without www", () => {
    const result = validateInstagramUrl("https://instagram.com/p/XYZ789");
    expect(result.valid).toBe(true);
  });

  it("strips query params during normalization", () => {
    const result = validateInstagramUrl(
      "https://www.instagram.com/reel/ABC123/?utm_source=ig_web",
    );
    expect(result.normalizedUrl).toBe(
      "https://www.instagram.com/reel/ABC123/",
    );
  });

  it("rejects non-instagram hostnames", () => {
    const result = validateInstagramUrl(
      "https://instagram.com.evil.example/reel/ABC123/",
    );
    expect(result.valid).toBe(false);
    expect(result.error).toBe("unsupported_host");
  });

  it("rejects a hostname that merely contains instagram.com", () => {
    const result = validateInstagramUrl(
      "https://notinstagram.com/reel/ABC123/",
    );
    expect(result.valid).toBe(false);
  });

  it("rejects non-https protocols", () => {
    const result = validateInstagramUrl("http://instagram.com/reel/ABC123/");
    expect(result.valid).toBe(false);
  });

  it("rejects javascript: protocol", () => {
    const result = validateInstagramUrl("javascript:alert(1)");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("invalid_format");
  });

  it("rejects malformed URLs", () => {
    const result = validateInstagramUrl("not a url");
    expect(result.valid).toBe(false);
  });

  it("rejects unsupported paths", () => {
    const result = validateInstagramUrl("https://instagram.com/some/other/path");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("unsupported_path");
  });

  it("rejects private-looking profile URLs", () => {
    const result = validateInstagramUrl("https://instagram.com/someusername/");
    expect(result.valid).toBe(false);
  });

  it("rejects excessively long input", () => {
    const longUrl = "https://instagram.com/reel/" + "a".repeat(600);
    const result = validateInstagramUrl(longUrl);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("too_long");
  });

  it("rejects empty input", () => {
    const result = validateInstagramUrl("");
    expect(result.valid).toBe(false);
  });
});
