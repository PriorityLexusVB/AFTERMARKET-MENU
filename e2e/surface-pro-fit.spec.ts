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
    const packageCards = page.getByTestId("package-card");
    await expect(packageCards).toHaveCount(3);
    for (let i = 0; i < (await packageCards.count()); i += 1) {
      const card = packageCards.nth(i);
      await expect(card.getByText("Investment")).toBeVisible({ timeout: 10000 });
      await expect(card.getByRole("button", { name: /select plan/i })).toBeVisible({
        timeout: 10000,
      });
    }
    await expect(page.getByRole("button", { name: /finalize/i }).first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByRole("button", { name: /print/i }).first()).toBeVisible({
      timeout: 10000,
    });

    // Open/close add-ons and ensure selection bar remains visible.
    await page.getByRole("button", { name: /open add-ons/i }).click();
    const closeAddonsButton = page.locator('button[aria-label="Close add-ons"]');
    await expect(closeAddonsButton).toBeVisible({ timeout: 10000 });
    await expect(selectionBar).toBeVisible({ timeout: 10000 });

    const list = page.getByTestId("addons-drawer-list");
    await expect(list).toBeVisible({ timeout: 10000 });

    const dims = await list.evaluate((el) => ({
      sh: el.scrollHeight,
      ch: el.clientHeight,
      top: el.scrollTop,
    }));

    if (dims.sh > dims.ch + 2) {
      await list.evaluate((el) => {
        el.scrollTop = 250;
      });
      await expect
        .poll(() => list.evaluate((el) => el.scrollTop), { timeout: 2000 })
        .toBeGreaterThan(0);

      const windowStillLocked = await page.evaluate(async () => {
        const beforeWindow = window.scrollY;
        const beforeDoc = document.scrollingElement?.scrollTop ?? 0;
        await new Promise((r) => setTimeout(r, 50));
        const afterWindow = window.scrollY;
        const afterDoc = document.scrollingElement?.scrollTop ?? 0;
        return beforeWindow === 0 && afterWindow === 0 && beforeDoc === 0 && afterDoc === 0;
      });
      expect(windowStillLocked).toBe(true);
    } else {
      await testInfo.attach("addons-list-note", {
        body: "Add-Ons list did not overflow; scroll assertion skipped",
        contentType: "text/plain",
      });
    }
    await expect(selectionBar).toBeVisible({ timeout: 10000 });
    await closeAddonsButton.click();
    await expect(selectionBar).toBeVisible({ timeout: 10000 });

    // Desktop kiosk is intended to use a no-scroll layout at this viewport.
    const scrollLocked = await page.evaluate(async () => {
      const beforeWindow = window.scrollY;
      const beforeDoc = document.scrollingElement?.scrollTop ?? 0;
      window.scrollTo(0, 1000);
      await new Promise((r) => setTimeout(r, 50));
      const afterWindow = window.scrollY;
      const afterDoc = document.scrollingElement?.scrollTop ?? 0;
      return beforeWindow === 0 && afterWindow === 0 && beforeDoc === 0 && afterDoc === 0;
    });
    expect(scrollLocked).toBe(true);

    await page.screenshot({
      path: testInfo.outputPath("surface-pro-fit.png"),
      fullPage: false,
    });
  });
});
