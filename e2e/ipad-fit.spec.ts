import { test, expect } from "@playwright/test";
import { assertScrollLocked } from "./utils/scroll-lock";

test.describe("iPad / kiosk fit", () => {
  test("menu fits iPad viewport without clipping", async ({ page }, testInfo) => {
    // Force iPad layout logic (avoids UA/platform differences under Chromium).
    await page.setViewportSize({ width: 1194, height: 834 });

    await page.goto("/?forceIpad=1&demo=1");
    await page.waitForSelector("text=Protection Packages", { timeout: 10000 });

    const hasLockClass = await page.evaluate(() =>
      document.body.classList.contains("ipad-landscape-lock")
    );
    expect(hasLockClass).toBe(true);

    // Ensure the selection bar is visible and not clipped.
    const selectionBar = page.locator(".am-selection-bar").first();
    await expect(selectionBar).toBeVisible({ timeout: 10000 });

    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth };
    });
    expect(
      overflow.scrollWidth,
      `No horizontal overflow expected (scrollWidth=${overflow.scrollWidth}, clientWidth=${overflow.clientWidth})`
    ).toBeLessThanOrEqual(overflow.clientWidth + 1);

    await page.evaluate(() => {
      window.scrollTo(0, 250);
      document.scrollingElement?.scrollTo(0, 250);
    });
    await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 2000 }).toBe(0);
    await expect
      .poll(() => page.evaluate(() => document.scrollingElement?.scrollTop ?? 0), {
        timeout: 2000,
      })
      .toBe(0);

    const openAddonsButton = page.getByRole("button", { name: /open add-ons/i });
    await expect(openAddonsButton).toBeVisible({ timeout: 10000 });
    await expect(openAddonsButton).toContainText(/add-ons/i);
    const closeAddonsButton = page.locator('button[aria-label="Close add-ons"]');
    await expect(closeAddonsButton).toHaveCount(0);

    // Ensure primary CTAs remain visible in locked no-scroll mode.
    const packageCards = page.getByTestId("package-card");
    await expect(packageCards).toHaveCount(3);
    for (let i = 0; i < (await packageCards.count()); i += 1) {
      const card = packageCards.nth(i);
      await expect(card.getByText("Investment")).toBeVisible({ timeout: 10000 });
      await expect(card.getByRole("button", { name: /select plan/i })).toBeVisible({
        timeout: 10000,
      });
    }
    await expect(page.getByRole("button", { name: /(install|finalize)/i }).first()).toBeVisible({
      timeout: 10000,
    });

    const packageGrid = page.getByTestId("package-grid");
    await expect(packageGrid).toBeVisible({ timeout: 10000 });
    const gridWidthBefore = await packageGrid.evaluate((el) =>
      Math.round(el.getBoundingClientRect().width)
    );

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

    // Confirm add-ons can be opened without hiding package CTAs.
    await openAddonsButton.click();
    await expect(closeAddonsButton).toBeVisible({ timeout: 10000 });
    const gridWidthAfter = await packageGrid.evaluate((el) =>
      Math.round(el.getBoundingClientRect().width)
    );
    expect(Math.abs(gridWidthAfter - gridWidthBefore)).toBeLessThanOrEqual(1);
    await expect(packageCards).toHaveCount(3);
    for (let i = 0; i < (await packageCards.count()); i += 1) {
      const card = packageCards.nth(i);
      await expect(card.getByText("Investment")).toBeVisible({ timeout: 10000 });
      await expect(card.getByRole("button", { name: /select plan/i })).toBeVisible({
        timeout: 10000,
      });
    }
    await expect(selectionBar).toBeVisible({ timeout: 10000 });

    // Ensure scrolling is effectively disabled in paper-mode.
    await assertScrollLocked(page);

    // Confirm internal scroll happens only inside the add-ons list (when it overflows).
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

      await assertScrollLocked(page);
    } else {
      await testInfo.attach("addons-list-note", {
        body: "Add-ons list did not overflow; scroll assertion skipped",
        contentType: "text/plain",
      });
    }

    await closeAddonsButton.click();
    await expect(closeAddonsButton).toHaveCount(0);

    const selectButton = page.locator('button:has-text("Select Plan")').first();
    await selectButton.scrollIntoViewIfNeeded();
    await selectButton.click();
    await expect(page.locator('button:has-text("Selected")')).toBeVisible();

    // Artifact screenshots for quick visual verification.
    await page.screenshot({ path: testInfo.outputPath("ipad-menu.png"), fullPage: false });
  });
});
