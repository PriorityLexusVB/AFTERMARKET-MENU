import express from "express";
import path from "path";

const app = express();
app.use(express.json());

// Serve static files from the 'public' directory. `process.cwd()` is the
// current working directory, which should be the project root.
const publicDir = path.join(process.cwd(), 'public');
app.use(express.static(publicDir));

app.get("/healthz", (_req, res) => res.send("ok"));

// Handle SPA routing: for any request that doesn't match a static file,
// send back index.html. This is important for client-side routing.
app.get('*', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`API listening on :${port}`));
