#!/usr/bin/env node
/**
 * Build Validation Script
 *
 * This script validates that the Vite build completed successfully and
 * that all necessary artifacts are present for deployment.
 *
 * Usage: node scripts/validate-build.js
 *
 * Exit codes:
 *   0 - Build is valid
 *   1 - Build validation failed
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

// ANSI color codes for output
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(` ${message}`, "green");
}

function logError(message) {
  log(` ${message}`, "red");
}

function logWarning(message) {
  log(` ${message}`, "yellow");
}

function logInfo(message) {
  log(` ${message}`, "blue");
}

/**
 * Validates that the dist directory exists and contains necessary files
 */
function validateDistDirectory() {
  const distPath = path.join(projectRoot, "dist");

  logInfo("Validating dist directory...");

  if (!fs.existsSync(distPath)) {
    logError("dist directory does not exist");
    return false;
  }

  logSuccess("dist directory exists");

  // Check for index.html
  const indexPath = path.join(distPath, "index.html");
  if (!fs.existsSync(indexPath)) {
    logError("dist/index.html not found");
    return false;
  }
  logSuccess("dist/index.html found");

  // Check for assets directory
  const assetsPath = path.join(distPath, "assets");
  if (!fs.existsSync(assetsPath)) {
    logError("dist/assets directory not found");
    return false;
  }
  logSuccess("dist/assets directory found");

  // Check for JavaScript bundle
  const files = fs.readdirSync(assetsPath);
  const jsFiles = files.filter((f) => f.endsWith(".js"));
  const cssFiles = files.filter((f) => f.endsWith(".css"));

  if (jsFiles.length === 0) {
    logError("No JavaScript bundles found in dist/assets");
    return false;
  }
  logSuccess(`Found ${jsFiles.length} JavaScript bundle(s)`);

  if (cssFiles.length === 0) {
    logWarning("No CSS files found in dist/assets");
  } else {
    logSuccess(`Found ${cssFiles.length} CSS file(s)`);
  }

  return true;
}

function listFilesRecursive(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFilesRecursive(entryPath) : [entryPath];
  });
}

/**
 * Ensures production artifacts do not publish source maps or source-map references.
 */
function validateNoPublicSourceMaps() {
  const distPath = path.join(projectRoot, "dist");

  logInfo("Validating source-map policy...");

  try {
    const files = listFilesRecursive(distPath);
    const mapFiles = files.filter((file) => file.endsWith(".map"));
    const mapReferences = files.filter((file) => {
      if (!file.endsWith(".js") && !file.endsWith(".css")) return false;
      return fs.readFileSync(file, "utf8").includes("sourceMappingURL=");
    });

    if (mapFiles.length > 0 || mapReferences.length > 0) {
      for (const file of [...mapFiles, ...mapReferences]) {
        logError(`Public source-map artifact/reference: ${path.relative(distPath, file)}`);
      }
      return false;
    }

    logSuccess("No public source maps or source-map references found");
    return true;
  } catch (error) {
    logError(`Error validating source-map policy: ${error.message}`);
    return false;
  }
}

/**
 * Requires a usable SHA/time release identity in every deployable build.
 */
function validateBuildInfo() {
  const buildInfoPath = path.join(projectRoot, "dist", "build-info.json");

  logInfo("Validating build identity...");

  try {
    if (!fs.existsSync(buildInfoPath)) {
      logError("dist/build-info.json not found");
      return false;
    }

    const buildInfo = JSON.parse(fs.readFileSync(buildInfoPath, "utf8"));
    const buildInfoKeys = Object.keys(buildInfo).sort();
    const shaIsValid = typeof buildInfo.sha === "string" && /^[0-9a-f]{40}$/i.test(buildInfo.sha);
    const parsedTime = new Date(buildInfo.time);
    const timeIsValid =
      typeof buildInfo.time === "string" &&
      !Number.isNaN(parsedTime.getTime()) &&
      parsedTime.toISOString() === buildInfo.time;

    if (buildInfoKeys.join(",") !== "sha,time") {
      logError("build-info.json must contain only sha and time");
      return false;
    }

    if (!shaIsValid) {
      logError("build-info.json must contain a full 40-character hexadecimal Git SHA");
      return false;
    }

    if (!timeIsValid) {
      logError("build-info.json must contain a valid ISO build time");
      return false;
    }

    logSuccess(`Build identity present for SHA ${buildInfo.sha}`);
    return true;
  } catch (error) {
    logError(`Error validating build identity: ${error.message}`);
    return false;
  }
}

