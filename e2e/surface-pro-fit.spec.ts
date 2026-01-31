import { test, expect } from "@playwright/test";

test.describe("Surface Pro fit guardrails", () => {
  test("no horizontal overflow + key CTAs visible (1368×912)", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1368, height: 912 });

    await page.goto("/?demo=1");
    await page.waitForSelector("text=Protection Packages", { timeout: 10000 });

    // No horizontal overflow (allow tiny rounding tolerance).
    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return {
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
      };
    });

    expect(
      overflow.scrollWidth,
      `No horizontal overflow expected (scrollWidth=${overflow.scrollWidth}, clientWidth=${overflow.clientWidth})`
    ).toBeLessThanOrEqual(overflow.clientWidth + 2);

    const selectionBar = page.locator(".am-selection-bar").first();
    await expect(selectionBar).toBeVisible({ timeout: 10000 });

    // Selection bar should remain within the viewport.
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

    // Key CTAs visible.
    await expect(page.getByText("Investment").first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: /select plan/i }).first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByRole("button", { name: /finalize/i }).first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByRole("button", { name: /print/i }).first()).toBeVisible({
      timeout: 10000,
    });

    // Open/close add-ons and ensure selection bar remains visible.
    await page.getByRole("button", { name: /open add-ons/i }).click();
    await expect(page.getByRole("button", { name: /close add-ons/i })).toBeVisible({
      timeout: 10000,
    });
    await expect(selectionBar).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: /close add-ons/i }).click();
    await expect(selectionBar).toBeVisible({ timeout: 10000 });

    // Desktop kiosk is intended to use a no-scroll layout at this viewport.
    const scrollLocked = await page.evaluate(async () => {
      const before = window.scrollY;
      window.scrollTo(0, 1000);
      await new Promise((r) => setTimeout(r, 50));
      const after = window.scrollY;
      return before === 0 && after === 0;
    });
    expect(scrollLocked).toBe(true);

    await page.screenshot({
      path: testInfo.outputPath("surface-pro-fit.png"),
      fullPage: false,
    });
  });
});
