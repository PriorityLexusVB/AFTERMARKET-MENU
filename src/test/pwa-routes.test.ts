import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { setTimeout as delay } from "timers/promises";

const PORT = 5099;
const BASE_URL = `http://localhost:${PORT}`;
let serverProcess: ReturnType<typeof spawn> | null = null;

const distDir = path.join(process.cwd(), "dist");
const publicDir = path.join(process.cwd(), "public");
const distIconsDir = path.join(distDir, "icons");

const copyIfMissing = (src: string, dest: string) => {
  if (fs.existsSync(src) && !fs.existsSync(dest)) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
};

const waitForServer = async () => {
  for (let i = 0; i < 100; i++) {
    try {
      const res = await fetch(`${BASE_URL}/health-check`);
      if (res.ok) return;
    } catch {
      // retry
    }
    await delay(100);
  }
  throw new Error("Server did not start in time");
};

const expectSecurityHeaders = async (route: string) => {
  const res = await fetch(`${BASE_URL}${route}`);
  expect(res.headers.get("x-powered-by")).toBeNull();
  expect(res.headers.get("x-content-type-options")).toBe("nosniff");
  expect(res.headers.get("x-frame-options")).toBe("DENY");
  expect(res.headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
  expect(res.headers.get("permissions-policy")).toBe("camera=(), geolocation=(), microphone=()");
};

beforeAll(async () => {
  // Ensure dist assets exist for the server to serve in tests
  fs.mkdirSync(distDir, { recursive: true });
  copyIfMissing(
    path.join(publicDir, "manifest.webmanifest"),
    path.join(distDir, "manifest.webmanifest")
  );

  fs.mkdirSync(distIconsDir, { recursive: true });
  ["icon-192.png", "icon-512.png", "icon-512-maskable.png", "apple-touch-icon.png"].forEach(
    (icon) => {
      copyIfMissing(path.join(publicDir, "icons", icon), path.join(distIconsDir, icon));
    }
  );

  serverProcess = spawn("node", ["index.js"], {
    env: { ...process.env, PORT: String(PORT), NODE_ENV: "test" },
    stdio: "inherit",
  });

  await waitForServer();
});

afterAll(async () => {
  if (serverProcess) {
    const exitPromise = new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        console.warn("Server process did not close before timeout");
        resolve();
      }, 2000);

      serverProcess?.once("close", () => {
        clearTimeout(timer);
        resolve();
      });
    });

    serverProcess.kill("SIGINT");
    await exitPromise;
    serverProcess = null;
  }
});

describe("PWA asset routes", () => {
  it.each(["/", "/health-check", "/manifest.webmanifest"])(
    "sets baseline security headers on %s",
    async (route) => {
      await expectSecurityHeaders(route);
    }
  );

  it("keeps health and ping probes stable", async () => {
    const health = await fetch(`${BASE_URL}/health-check`);
    expect(health.status).toBe(200);
    expect(await health.text()).toBe("ok");

    const ping = await fetch(`${BASE_URL}/ping`);
    expect(ping.status).toBe(200);
    expect(await ping.text()).toBe("pong");
  });

  it("keeps the removed debug endpoint reserved as 404", async () => {
    const res = await fetch(`${BASE_URL}/__debug`);
    expect(res.status).toBe(404);
  });

  it("serves the root HTML shell", async () => {
    const res = await fetch(`${BASE_URL}/`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type") || "").toContain("text/html");
  });

  it("serves manifest with correct headers", async () => {
    const res = await fetch(`${BASE_URL}/manifest.webmanifest`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type") || "").toContain("application/manifest+json");

    // In NODE_ENV=test we expect no-store (per server logic)
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("serves icons with long cache headers", async () => {
    const res = await fetch(`${BASE_URL}/icons/icon-192.png`);
    expect(res.status).toBe(200);
    const cacheHeader = res.headers.get("cache-control") || "";
    expect(cacheHeader).toContain("max-age=31536000");
  });

  it("returns 404 for missing icons", async () => {
    const res = await fetch(`${BASE_URL}/icons/does-not-exist.png`);
    expect(res.status).toBe(404);
  });

  it("blocks traversal attempts", async () => {
    const res = await fetch(`${BASE_URL}/icons/../index.html`);
    // express.static should not allow traversal; it should not return the SPA HTML here.
    expect([404, 400]).toContain(res.status);
  });

  it("includes rate limit headers in PWA asset responses", async () => {
    const res = await fetch(`${BASE_URL}/manifest.webmanifest`);
    expect(res.status).toBe(200);

    // express-rate-limit standardHeaders returns RateLimit-* (fetch lowercases)
    expect(res.headers.has("ratelimit-limit")).toBe(true);
    expect(res.headers.has("ratelimit-remaining")).toBe(true);
    expect(res.headers.has("ratelimit-reset")).toBe(true);
  });

  it("respects rate limiting after a few requests (light check)", async () => {
    const responses: Response[] = [];
    for (let i = 0; i < 5; i++) {
      const res = await fetch(`${BASE_URL}/icons/icon-192.png`);
      responses.push(res);
    }

    for (const res of responses) {
      expect(res.status).toBe(200);
      expect(res.headers.has("ratelimit-remaining")).toBe(true);
    }

    const firstRemaining = parseInt(responses[0]?.headers.get("ratelimit-remaining") || "100", 10);
    const lastRemaining = parseInt(
      responses[responses.length - 1]?.headers.get("ratelimit-remaining") || "100",
      10
    );
    expect(lastRemaining).toBeLessThan(firstRemaining);
  });
});
