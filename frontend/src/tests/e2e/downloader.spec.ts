import { test, expect } from "@playwright/test";

test.describe("Downloader flow", () => {
  test("full happy path: paste, submit, select quality, download", async ({
    page,
  }) => {
    await page.goto("/");

    const input = page.getByLabel("Paste Instagram URL");
    await input.fill("https://www.instagram.com/reel/success1/");

    await page.getByRole("button", { name: "Download" }).click();

    // Loading state appears
    await expect(page.getByRole("status")).toContainText("Fetching video");

    // Result card appears
    await expect(page.getByText("Instagram Reel")).toBeVisible();

    // Quality selector shows the three mock qualities
    await expect(page.getByRole("radio", { name: /720p/ })).toBeVisible();
    await page.getByRole("radio", { name: /360p/ }).click();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /Download 360p/ }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBeTruthy();
  });

  test("shows a single quality without a selector", async ({ page }) => {
    await page.goto("/");
    await page
      .getByLabel("Paste Instagram URL")
      .fill("https://www.instagram.com/reel/single1/");
    await page.getByRole("button", { name: "Download" }).click();

    await expect(page.getByRole("button", { name: /Download 720p/ })).toBeVisible();
    await expect(page.getByRole("radiogroup")).toHaveCount(0);
  });

  test("shows a clear error for private content", async ({ page }) => {
    await page.goto("/");
    await page
      .getByLabel("Paste Instagram URL")
      .fill("https://www.instagram.com/reel/private1/");
    await page.getByRole("button", { name: "Download" }).click();

    await expect(page.getByRole("alert")).toContainText(
      "isn't publicly available",
    );
  });

  test("shows a clear error for provider failure", async ({ page }) => {
    await page.goto("/");
    await page
      .getByLabel("Paste Instagram URL")
      .fill("https://www.instagram.com/reel/randomcode/");
    await page.getByRole("button", { name: "Download" }).click();

    await expect(page.getByRole("alert")).toContainText(
      "having trouble retrieving",
    );
  });

  test("rejects an invalid URL client-side", async ({ page }) => {
    await page.goto("/");
    const input = page.getByLabel("Paste Instagram URL");
    await input.fill("not a real url");
    await expect(
      page.getByText("doesn't look like a supported Instagram URL"),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Download" })).toBeDisabled();
  });

  test("mobile viewport: downloader is usable without horizontal scroll", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });
});
