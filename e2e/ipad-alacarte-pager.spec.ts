import { test, expect } from "@playwright/test";

function parsePageFraction(text: string): { page: number; total: number } | null {
  const trimmed = text.trim();
  const match = trimmed.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (!match) return null;
  return { page: Number(match[1]), total: Number(match[2]) };
}

test.describe("iPad paper mode A La Carte pager", () => {
  test("shows Page X / Y + Prev/Next and does not scroll", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1366, height: 1024 });

    await page.goto("/?forceIpad=1&demo=1");
    await page.waitForSelector("text=Protection Packages", { timeout: 10000 });

    // Navigate to A La Carte.
    await page.getByRole("button", { name: /^A La Carte Options$/ }).click();
    const heading = page.getByRole("heading", { name: "Available Add-Ons" });
    await expect(heading).toBeVisible({ timeout: 10000 });

    // Pager UI: exact pattern from AlaCarteSelector.tsx is a "Page" label + a "{safePage} / {totalPages}" badge.
    const headerRegion = heading.locator("..");
    await expect(headerRegion.getByText(/^Page$/)).toBeVisible({ timeout: 10000 });

    const fractionSpan = headerRegion
      .locator("span")
      .filter({ hasText: /^\s*\d+\s*\/\s*\d+\s*$/ })
      .first();
    await expect(fractionSpan).toBeVisible({ timeout: 10000 });

    const fractionBeforeText = (await fractionSpan.innerText()).trim();
    const fractionBefore = parsePageFraction(fractionBeforeText);
    expect(fractionBefore, `Expected a page fraction like "1 / 2", got: ${fractionBeforeText}`).not.toBeNull();

    // Prev/Next controls: use exact accessible names from aria-label.
    const prevButton = page.getByRole("button", { name: "Previous add-ons page" });
    const nextButton = page.getByRole("button", { name: "Next add-ons page" });
    await expect(prevButton).toBeVisible({ timeout: 10000 });
    await expect(nextButton).toBeVisible({ timeout: 10000 });

    // Ensure page-level scrolling is disabled in paper-mode.
    const scrollLocked = await page.evaluate(async () => {
      const before = window.scrollY;
      window.scrollTo(0, 1000);
      await new Promise((r) => setTimeout(r, 50));
      const after = window.scrollY;
      return before === 0 && after === 0;
    });
    expect(scrollLocked).toBe(true);

    // If there are multiple pages in demo mode, Next should advance the page number.
    if (fractionBefore && fractionBefore.total > 1) {
      await expect(nextButton).toBeEnabled();
      await nextButton.click();

      await expect
        .poll(async () => {
          const t = (await fractionSpan.innerText()).trim();
          return parsePageFraction(t);
        })
        .toMatchObject({ page: 2, total: fractionBefore.total });

      await expect(prevButton).toBeEnabled();
    } else {
      // Single-page case: buttons should reflect disabled state.
      await expect(prevButton).toBeDisabled();
      await expect(nextButton).toBeDisabled();
    }

    await page.screenshot({
      path: testInfo.outputPath("ipad-alacarte-pager.png"),
      fullPage: false,
    });
  });
});
