import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const distDir = path.join(__dirname, "dist");
const indexHtml = path.join(distDir, "index.html");
const distExists = fs.existsSync(distDir);
const indexExists = fs.existsSync(indexHtml);

console.log("[BOOT] distDir:", distDir, "exists?", distExists);
console.log("[BOOT] indexHtml:", indexHtml, "exists?", indexExists);

const splashHtml = `<!doctype html><html><head><meta charset="utf-8"><title>Aftermarket Menu</title>
<meta name="viewport" content="width=device-width, initial-scale=1"/></head>
<body style="font-family:sans-serif;padding:24px"><h2>Aftermarket Menu</h2>
<p>Build artifacts are not present yet.</p>
<p>We added <code>gcp-build</code> and <code>prestart</code> so Cloud Run builds before start.</p></body></html>`;

app.use((req,res,next)=>{ if(req.path.endsWith(".html")||req.path==="/") res.setHeader("Cache-Control","no-store"); next(); });

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

// SPA fallback
app.get("*", (_req, res) => {
  if (!indexExists) {
    return res.status(200).send(splashHtml);
  }

  // Read the index.html file to inject the runtime config
  fs.readFile(indexHtml, 'utf8', (err, html) => {
    if (err) {
      console.error('Error reading index.html:', err);
      return res.status(500).send('Error loading the application.');
    }

    // Prepare the Firebase config from runtime environment variables
    const firebaseConfig = {
      apiKey: process.env.VITE_FIREBASE_API_KEY,
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.VITE_FIREBASE_APP_ID,
    };

    // Inject the config into a script tag in the head. This makes it available on the window object.
    const injectedHtml = html.replace(
      '</head>',
      `<script>window.firebaseConfig = ${JSON.stringify(firebaseConfig)};</script></head>`
    );

    res.send(injectedHtml);
  });
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`[BOOT] Aftermarket Menu listening on :${port}`));
