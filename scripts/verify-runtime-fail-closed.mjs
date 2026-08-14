#!/usr/bin/env node

import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(currentFile), "..");
const missingDist = path.join(os.tmpdir(), `aftermarket-missing-dist-${process.pid}-${Date.now()}`);

if (fs.existsSync(missingDist)) throw new Error("Fail-closed test path must not exist");

const port = await new Promise((resolve, reject) => {
  const server = net.createServer();
  server.once("error", reject);
  server.listen(0, "127.0.0.1", () => {
    const address = server.address();
    const reservedPort = typeof address === "object" && address ? address.port : null;
    if (!Number.isInteger(reservedPort) || reservedPort < 1 || reservedPort > 65535) {
      server.close(() => reject(new Error("Unable to reserve a numeric fail-closed test port")));
      return;
    }
    server.close((error) => (error ? reject(error) : resolve(reservedPort)));
  });
});

const child = spawn(process.execPath, [path.join(projectRoot, "index.js")], {
  cwd: projectRoot,
  env: {
    ...process.env,
    NODE_ENV: "production",
    PORT: String(port),
    RUNTIME_CONTRACT_TEST: "1",
    RUNTIME_CONTRACT_TEST_DIST_DIR: missingDist,
  },
  stdio: ["ignore", "pipe", "pipe"],
  windowsHide: true,
});

let output = "";
const capture = (chunk) => {
  output = `${output}${chunk.toString()}`.slice(-12000);
};
child.stdout.on("data", capture);
child.stderr.on("data", capture);

const exitCode = await new Promise((resolve, reject) => {
  const timeout = setTimeout(() => {
    if (child.exitCode === null) child.kill("SIGKILL");
    reject(new Error("Production server did not fail within 10 seconds"));
  }, 10000);

  child.once("exit", (code) => {
    clearTimeout(timeout);
    resolve(code);
  });
  child.once("error", (error) => {
    clearTimeout(timeout);
    reject(error);
  });
});

if (exitCode !== 1) {
  if (child.exitCode === null) child.kill("SIGKILL");
  throw new Error(`Expected production startup exit 1, observed ${exitCode}\n${output}`);
}

if (!output.includes("Validated production build artifacts are required")) {
  throw new Error(`Expected fail-closed artifact error was not logged\n${output}`);
}

console.log("Runtime fail-closed PASS: missing artifacts exited before listening");
