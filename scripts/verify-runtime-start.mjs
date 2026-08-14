#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(currentFile), "..");
const distPath = path.join(projectRoot, "dist");
const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const listFiles = (directory) =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(entryPath) : [entryPath];
  });

const fingerprintDist = () => {
  const records = listFiles(distPath)
    .sort()
    .map((file) => {
      const contents = fs.readFileSync(file);
      const fileHash = crypto.createHash("sha256").update(contents).digest("hex");
      return `${path.relative(distPath, file)}|${contents.length}|${fileHash}`;
    });

  return crypto.createHash("sha256").update(records.join("\n")).digest("hex");
};

const reservePort = () =>
  new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : null;
      if (!Number.isInteger(port) || port < 1 || port > 65535) {
        server.close(() => reject(new Error("Unable to reserve a numeric runtime-smoke port")));
        return;
      }
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });

const stopProcessTree = async (child) => {
  if (child.exitCode !== null || child.signalCode !== null) return;

  if (process.platform === "win32") {
    await new Promise((resolve) => {
      const killer = spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
        stdio: "ignore",
        windowsHide: true,
      });
      killer.once("exit", resolve);
      killer.once("error", resolve);
    });
    return;
  }

  child.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    sleep(3000).then(() => child.kill("SIGKILL")),
  ]);
};

const assertEqual = (actual, expected, label) => {
  if (actual !== expected) {
    throw new Error(
      `${label}: expected ${JSON.stringify(expected)}, observed ${JSON.stringify(actual)}`
    );
  }
};

if (!fs.existsSync(path.join(distPath, "index.html"))) {
  throw new Error("dist/index.html is required; run npm run build before the runtime smoke test");
}

const port = await reservePort();
const before = fingerprintDist();
const npmExecPath = process.env.npm_execpath;
if (!npmExecPath) throw new Error("npm_execpath is required to verify the npm start lifecycle");

const child = spawn(process.execPath, [npmExecPath, "start"], {
  cwd: projectRoot,
  env: { ...process.env, PORT: String(port), NODE_ENV: "production" },
  stdio: ["ignore", "pipe", "pipe"],
  windowsHide: true,
});

let output = "";
const capture = (chunk) => {
  output = `${output}${chunk.toString()}`.slice(-12000);
};
child.stdout.on("data", capture);
child.stderr.on("data", capture);

try {
  const baseUrl = `http://127.0.0.1:${port}`;
  let health = null;

  for (let attempt = 0; attempt < 150; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(`npm start exited before health check\n${output}`);
    }

    try {
      health = await fetch(`${baseUrl}/health-check`);
      if (health.ok) break;
    } catch {
      // Retry until the bounded deadline.
    }
    await sleep(100);
  }

  if (!health?.ok) throw new Error(`npm start did not become healthy\n${output}`);

  const [root, ping, buildInfo, debug] = await Promise.all([
    fetch(`${baseUrl}/`),
    fetch(`${baseUrl}/ping`),
    fetch(`${baseUrl}/build-info.json`),
    fetch(`${baseUrl}/__debug`),
  ]);

  assertEqual(health.status, 200, "health status");
  assertEqual(await health.text(), "ok", "health body");
  assertEqual(ping.status, 200, "ping status");
  assertEqual(await ping.text(), "pong", "ping body");
  assertEqual(root.status, 200, "root status");
  assertEqual(debug.status, 404, "debug status");
  assertEqual(buildInfo.status, 200, "build-info status");
  assertEqual(buildInfo.headers.get("cache-control"), "no-store", "build-info cache policy");
  assertEqual(root.headers.get("x-powered-by"), null, "x-powered-by header");
  assertEqual(root.headers.get("x-content-type-options"), "nosniff", "nosniff header");
  assertEqual(root.headers.get("x-frame-options"), "DENY", "frame header");
  assertEqual(
    root.headers.get("referrer-policy"),
    "strict-origin-when-cross-origin",
    "referrer policy"
  );
  assertEqual(
    root.headers.get("permissions-policy"),
    "camera=(), geolocation=(), microphone=()",
    "permissions policy"
  );

  const identity = await buildInfo.json();
  if (typeof identity.sha !== "string" || !/^[0-9a-f]{40}$/i.test(identity.sha)) {
    throw new Error("build-info SHA is missing or invalid");
  }
  if (typeof identity.time !== "string" || Number.isNaN(Date.parse(identity.time))) {
    throw new Error("build-info time is missing or invalid");
  }
} finally {
  await stopProcessTree(child);
}

const after = fingerprintDist();
assertEqual(after, before, "dist fingerprint after npm start");

console.log(`Runtime smoke PASS: dist ${before} remained unchanged`);
