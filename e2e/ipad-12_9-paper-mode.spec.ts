import { test, expect } from "@playwright/test";

test.describe("iPad Pro 12.9 paper mode", () => {
  test("menu enforces no-scroll + selection bar fits (13661024)", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1366, height: 1024 });

    await page.goto("/?forceIpad=1&demo=1");
    await page.waitForSelector("text=Protection Packages", { timeout: 10000 });

    const hasLockClass = await page.evaluate(() => {
      const className = "ipad-landscape-lock";
      return (
        document.body.classList.contains(className) &&
        document.documentElement.classList.contains(className)
      );
    });
    expect(hasLockClass).toBe(true);

    const selectionBar = page.locator(".am-selection-bar").first();
    await expect(selectionBar).toBeVisible({ timeout: 10000 });

    // Ensure primary CTAs remain visible in locked no-scroll mode.
    await expect(page.locator('button:has-text("Select Plan")')).toHaveCount(3);
    await expect(page.getByRole("button", { name: /finalize/i }).first()).toBeVisible({
      timeout: 10000,
    });

    const fits = await page.evaluate(() => {
      const bar = document.querySelector(".am-selection-bar") as HTMLElement | null;
      if (!bar) return { ok: false, reason: "missing-selection-bar" };

      const rect = bar.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const margin = 4;

      const ok = rect.bottom <= viewportH + margin && rect.top >= -margin;
      return { ok, viewportH, barTop: rect.top, barBottom: rect.bottom };
    });

    expect(fits, "Selection bar should fit within viewport").toMatchObject({ ok: true });

    // Ensure scrolling is effectively disabled in paper-mode.
    const scrollLocked = await page.evaluate(async () => {
      const before = window.scrollY;
      window.scrollTo(0, 1000);
      await new Promise((r) => setTimeout(r, 50));
      const after = window.scrollY;
      return before === 0 && after === 0;
    });
    expect(scrollLocked).toBe(true);

    await page.screenshot({
      path: testInfo.outputPath("ipad-12_9-paper-mode.png"),
      fullPage: false,
    });
  });
});
