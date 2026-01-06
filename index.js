import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";
import { logStartupDiagnostics, startMemoryMonitoring } from "./utils/runtime-checks.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Process-level error handling - must be set up before any other code
process.on('uncaughtException', (error) => {
  console.error('[FATAL] Uncaught exception:', error);
  console.error('[FATAL] Stack trace:', error.stack);
  console.error('[FATAL] Server will exit with code 1');
  // Allow pending I/O operations to complete before exiting
  setImmediate(() => process.exit(1));
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled promise rejection at:', promise);
  console.error('[FATAL] Reason:', reason);
  console.error('[FATAL] Server will exit with code 1');
  // Allow pending I/O operations to complete before exiting
  setImmediate(() => process.exit(1));
});

// Validate PORT environment variable early
const port = process.env.PORT || 8080;
const portNum = parseInt(port, 10);
if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
  console.error(`[BOOT ERROR] Invalid PORT value: "${port}"`);
  console.error('[BOOT ERROR] PORT must be a number between 1 and 65535');
  process.exit(1);
}

// Run comprehensive startup diagnostics
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

// Rate limiter for PWA asset routes to prevent DoS attacks via file system operations
// Allows 100 requests per 15 minutes per IP for manifest and icon routes
const pwaAssetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: "Too many requests for PWA assets, please try again later.",
  // Skip rate limiting for health check endpoints
  skip: (req) => req.path === "/health-check" || req.path === "/ping",
});

const indexHtml = path.join(distDir, "index.html");
const distExists = fs.existsSync(distDir);
const indexExists = fs.existsSync(indexHtml);

console.log("[BOOT] distDir:", distDir, "exists?", distExists);
console.log("[BOOT] indexHtml:", indexHtml, "exists?", indexExists);

// Warn if dist directory is missing or empty
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

app.use((req,res,next)=>{ if(req.path.endsWith(".html")||req.path==="/") res.setHeader("Cache-Control","no-store"); next(); });

// PWA manifest route with rate limiting to prevent DoS attacks
// The manifest is read from disk, so we limit requests to avoid file system abuse
app.get("/manifest.webmanifest", pwaAssetLimiter, (_req, res) => {
  const cacheControlHeader = process.env.NODE_ENV === "production"
    ? "public, max-age=300"
    : "no-store";
  res.type("application/manifest+json");
  res.setHeader("Cache-Control", cacheControlHeader);
  const payload = manifestPayload || loadManifest();
  if (payload) return res.send(payload);
  return res.status(404).send("Manifest not found");
});

