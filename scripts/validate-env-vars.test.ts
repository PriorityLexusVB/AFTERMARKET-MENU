import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { validateEnvVarNames, validateRequiredVars } from "./validate-env-vars.js";

const requiredFirebaseEnv = {
  VITE_FIREBASE_API_KEY: "test-api-key",
  VITE_FIREBASE_AUTH_DOMAIN: "test.firebaseapp.com",
  VITE_FIREBASE_PROJECT_ID: "test-project",
  VITE_FIREBASE_STORAGE_BUCKET: "test.firebasestorage.app",
  VITE_FIREBASE_MESSAGING_SENDER_ID: "123456789",
  VITE_FIREBASE_APP_ID: "1:123456789:web:test",
};

const cloneEnv = () => ({ ...process.env });
const validatorPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "validate-env-vars.js"
);

const runProductionValidator = (firebaseEnv: NodeJS.ProcessEnv) => {
  const env = { ...process.env };

  for (const key of Object.keys(requiredFirebaseEnv)) {
    delete env[key];
  }

  return spawnSync(process.execPath, [validatorPath, "--require-firebase"], {
    env: { ...env, ...firebaseEnv },
    encoding: "utf8",
  });
};

describe("validate-env-vars normalization", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = cloneEnv();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("normalizes whitespace-padded keys", () => {
    // Use a minimal env so ambient runner env vars can't affect collisions.
    process.env = { " VITE_FIREBASE_PROJECT_ID": "whitespace-value" };

    const result = validateEnvVarNames();

    expect(result).toBe(true);
    expect(process.env["VITE_FIREBASE_PROJECT_ID"]).toBe("whitespace-value");
    expect(process.env[" VITE_FIREBASE_PROJECT_ID"]).toBeUndefined();
  });

  it("treats collisions as failures and preserves existing trimmed value", () => {
    process.env = {
      VITE_FIREBASE_PROJECT_ID: "existing",
      " VITE_FIREBASE_PROJECT_ID": "newer",
    };

    const result = validateEnvVarNames();

    expect(result).toBe(false);
    expect(process.env["VITE_FIREBASE_PROJECT_ID"]).toBe("existing");
    expect(process.env[" VITE_FIREBASE_PROJECT_ID"]).toBeDefined();
  });

  it("fails when multiple whitespace keys normalize to the same name", () => {
    process.env = {
      " VITE_FIREBASE_PROJECT_ID": "first",
      "\tVITE_FIREBASE_PROJECT_ID ": "second",
    };

    const result = validateEnvVarNames();

    expect(result).toBe(false);
    expect(process.env["VITE_FIREBASE_PROJECT_ID"]).toBe("first");
    expect(process.env[" VITE_FIREBASE_PROJECT_ID"]).toBeUndefined();
    expect(process.env["\tVITE_FIREBASE_PROJECT_ID "]).toBeDefined();
  });

  it("ignores whitespace-only keys without creating empty entries", () => {
    process.env = { "   ": "value" };

    const result = validateEnvVarNames();

    expect(result).toBe(true);
    expect(process.env[""]).toBeUndefined();
    expect(process.env["   "]).toBe("value");
  });
});

describe("validate-env-vars production Firebase gate", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = cloneEnv();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("allows missing Firebase variables for ordinary demo-capable builds", () => {
    process.env = {};

    expect(validateRequiredVars()).toBe(true);
  });

  it("blocks the GCP production build when any Firebase variable is missing", () => {
    process.env = { ...requiredFirebaseEnv };
    delete process.env["VITE_FIREBASE_APP_ID"];

    expect(validateRequiredVars({ requireAll: true })).toBe(false);
  });

  it("allows the GCP production build when all Firebase variables are present", () => {
    process.env = { ...requiredFirebaseEnv };

    expect(validateRequiredVars({ requireAll: true })).toBe(true);
  });

  it("blocks a blank Firebase variable", () => {
    process.env = { ...requiredFirebaseEnv, VITE_FIREBASE_APP_ID: "   " };

    expect(validateRequiredVars({ requireAll: true })).toBe(false);
  });
});

describe("validate-env-vars production CLI", () => {
  it("exits nonzero when all Firebase variables are missing", () => {
    const result = runProductionValidator({});

    expect(result.status).toBe(1);
  });

  it("exits nonzero when a Firebase variable is blank", () => {
    const result = runProductionValidator({
      ...requiredFirebaseEnv,
      VITE_FIREBASE_APP_ID: "   ",
    });

    expect(result.status).toBe(1);
  });

  it("exits zero when all six exact Firebase variables are present", () => {
    const result = runProductionValidator(requiredFirebaseEnv);

    expect(result.status).toBe(0);
  });

  it("exits nonzero for a whitespace-padded Firebase variable name", () => {
    const { VITE_FIREBASE_APP_ID: appId, ...fiveExactVariables } =
      requiredFirebaseEnv;
    const result = runProductionValidator({
      ...fiveExactVariables,
      " VITE_FIREBASE_APP_ID": appId,
    });

    expect(result.status).toBe(1);
    expect(`${result.stdout}\n${result.stderr}`).toContain(
      "Malformed Firebase variable name is not allowed"
    );
  });
});
