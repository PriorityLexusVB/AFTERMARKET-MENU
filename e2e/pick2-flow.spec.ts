import { test, expect } from "@playwright/test";

const parseUsd = (raw: string): number => {
  const cleaned = raw.replace(/[^0-9.]/g, "");
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) throw new Error(`Failed to parse USD from: ${raw}`);
  return parsed;
};

const getSelectionTotal = async (page: import("@playwright/test").Page) => {
  const bar = page.getByTestId("selection-drawer-bar");
  await expect(bar).toBeVisible({ timeout: 10000 });

  const totalBox = bar.getByText("Total", { exact: true }).locator("..");
  const raw = await totalBox.locator("p").filter({ hasText: /\$/ }).first().innerText();
  return parseUsd(raw);
};

const getPick2BundlePrice = async (page: import("@playwright/test").Page) => {
  // Pick2Selector renders: "Bundle price: $X".
  const line = page.locator("text=Bundle price:").first();
  await expect(line).toBeVisible({ timeout: 10000 });
  const raw = await line.innerText();
  return parseUsd(raw);
};

test.describe("Pick2 flow", () => {
  test("demo: Pick2 tab visible, select 2, third blocked, swap works, bundle priced once", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1368, height: 912 });

    await page.goto("/?demo=1");
    await page.waitForSelector("text=Protection Packages", { timeout: 10000 });

    const pick2Tab = page.getByRole("button", { name: /you pick 2/i });
    await expect(pick2Tab).toBeVisible({ timeout: 10000 });
    await pick2Tab.click();

    await page.waitForSelector("text=Bundle price:", { timeout: 10000 });

    const bundlePrice = await getPick2BundlePrice(page);

    const totalBefore = await getSelectionTotal(page);

    const list = page.getByTestId("pick2-list");
    await expect(list).toBeVisible({ timeout: 10000 });

    // Use stable aria labels emitted by Pick2Selector/AddOnItem.
    const selectButtons = list.getByRole("button", { name: /Select .* for Pick 2/i });
    expect(await selectButtons.count()).toBeGreaterThan(2);

    // Select first item: bundle not complete -> total unchanged.
    await selectButtons.nth(0).click();
    await expect(page.getByRole("status")).toHaveCount(0);
    const totalAfter1 = await getSelectionTotal(page);
    expect(totalAfter1).toBe(totalBefore);

    // Select second item: bundle completes -> total increases by bundle price once.
    await selectButtons.nth(1).click();
    await expect(page.getByLabel(/Pick 2 progress/i)).toContainText("✓");

    const totalAfter2 = await getSelectionTotal(page);
    expect(totalAfter2 - totalBefore).toBe(bundlePrice);

    // Attempt third selection: blocked.
    const extraSelect = list.getByRole("button", { name: /Select .* for Pick 2/i }).first();
    const extraSelectLabel = await extraSelect.getAttribute("aria-label");
    await extraSelect.scrollIntoViewIfNeeded();
    await extraSelect.click();
    await expect(page.getByRole("status")).toContainText(
      "You’ve selected 2 — remove one to swap.",
      { timeout: 2000 }
    );
    const totalAfterBlocked = await getSelectionTotal(page);
    expect(totalAfterBlocked).toBe(totalAfter2);

    // Swap: remove one, then select a different item.
    await list.getByRole("button", { name: /Remove .* from Pick 2/i }).first().click();
    await expect(page.getByRole("status")).toHaveCount(0);

    if (extraSelectLabel) {
      await list.getByRole("button", { name: extraSelectLabel }).click();
    } else {
      await list.getByRole("button", { name: /Select .* for Pick 2/i }).first().click();
    }
    await expect(page.getByLabel(/Pick 2 progress/i)).toContainText("✓");

    const totalAfterSwap = await getSelectionTotal(page);
    expect(totalAfterSwap).toBe(totalAfter2);
  });

  test("iPad paper mode: window scroll locked; Pick2 list can scroll internally", async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 1194, height: 834 });

    await page.goto("/?forceIpad=1&demo=1");
    await page.waitForSelector("text=Protection Packages", { timeout: 10000 });

    await page.getByRole("button", { name: /you pick 2/i }).click();
    await page.waitForSelector("text=Bundle price:", { timeout: 10000 });

    const scrollLocked = await page.evaluate(async () => {
      const before = window.scrollY;
      window.scrollTo(0, 1000);
      await new Promise((r) => setTimeout(r, 50));
      const after = window.scrollY;
      return before === 0 && after === 0;
    });
    expect(scrollLocked).toBe(true);

    const list = page.getByTestId("pick2-list");
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
      await testInfo.attach("pick2-list-note", {
        body: "Pick2 list did not overflow; scroll assertion skipped",
        contentType: "text/plain",
      });
    }
  });

  test("Surface-ish: no horizontal overflow; CTAs visible", async ({ page }) => {
    await page.setViewportSize({ width: 1368, height: 912 });

    await page.goto("/?demo=1");
    await page.waitForSelector("text=Protection Packages", { timeout: 10000 });

    await page.getByRole("button", { name: /you pick 2/i }).click();
    await page.waitForSelector("text=Bundle price:", { timeout: 10000 });

    const metrics = await page.evaluate(() => {
      const el = document.documentElement;
      return { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth };
    });

    expect(
      metrics.scrollWidth,
      `No horizontal overflow expected (scrollWidth=${metrics.scrollWidth}, clientWidth=${metrics.clientWidth})`
    ).toBeLessThanOrEqual(metrics.clientWidth);

    await expect(page.getByTestId("selection-drawer-bar")).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: /finalize/i }).first()).toBeVisible({
      timeout: 10000,
    });

    const list = page.getByTestId("pick2-list");
    await expect(list.getByRole("button", { name: /Select .* for Pick 2/i }).first()).toBeVisible({
      timeout: 10000,
    });
  });
});
