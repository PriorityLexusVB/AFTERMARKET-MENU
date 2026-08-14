import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { validateRuntimeArtifacts } from "./artifact-contract.js";

const SHA = "654470fae2b659e8d50e454bb887513c1d6ee84f";
const tempDirectories = new Set<string>();

const makeDist = () => {
  const distDir = fs.mkdtempSync(path.join(os.tmpdir(), "aftermarket-artifact-contract-"));
  tempDirectories.add(distDir);
  fs.mkdirSync(path.join(distDir, "assets"));
  fs.writeFileSync(
    path.join(distDir, "index.html"),
    '<link rel="stylesheet" href="/assets/app.css"><script src="/assets/app.js"></script>'
  );
  fs.writeFileSync(path.join(distDir, "assets", "app.css"), "body{}\n");
  fs.writeFileSync(path.join(distDir, "assets", "app.js"), "export {};\n");
  fs.writeFileSync(
    path.join(distDir, "build-info.json"),
    JSON.stringify({ sha: SHA, time: "2026-08-14T05:00:00.000Z" })
  );
  return distDir;
};

afterEach(() => {
  vi.restoreAllMocks();
  for (const directory of tempDirectories) fs.rmSync(directory, { recursive: true, force: true });
  tempDirectories.clear();
});

describe("runtime artifact contract", () => {
  it("accepts a complete immutable build", () => {
    expect(validateRuntimeArtifacts(makeDist())).toEqual([]);
  });

  it("rejects an absent dist directory", () => {
    const missing = path.join(os.tmpdir(), `aftermarket-missing-${Date.now()}`);
    expect(validateRuntimeArtifacts(missing)).toContain("dist directory is missing");
  });

  it("returns a controlled error for an unreadable or broken dist mount", () => {
    const accessError = Object.assign(new Error("access denied"), { code: "EACCES" });
    vi.spyOn(fs, "statSync").mockImplementationOnce(() => {
      throw accessError;
    });

    expect(validateRuntimeArtifacts("inaccessible-dist")).toEqual(["dist directory is unreadable"]);
  });

  it("rejects missing referenced assets", () => {
    const distDir = makeDist();
    fs.rmSync(path.join(distDir, "assets", "app.js"));
    expect(validateRuntimeArtifacts(distDir)).toContain(
      "referenced asset is missing: assets/app.js"
    );
  });

  it("rejects incomplete or expanded public build identity", () => {
    const distDir = makeDist();
    fs.writeFileSync(
      path.join(distDir, "build-info.json"),
      JSON.stringify({ sha: "deadbee", time: "not-iso", files: ["secret"] })
    );
    expect(validateRuntimeArtifacts(distDir)).toEqual(
      expect.arrayContaining([
        "dist/build-info.json must contain only sha and time",
        "dist/build-info.json SHA is invalid",
        "dist/build-info.json time is invalid",
      ])
    );
  });
});
