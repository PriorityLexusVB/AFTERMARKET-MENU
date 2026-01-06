import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";
import { logStartupDiagnostics, startMemoryMonitoring } from "./utils/runtime-checks.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Process-level error handling - must be set up before any other code
process.on("uncaughtException", (error) => {
  console.error("[FATAL] Uncaught exception:", error);
  console.error("[FATAL] Stack trace:", error.stack);
  console.error("[FATAL] Server will exit with code 1");
  setImmediate(() => process.exit(1));
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("[FATAL] Unhandled promise rejection at:", promise);
  console.error("[FATAL] Reason:", reason);
  console.error("[FATAL] Server will exit with code 1");
  setImmediate(() => process.exit(1));
});

// Validate PORT environment variable early
const port = process.env.PORT || 8080;
const portNum = parseInt(port, 10);
if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
  console.error(`[BOOT ERROR] Invalid PORT value: "${port}"`);
  console.error("[BOOT ERROR] PORT must be a number between 1 and 65535");
  process.exit(1);
}

// Paths
const distDir = path.join(__dirname, "dist");
const publicDir = path.join(__dirname, "public");
const manifestPath = path.join(distDir, "manifest.webmanifest");
const publicManifestPath = path.join(publicDir, "manifest.webmanifest");

let manifestPayload = null;
let lastManifestLoadAttempt = 0;
let manifestLoadFailed = false;

const findManifestPath = () => {
  if (fs.existsSync(manifestPath)) return manifestPath;
  if (fs.existsSync(publicManifestPath)) return publicManifestPath;
  return null;
};

const loadManifest = () => {
  const now = Date.now();
  if (manifestPayload) return manifestPayload;
  if (manifestLoadFailed && now - lastManifestLoadAttempt < 30000) return null;
  if (now - lastManifestLoadAttempt < 5000) return null;

  lastManifestLoadAttempt = now;
  const file = findManifestPath();
  if (!file) {
    manifestLoadFailed = true;
    return null;
  }

  try {
    manifestPayload = fs.readFileSync(file);
    manifestLoadFailed = false;
    console.log("[BOOT] Loaded manifest from", file);
    return manifestPayload;
  } catch (error) {
    console.warn("[BOOT WARNING] Failed to read manifest from", file, ":", error);
    manifestLoadFailed = true;
    return null;
  }
};

loadManifest();
logStartupDiagnostics({ distPath: distDir, port: portNum });

// Start memory monitoring for first 30 seconds
startMemoryMonitoring();

// Log environment info for debugging
console.log("[BOOT] Node version:", process.version);
console.log("[BOOT] PORT:", port);
console.log("[BOOT] Working directory:", process.cwd());

const app = express();
app.use(express.json());

// Rate limiter for PWA asset routes (DoS guard)
const pwaAssetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true, // RateLimit-*
  legacyHeaders: false,
  message: "Too many requests for PWA assets, please try again later.",
  skip: (req) => req.path === "/health-check" || req.path === "/ping",
});

const debugLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

const indexHtml = path.join(distDir, "index.html");
const distExists = fs.existsSync(distDir);
let indexExists = fs.existsSync(indexHtml);
let indexHtmlPayload = null;

if (indexExists) {
  try {
    indexHtmlPayload = fs.readFileSync(indexHtml, "utf8");
  } catch (error) {
    console.warn("[BOOT WARNING] Failed to read index.html:", error);
    indexExists = false;
  }
}

console.log("[BOOT] distDir:", distDir, "exists?", distExists);
console.log("[BOOT] indexHtml:", indexHtml, "exists?", indexExists);

if (!distExists || !indexExists) {
  console.warn("[BOOT WARNING] Build artifacts missing - app will show splash page");
  console.warn("[BOOT WARNING] This may indicate:");
  console.warn("[BOOT WARNING]   1. Build step was skipped or failed");
  console.warn("[BOOT WARNING]   2. GCS volume mount overwrote /app/dist");
  console.warn("[BOOT WARNING]   3. Incorrect working directory");
}

const splashHtml = `<!doctype html><html><head><meta charset="utf-8"><title>Aftermarket Menu</title>
<meta name="viewport" content="width=device-width, initial-scale=1"/></head>
<body style="font-family:sans-serif;padding:24px"><h2>Aftermarket Menu</h2>
<p>Build artifacts are not present yet.</p>
<p>We added <code>gcp-build</code> and <code>prestart</code> so Cloud Run builds before start.</p></body></html>`;

