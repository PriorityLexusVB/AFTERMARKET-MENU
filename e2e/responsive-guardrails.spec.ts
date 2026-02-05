import { test, expect } from "@playwright/test";

type ViewportCase = {
  name: string;
  width: number;
  height: number;
  url: string;
  /**
   * Only enable this check when an existing test/doc already enforces a
   * no-vertical-scroll (kiosk/paper-mode) contract.
   */
  expectNoVerticalOverflow?: boolean;
};

const VIEWPORTS: ViewportCase[] = [
  // iPad Pro 12.9
  {
    name: "iPad Pro 12.9 landscape (13661024)",
    width: 1366,
    height: 1024,
    // Reuse existing e2e navigation params.
    url: "/?forceIpad=1&demo=1",
  },
  {
    name: "iPad Pro 12.9 portrait (10241366)",
    width: 1024,
    height: 1366,
    url: "/?forceIpad=1&demo=1",
  },

  // iPad Pro 11
  {
    name: "iPad Pro 11 landscape (1194834)",
    width: 1194,
    height: 834,
    url: "/?forceIpad=1&demo=1",
    // Existing spec e2e/ipad-fit.spec.ts enforces scroll lock at this viewport.
    expectNoVerticalOverflow: true,
  },
  {
    name: "iPad Pro 11 portrait (8341194)",
    width: 834,
    height: 1194,
    url: "/?forceIpad=1&demo=1",
  },

  // Surface-ish (match existing surface-fit.spec.ts)
  {
    name: "Surface-ish landscape (1368912)",
    width: 1368,
    height: 912,
    url: "/?demo=1",
  },

  // Desktop
  {
    name: "Desktop (1440900)",
    width: 1440,
    height: 900,
    url: "/?demo=1",
  },
  {
    name: "Desktop (19201080)",
    width: 1920,
    height: 1080,
    url: "/?demo=1",
  },
];

test.describe("Responsive guardrails (overflow)", () => {
  for (const viewport of VIEWPORTS) {
    test(viewport.name, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      await page.goto(viewport.url);
      await page.waitForSelector("text=Protection Packages", { timeout: 10000 });

      const metrics = await page.evaluate(() => {
        const el = document.documentElement;
        return {
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight,
        };
      });

      expect(
        metrics.scrollWidth,
        `No horizontal overflow expected (scrollWidth=${metrics.scrollWidth}, clientWidth=${metrics.clientWidth})`
      ).toBeLessThanOrEqual(metrics.clientWidth);

      if (viewport.expectNoVerticalOverflow) {
        expect(
          metrics.scrollHeight,
          `No vertical overflow expected in no-scroll mode (scrollHeight=${metrics.scrollHeight}, clientHeight=${metrics.clientHeight})`
        ).toBeLessThanOrEqual(metrics.clientHeight);
      }
    });
  }
});