<<<<<<< copilot/add-pwa-manifest-icons
// PWA icon route with rate limiting and path traversal protection
// Icons are read from disk, so we limit requests and validate paths strictly
app.get("/icons/*", pwaAssetLimiter, (_req, res) => {
  // Extract the relative path, removing leading slashes
  const relativePath = _req.path.replace(/^\/+/, "");
  
  // Validate that the path starts with "icons/" to prevent path traversal
  if (!relativePath.startsWith("icons/")) {
    return res.status(400).send("Invalid icon path");
  }
  
  // Resolve paths relative to dist and public directories
  const distIconPath = path.resolve(distDir, relativePath);
  const publicIconPath = path.resolve(publicDir, relativePath);

  // Security: Validate that resolved paths stay within their respective base directories
  // This prevents path traversal attacks (e.g., /icons/../../../etc/passwd)
  const isSafePath = (targetPath, baseDir) => {
    const rel = path.relative(baseDir, targetPath);
    // Path must be non-empty, not start with "..", and not be absolute
    return rel && !rel.startsWith("..") && !path.isAbsolute(rel);
  };

  // Reject if neither resolved path is safe
  if (!isSafePath(distIconPath, distDir) && !isSafePath(publicIconPath, publicDir)) {
    return res.status(400).send("Invalid icon path");
  }

  // Check which file exists (prefer dist over public)
  // SECURITY NOTE: Using existsSync is acceptable here because:
  // 1. Paths are validated above to prevent traversal
  // 2. Route is rate-limited to prevent DoS
  // 3. This is a read-only operation for static assets
  const iconFile = fs.existsSync(distIconPath) ? distIconPath : fs.existsSync(publicIconPath) ? publicIconPath : null;

  if (!iconFile) return res.status(404).send("Icon not found");

  // Set long-term cache for immutable icons
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  // sendFile is safe here because we've validated the path above
  return res.sendFile(iconFile);
=======
// Serve icons safely (no user-controlled path resolution)
app.get("/icons/*", pwaAssetLimiter, (req, res) => {
  // Extract path after /icons/ prefix
  const rel = req.path.substring("/icons/".length);
  // Basic validation: no traversal, no absolute paths, no backslashes
  if (
    !rel ||
    rel.includes("..") ||
    rel.startsWith("/") ||
    rel.includes("\\") ||
    rel.includes(":")
  ) {
    return res.status(400).send("Invalid icon path");
  }

  // Prefer dist icons if present, else public icons
  const distIconsDir = path.join(distDir, "icons");
  const publicIconsDir = path.join(publicDir, "icons");

  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

  // Try dist first; if not found, fall back to public
  res.sendFile(rel, { root: distIconsDir }, (err) => {
    if (!err) return;
    // Only fall back on "not found"
    if (err.code === "ENOENT" || err.statusCode === 404) {
      res.sendFile(rel, { root: publicIconsDir }, (err2) => {
        if (err2) {
          return res.status(404).send("Icon not found");
        }
      });
      return;
    }
    res.status(500).send("Failed to serve icon");
  });
>>>>>>> main
});

if (distExists) app.use(express.static(distDir));

// Cloud Run/K8s-friendly probes
app.get("/health-check", (_req,res)=>res.status(200).send("ok"));
app.get("/ping", (_req,res)=>res.status(200).send("pong"));

// Debug endpoint to confirm build presence
app.get("/__debug", (_req,res)=>{
  const files = distExists ? fs.readdirSync(distDir) : [];
  res.json({
    node: process.version,
    distExists, indexExists,
    distFiles: files
  });
});

// Gemini AI proxy endpoint for secure API key handling
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, systemInstruction } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      console.error("[AI] Gemini API key not configured");
      return res.status(500).json({
        error: "AI service not configured. Please contact support."
      });
    }

    // Dynamic import of @google/genai to avoid build issues
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    // Create a new chat instance with system instruction
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: systemInstruction ? { systemInstruction } : undefined,
    });

    // Send message and get response
    const response = await chat.sendMessage({ message });

    res.json({
      text: response.text,
      success: true
    });

  } catch (error) {
    console.error("[AI] Error processing chat request:", error);
    res.status(500).json({
      error: "An error occurred while processing your request. Please try again.",
      success: false
    });
  }
});

// SPA fallback
app.get("*", (_req,res)=> indexExists ? res.sendFile(indexHtml) : res.status(200).send(splashHtml));

// Start server with proper error handling
const server = app.listen(portNum, () => {
  console.log(`[BOOT] ✓ Aftermarket Menu listening on :${portNum}`);
  console.log(`[BOOT] ✓ Health check available at /health-check`);
  console.log(`[BOOT] ✓ Debug info available at /__debug`);
  console.log(`[BOOT] ✓ Server ready to accept connections`);
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`[BOOT ERROR] Port ${portNum} is already in use`);
    console.error('[BOOT ERROR] Please use a different PORT or stop the conflicting process');
  } else if (error.code === 'EACCES') {
    console.error(`[BOOT ERROR] Permission denied to bind to port ${portNum}`);
    console.error('[BOOT ERROR] Ports below 1024 require root privileges');
  } else {
    console.error('[BOOT ERROR] Server failed to start:', error.message);
  }
  process.exit(1);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('[SHUTDOWN] SIGTERM received, closing server gracefully...');
  server.close(() => {
    console.log('[SHUTDOWN] Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[SHUTDOWN] SIGINT received, closing server gracefully...');
  server.close(() => {
    console.log('[SHUTDOWN] Server closed');
    process.exit(0);
  });
});
