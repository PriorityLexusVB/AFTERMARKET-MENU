import { test, expect } from "@playwright/test";

test.describe("Surface Pro / desktop kiosk fit", () => {
  test("menu fits Surface Pro viewport without clipping", async ({ page }, testInfo) => {
    // Surface Pro-ish landscape viewport (common kiosk size).
    await page.setViewportSize({ width: 1368, height: 912 });

    await page.goto("/");
    await page.waitForSelector("text=Protection Packages", { timeout: 10000 });

    // In kiosk/no-scroll layouts we rely on fixed-height regions.
    // Validate that the bottom selection bar remains fully visible.
    const selectionBar = page.locator(".am-selection-bar").first();
    await expect(selectionBar).toBeVisible({ timeout: 10000 });

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

    await page.screenshot({ path: testInfo.outputPath("surface-menu.png"), fullPage: false });
  });
});
