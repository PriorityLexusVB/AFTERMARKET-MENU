import net from "node:net";

function parseNumber(value, name) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) {
    throw new Error(`Invalid ${name}: ${value}`);
  }
  return num;
}

const host = process.argv[2] || "127.0.0.1";
const port = process.argv[3] ? parseNumber(process.argv[3], "port") : 8081;
const timeoutMs = process.argv[4] ? parseNumber(process.argv[4], "timeoutMs") : 60_000;

const startedAt = Date.now();

function tryConnectOnce() {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    const done = (ok) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(ok);
    };
    socket.once("connect", () => done(true));
    socket.once("error", () => done(false));
    socket.setTimeout(1000, () => done(false));
  });
}

async function main() {
  process.stdout.write(`Waiting for ${host}:${port} (timeout ${timeoutMs}ms)...\n`);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const ok = await tryConnectOnce();
    if (ok) {
      const elapsed = Date.now() - startedAt;
      process.stdout.write(`✓ ${host}:${port} is reachable (${elapsed}ms)\n`);
      return;
    }

    const elapsed = Date.now() - startedAt;
    if (elapsed >= timeoutMs) {
      throw new Error(`Timed out waiting for ${host}:${port} after ${elapsed}ms`);
    }

    await new Promise((r) => setTimeout(r, 250));
  }
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`❌ ${message}`);
  process.exit(1);
});
