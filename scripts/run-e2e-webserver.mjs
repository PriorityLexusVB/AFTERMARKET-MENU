import { spawn } from "node:child_process";

const baseEnv = {
  ...process.env,
  VITE_FORCE_DEMO_MODE: "true",
};

const run = (command, args, { waitForExit } = { waitForExit: true }) => {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      env: baseEnv,
      shell: process.platform === "win32",
    });

    if (!waitForExit) {
      resolve(child);
      return;
    }

    child.on("exit", (code) => {
      if (code === 0) resolve(undefined);
      else reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });

    child.on("error", (error) => reject(error));
  });
};

try {
  await run("npm", ["run", "build"], { waitForExit: true });

  // Start preview and keep the process alive (Playwright will manage lifecycle).
  const preview = await run(
    "npm",
    ["run", "preview", "--", "--host", "0.0.0.0", "--port", "4173", "--strictPort"],
    { waitForExit: false }
  );

  let shuttingDown = false;

  const shutdown = () => {
    shuttingDown = true;
    try {
      preview.kill();
    } catch {
      // ignore
    }
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);

  await new Promise((resolve, reject) => {
    preview.on("exit", (code, signal) => {
      if (shuttingDown) {
        resolve(undefined);
        return;
      }

      // The preview server should remain alive for the duration of the test run.
      // If it exits for any reason (even code 0), fail fast so Playwright doesn't
      // keep running against a dead server.
      if (signal) {
        reject(new Error(`vite preview exited unexpectedly (signal: ${signal})`));
        return;
      }

      reject(new Error(`vite preview exited unexpectedly with code ${code}`));
    });
    preview.on("error", (error) => reject(error));
  });
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
