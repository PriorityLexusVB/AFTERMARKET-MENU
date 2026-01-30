import { test, expect, type Page } from "@playwright/test";

async function openPresentation(page: Page, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport);

  await page.goto("/?demo=1");
  await page.waitForSelector("text=Protection Packages", { timeout: 10000 });

  const showButton = page.locator('button[aria-label="Show presentation"]');
  if (await showButton.count()) {
    await showButton.first().click();
  } else {
    await page
      .getByRole("button", { name: /presentation/i })
      .first()
      .click();
  }

  await expect(page.locator("#rs1")).toBeVisible({ timeout: 10000 });
}

async function expectSlideFitsViewport(
  page: Page,
  slideId: string,
  screenshotName: string,
  options?: { requiredText?: string[]; requiredButtonName?: RegExp; expectBullets?: boolean }
) {
  const slide = page.locator(`#${slideId}`);
  await slide.scrollIntoViewIfNeeded();
  await expect(slide).toBeVisible({ timeout: 10000 });

  // Wait for the slide to become the active slide (content fades in via opacity classes).
  const fadingContent = page
    .locator(`#${slideId} div[class*="transition-all"][class*="opacity-"]`)
    .first();
  if (await fadingContent.count()) {
    await expect(fadingContent).toHaveClass(/\bopacity-100\b/, { timeout: 10000 });
  }

  if (options?.requiredText) {
    for (const text of options.requiredText) {
      await expect(slide.getByText(text, { exact: false }).first()).toBeVisible({ timeout: 10000 });
    }
  }

  if (options?.requiredButtonName) {
    await expect(slide.getByRole("button", { name: options.requiredButtonName })).toBeVisible({
      timeout: 10000,
    });
  }

  if (options?.expectBullets) {
    const bulletDots = page.locator(
      `#${slideId} .bg-blue-600.rounded-full, #${slideId} [class*="bg-blue-600"] [class*="rounded-full"]`
    );
    await expect(bulletDots.first()).toBeVisible({ timeout: 10000 });
  }

  const fits = await page.evaluate((id) => {
    const el = document.getElementById(id);
    if (!el) return { ok: false, reason: "missing" };

    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    const slideRect = el.getBoundingClientRect();

    const content = el.querySelector(":scope > div") as HTMLElement | null;
    if (!content) return { ok: false, reason: "missing-content" };

    const contentRect = content.getBoundingClientRect();

    const margin = 6;
    const ok =
      contentRect.top >= slideRect.top - margin &&
      contentRect.bottom <= slideRect.bottom + margin &&
      contentRect.left >= slideRect.left - margin &&
      contentRect.right <= slideRect.right + margin &&
      slideRect.height <= viewportH + margin &&
      slideRect.width <= viewportW + margin;

    return {
      ok,
      viewportW,
      viewportH,
      slideW: slideRect.width,
      slideH: slideRect.height,
      contentLeft: contentRect.left,
      contentRight: contentRect.right,
      contentTop: contentRect.top,
      contentBottom: contentRect.bottom,
      slideLeft: slideRect.left,
      slideRight: slideRect.right,
      slideTop: slideRect.top,
      slideBottom: slideRect.bottom,
    };
  }, slideId);

  expect(fits, `Slide ${slideId} content should fit in viewport`).toMatchObject({ ok: true });

  await slide.screenshot({ path: screenshotName });
}

test.describe("Presentation Fit Matrix", () => {
  const viewports = [
    { name: "iPad Pro 12.9 landscape", width: 1366, height: 1024 },
    { name: "Surface-ish landscape", width: 1368, height: 912 },
  ];

  for (const viewport of viewports) {
    test(`${viewport.name}: key slides fit without clipping`, async ({ page }, testInfo) => {
      await openPresentation(page, { width: viewport.width, height: viewport.height });

      // Global sanity: no unexpected horizontal overflow.
      const horizontalOverflowPx = await page.evaluate(() =>
        Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)
      );
      expect(horizontalOverflowPx).toBeLessThanOrEqual(2);

      const tag = viewport.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

      await expectSlideFitsViewport(page, "rs1", testInfo.outputPath(`presentation-${tag}-rs1.png`));

      await expectSlideFitsViewport(page, "rs4", testInfo.outputPath(`presentation-${tag}-rs4.png`), {
        requiredText: ["Most Damage Isn't Mechanical"],
        expectBullets: true,
      });

      await expectSlideFitsViewport(page, "rs6", testInfo.outputPath(`presentation-${tag}-rs6.png`), {
        requiredText: ["RustGuard"],
        expectBullets: true,
      });

      await expectSlideFitsViewport(page, "rs12", testInfo.outputPath(`presentation-${tag}-rs12.png`), {
        requiredButtonName: /review/i,
      });
    });
  }
});
