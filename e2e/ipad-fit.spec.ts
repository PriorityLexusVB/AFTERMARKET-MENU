import { test, expect } from "@playwright/test";

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

    const openAddonsButton = page.getByRole("button", { name: /open add-ons/i });
    await expect(openAddonsButton).toBeVisible({ timeout: 10000 });
    await expect(openAddonsButton).toContainText(/add-ons/i);
    await expect(page.getByRole("button", { name: /close add-ons/i })).toHaveCount(0);

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
    await expect(page.getByRole("button", { name: /finalize/i }).first()).toBeVisible({
      timeout: 10000,
    });

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
    await expect(page.getByRole("button", { name: /close add-ons/i })).toBeVisible({
      timeout: 10000,
    });
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
    const scrollLocked = await page.evaluate(async () => {
      const before = window.scrollY;
      window.scrollTo(0, 1000);
      await new Promise((r) => setTimeout(r, 50));
      const after = window.scrollY;
      return before === 0 && after === 0;
    });
    expect(scrollLocked).toBe(true);

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

      const windowStillLocked = await page.evaluate(async () => {
        const before = window.scrollY;
        await new Promise((r) => setTimeout(r, 50));
        const after = window.scrollY;
        return before === 0 && after === 0;
      });
      expect(windowStillLocked).toBe(true);
    } else {
      await testInfo.attach("addons-list-note", {
        body: "Add-Ons list did not overflow; scroll assertion skipped",
        contentType: "text/plain",
      });
    }

    // Artifact screenshots for quick visual verification.
    await page.screenshot({ path: testInfo.outputPath("ipad-menu.png"), fullPage: false });
  });
});
