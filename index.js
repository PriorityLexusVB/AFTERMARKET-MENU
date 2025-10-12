import express from "express";
import path from "path";

const app = express();
app.use(express.json());

// Serve static files from the 'dist' directory, which is the output of the build process.
const distDir = path.join(process.cwd(), 'dist');
app.use(express.static(distDir));

app.get("/healthz", (_req, res) => res.send("ok"));

// Handle SPA routing: for any request that doesn't match a static file,
// send back index.html. This is important for client-side routing.
app.get('*', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`API listening on :${port}`));