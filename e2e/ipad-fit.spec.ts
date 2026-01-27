import { test, expect } from "@playwright/test";

test.describe("iPad / kiosk fit", () => {
  test("menu fits iPad viewport without clipping", async ({ page }, testInfo) => {
    // Force iPad layout logic (avoids UA/platform differences under Chromium).
    await page.setViewportSize({ width: 1194, height: 834 });

    await page.goto("/?forceIpad=1");
    await page.waitForSelector("text=Protection Packages", { timeout: 10000 });

    const hasLockClass = await page.evaluate(() =>
      document.body.classList.contains("ipad-landscape-lock")
    );
    expect(hasLockClass).toBe(true);

    // Ensure the selection bar is visible and not clipped.
    const selectionBar = page.locator(".am-selection-bar").first();
    await expect(selectionBar).toBeVisible({ timeout: 10000 });

    const fits = await page.evaluate(() => {
      const bar = document.querySelector(".am-selection-bar") as HTMLElement | null;
      if (!bar) return { ok: false, reason: "missing-selection-bar" };

      const barRect = bar.getBoundingClientRect();
      const viewportH = window.innerHeight;

      // Allow a tiny margin for subpixel rounding.
      const margin = 4;
      const ok = barRect.bottom <= viewportH + margin && barRect.top >= -margin;

      return { ok, viewportH, barTop: barRect.top, barBottom: barRect.bottom };
    });

    expect(fits, "Selection bar should fit within viewport").toMatchObject({ ok: true });

    // Artifact screenshots for quick visual verification.
    await page.screenshot({ path: testInfo.outputPath("ipad-menu.png"), fullPage: false });
  });
});
