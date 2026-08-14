import fs from "node:fs";
import path from "node:path";

const SHA_PATTERN = /^[0-9a-f]{40}$/i;

const isExactIsoTime = (value) => {
  if (typeof value !== "string") return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
};

export const validateRuntimeArtifacts = (distDir) => {
  const errors = [];
  const indexPath = path.join(distDir, "index.html");
  const buildInfoPath = path.join(distDir, "build-info.json");

  try {
    if (!fs.statSync(distDir).isDirectory()) return ["dist path is not a directory"];
  } catch (error) {
    return [
      error?.code === "ENOENT" ? "dist directory is missing" : "dist directory is unreadable",
    ];
  }

  const isReadableFile = (filePath, missingMessage, unreadableMessage) => {
    try {
      if (!fs.statSync(filePath).isFile()) {
        errors.push(missingMessage);
        return false;
      }
      return true;
    } catch (error) {
      errors.push(error?.code === "ENOENT" ? missingMessage : unreadableMessage);
      return false;
    }
  };

  const indexIsReadable = isReadableFile(
    indexPath,
    "dist/index.html is missing",
    "dist/index.html is unreadable"
  );

  const buildInfoIsReadable = isReadableFile(
    buildInfoPath,
    "dist/build-info.json is missing",
    "dist/build-info.json is unreadable"
  );

  if (buildInfoIsReadable) {
    try {
      const buildInfo = JSON.parse(fs.readFileSync(buildInfoPath, "utf8"));
      const keys = Object.keys(buildInfo).sort();
      if (keys.join(",") !== "sha,time") {
        errors.push("dist/build-info.json must contain only sha and time");
      }
      if (typeof buildInfo.sha !== "string" || !SHA_PATTERN.test(buildInfo.sha)) {
        errors.push("dist/build-info.json SHA is invalid");
      }
      if (!isExactIsoTime(buildInfo.time)) {
        errors.push("dist/build-info.json time is invalid");
      }
    } catch {
      errors.push("dist/build-info.json is not valid JSON");
    }
  }

  if (indexIsReadable) {
    try {
      const indexHtml = fs.readFileSync(indexPath, "utf8");
      const references = [
        ...indexHtml.matchAll(/(?:src|href)=["']\/?(assets\/[^"'?#]+)[^"']*["']/g),
      ].map((match) => match[1]);
      const hasJavaScript = references.some((reference) => reference?.endsWith(".js"));
      const hasCss = references.some((reference) => reference?.endsWith(".css"));

      if (!hasJavaScript) errors.push("dist/index.html has no JavaScript asset reference");
      if (!hasCss) errors.push("dist/index.html has no CSS asset reference");

      for (const reference of references) {
        if (!reference || reference.includes("..")) {
          errors.push("dist/index.html contains an invalid asset reference");
          continue;
        }

        const assetPath = path.resolve(distDir, reference);
        const distPrefix = `${path.resolve(distDir)}${path.sep}`;
        if (!assetPath.startsWith(distPrefix)) {
          errors.push(`referenced asset is missing: ${reference}`);
          continue;
        }

        try {
          if (!fs.statSync(assetPath).isFile()) {
            errors.push(`referenced asset is missing: ${reference}`);
          }
        } catch (error) {
          errors.push(
            error?.code === "ENOENT"
              ? `referenced asset is missing: ${reference}`
              : `referenced asset is unreadable: ${reference}`
          );
        }
      }
    } catch {
      errors.push("dist/index.html is unreadable");
    }
  }

  return errors;
};
