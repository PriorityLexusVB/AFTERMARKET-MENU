import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { execSync } from "node:child_process";

// Vite automatically loads environment variables prefixed with VITE_
// from .env files and exposes them via import.meta.env
const getGitSha = () => {
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "unknown";
  }
};

const buildInfo = {
  sha: process.env["GITHUB_SHA"]?.slice(0, 7) ?? getGitSha(),
  time: new Date().toISOString(),
};

const buildInfoPlugin = () => {
  return {
    name: "aftermarket-menu:build-info",
    apply: "build" as const,
    generateBundle(this: any) {
      this.emitFile({
        type: "asset",
        fileName: "build-info.json",
        source: JSON.stringify(buildInfo, null, 2),
      });
    },
  };
};

export default defineConfig({
  plugins: [react(), buildInfoPlugin()],
  define: {
    __BUILD_INFO__: JSON.stringify(buildInfo),
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