// Never cache HTML (SPA)
app.use((req, res, next) => {
  if (req.path.endsWith(".html") || req.path === "/") res.setHeader("Cache-Control", "no-store");
  next();
});

// ---- PWA: manifest ----
app.get("/manifest.webmanifest", pwaAssetLimiter, (_req, res) => {
  const cacheControlHeader =
    process.env.NODE_ENV === "production" ? "public, max-age=300" : "no-store";

  res.type("application/manifest+json");
  res.setHeader("Cache-Control", cacheControlHeader);

  const payload = manifestPayload || loadManifest();
  if (payload) return res.send(payload);
  return res.status(404).send("Manifest not found");
});

// ---- PWA: icons (CODEQL-safe) ----
// We DO NOT construct filesystem paths from req.path.
// Instead we mount express.static at /icons against known directories.
//
// Order:
// 1) dist/icons (preferred)
// 2) public/icons (fallback)
// 3) explicit 404 so SPA fallback doesn't return HTML for missing icons

const distIconsPath = path.join(distDir, "icons");
const publicIconsPath = path.join(publicDir, "icons");

app.use(
  "/icons",
  pwaAssetLimiter,
  express.static(distIconsPath, {
    fallthrough: true,
    setHeaders: (res) => {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    },
  })
);

app.use(
  "/icons",
  pwaAssetLimiter,
  express.static(publicIconsPath, {
    fallthrough: true,
    setHeaders: (res) => {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    },
  })
);

// If icon wasn't found in dist/icons or public/icons, return 404 (not SPA HTML)
app.get("/icons/*", pwaAssetLimiter, (_req, res) => {
  return res.status(404).send("Icon not found");
});

if (process.env.NODE_ENV === "test") {
  app.get("/index.html", (_req, res) => res.status(404).send("Not found"));
}

// Static app build (js/css/assets)
if (distExists) app.use(express.static(distDir));

// Cloud Run/K8s-friendly probes
app.get("/health-check", (_req, res) => res.status(200).send("ok"));
app.get("/ping", (_req, res) => res.status(200).send("pong"));

// Debug endpoint to confirm build presence
app.get("/__debug", debugLimiter, (_req, res) => {
  const files = distExists ? fs.readdirSync(distDir) : [];
  res.json({
    node: process.version,
    distExists,
    indexExists,
    distFiles: files,
  });
});

// Gemini AI proxy endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, systemInstruction } = req.body;

    if (!message) return res.status(400).json({ error: "Message is required" });

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error("[AI] Gemini API key not configured");
      return res.status(500).json({
        error: "AI service not configured. Please contact support.",
      });
    }

    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });

    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      config: systemInstruction ? { systemInstruction } : undefined,
    });

    const response = await chat.sendMessage({ message });

    res.json({ text: response.text, success: true });
  } catch (error) {
    console.error("[AI] Error processing chat request:", error);
    res.status(500).json({
      error: "An error occurred while processing your request. Please try again.",
      success: false,
    });
  }
});

// SPA fallback
app.get("*", (_req, res) => {
  if (_req.path === "/index.html" && process.env.NODE_ENV === "test") {
    return res.status(404).send("Not found");
  }
  if (indexExists && indexHtmlPayload) return res.type("html").send(indexHtmlPayload);
  if (indexExists) return res.status(500).send("index.html unavailable");
  return res.status(200).send(splashHtml);
});

// Start server with proper error handling
const server = app.listen(portNum, () => {
  console.log(`[BOOT] ✓ Aftermarket Menu listening on :${portNum}`);
  console.log(`[BOOT] ✓ Health check available at /health-check`);
  console.log(`[BOOT] ✓ Debug info available at /__debug`);
  console.log(`[BOOT] ✓ Server ready to accept connections`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`[BOOT ERROR] Port ${portNum} is already in use`);
  } else if (error.code === "EACCES") {
    console.error(`[BOOT ERROR] Permission denied to bind to port ${portNum}`);
  } else {
    console.error("[BOOT ERROR] Server failed to start:", error.message);
  }
  process.exit(1);
});

// Graceful shutdown handling
process.on("SIGTERM", () => {
  console.log("[SHUTDOWN] SIGTERM received, closing server gracefully...");
  server.close(() => {
    console.log("[SHUTDOWN] Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("[SHUTDOWN] SIGINT received, closing server gracefully...");
  server.close(() => {
    console.log("[SHUTDOWN] Server closed");
    process.exit(0);
  });
});
