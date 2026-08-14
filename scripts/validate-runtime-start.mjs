#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(currentFile), "..");
const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, "package.json"), "utf8"));
const scripts = packageJson.scripts ?? {};
const errors = [];

if (Object.hasOwn(scripts, "prestart")) {
  errors.push("package.json must not define prestart; Cloud Run must serve the prebuilt image");
}

if (scripts.start !== "node index.js") {
  errors.push('package.json start must be exactly "node index.js"');
}

if (scripts.serve !== "node index.js") {
  errors.push('package.json serve must be exactly "node index.js"');
}

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exit(1);
}

console.log("Runtime start contract PASS: prebuilt dist is served without a startup rebuild");