// Constants
const BYTES_PER_MB = 1024 * 1024;
const LARGE_FILE_THRESHOLD_MB = 1;

/**
 * Checks the size of build artifacts
 */
function checkBuildSize() {
  const distPath = path.join(projectRoot, "dist");
  const assetsPath = path.join(distPath, "assets");

  logInfo("Checking build sizes...");

  try {
    const files = fs.readdirSync(assetsPath);
    let totalSize = 0;
    const largeFiles = [];

    files.forEach((file) => {
      const filePath = path.join(assetsPath, file);
      const stats = fs.statSync(filePath);
      totalSize += stats.size;

      // Flag files larger than threshold
      if (stats.size > LARGE_FILE_THRESHOLD_MB * BYTES_PER_MB) {
        largeFiles.push({
          name: file,
          size: (stats.size / BYTES_PER_MB).toFixed(2) + " MB",
        });
      }
    });

    const totalSizeMB = (totalSize / BYTES_PER_MB).toFixed(2);
    logInfo(`Total build size: ${totalSizeMB} MB`);

    if (largeFiles.length > 0) {
      logWarning(`Large files detected (>${LARGE_FILE_THRESHOLD_MB}MB):`);
      largeFiles.forEach((file) => {
        logWarning(`  - ${file.name}: ${file.size}`);
      });
      logWarning("Consider code splitting to reduce bundle size");
    }

    return true;
  } catch (error) {
    logError(`Error checking build size: ${error.message}`);
    return false;
  }
}

/**
 * Validates that index.html contains proper asset references
 */
function validateIndexHtml() {
  const indexPath = path.join(projectRoot, "dist", "index.html");

  logInfo("Validating index.html content...");

  try {
    const content = fs.readFileSync(indexPath, "utf-8");

    // Check for script tag
    if (!content.includes("<script") || !content.includes('type="module"')) {
      logError("index.html does not contain proper script tags");
      return false;
    }
    logSuccess("index.html contains script tags");

    // Check for asset references
    if (!content.includes("/assets/")) {
      logWarning("index.html does not reference assets directory");
    } else {
      logSuccess("index.html references assets correctly");
    }

    // Check for viewport meta tag
    if (!content.includes("viewport")) {
      logWarning("index.html missing viewport meta tag");
    } else {
      logSuccess("index.html has viewport meta tag");
    }

    return true;
  } catch (error) {
    logError(`Error reading index.html: ${error.message}`);
    return false;
  }
}

/**
 * Main validation function
 */
function main() {
  log("\n=== Build Validation ===\n", "blue");

  let allValid = true;

  // Run validations
  if (!validateDistDirectory()) allValid = false;
  if (!validateNoPublicSourceMaps()) allValid = false;
  if (!validateBuildInfo()) allValid = false;
  if (!checkBuildSize()) allValid = false;
  if (!validateIndexHtml()) allValid = false;

  // Summary
  log("\n=== Validation Summary ===\n", "blue");

  if (allValid) {
    logSuccess("All validation checks passed!");
    logInfo("Build is ready for deployment to Cloud Run");
    process.exit(0);
  } else {
    logError("Some validation checks failed");
    logError("Please fix the issues before deploying");
    process.exit(1);
  }
}

// Run validation
main();
