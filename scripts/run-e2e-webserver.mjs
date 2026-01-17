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
  await run(
    "npm",
    [
      "run",
      "preview",
      "--",
      "--host",
      "0.0.0.0",
      "--port",
      "4173",
      "--strictPort",
    ],
    { waitForExit: false },
  );
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
