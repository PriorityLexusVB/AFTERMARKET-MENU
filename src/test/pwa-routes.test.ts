import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { setTimeout as delay } from 'timers/promises';

const PORT = 5099;
const BASE_URL = `http://localhost:${PORT}`;
let serverProcess: ReturnType<typeof spawn> | null = null;

const distDir = path.join(process.cwd(), 'dist');
const publicDir = path.join(process.cwd(), 'public');
const distIconsDir = path.join(distDir, 'icons');

const copyIfMissing = (src: string, dest: string) => {
  if (fs.existsSync(src) && !fs.existsSync(dest)) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
};

const waitForServer = async () => {
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`${BASE_URL}/health-check`);
      if (res.ok) return;
    } catch {
      // retry
    }
    await delay(100);
  }
  throw new Error('Server did not start in time');
};

beforeAll(async () => {
  // Ensure dist assets exist for the server to serve
  fs.mkdirSync(distDir, { recursive: true });
  copyIfMissing(path.join(publicDir, 'manifest.webmanifest'), path.join(distDir, 'manifest.webmanifest'));
  fs.mkdirSync(distIconsDir, { recursive: true });
  ['icon-192.png', 'icon-512.png', 'icon-512-maskable.png', 'apple-touch-icon.png'].forEach(icon => {
    copyIfMissing(path.join(publicDir, 'icons', icon), path.join(distIconsDir, icon));
  });

  serverProcess = spawn('node', ['index.js'], {
    env: { ...process.env, PORT: String(PORT), NODE_ENV: 'test' },
    stdio: 'inherit'
  });

  await waitForServer();
});

afterAll(async () => {
  if (serverProcess) {
    const exitPromise = new Promise(resolve => {
      serverProcess?.once('close', () => resolve(undefined));
      setTimeout(resolve, 2000);
    });
    serverProcess.kill('SIGINT');
    await exitPromise;
    serverProcess = null;
  }
});

describe('PWA asset routes', () => {
  it('serves manifest with correct headers', async () => {
    const res = await fetch(`${BASE_URL}/manifest.webmanifest`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/manifest+json');
    const cacheHeader = res.headers.get('cache-control') || '';
    expect(cacheHeader.includes('no-store') || cacheHeader.includes('max-age=300')).toBe(true);
  });

  it('serves icons with long cache headers', async () => {
    const res = await fetch(`${BASE_URL}/icons/icon-192.png`);
    expect(res.status).toBe(200);
    const cacheHeader = res.headers.get('cache-control') || '';
    expect(cacheHeader).toContain('max-age=31536000');
  });

  it('returns 404 for missing icons', async () => {
    const res = await fetch(`${BASE_URL}/icons/does-not-exist.png`);
    expect(res.status).toBe(404);
  });
});
