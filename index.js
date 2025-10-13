import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Serve compiled Vite build from /dist
const distDir = path.join(__dirname, 'dist');
app.use(express.static(distDir));

app.get("/healthz", (_req, res) => res.send("ok"));

// SPA fallback
app.get("*", (_req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Aftermarket Menu listening on :${port}`));