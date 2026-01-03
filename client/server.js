import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const distPath = join(__dirname, "dist");

// Log startup info
console.log("📁 Current directory:", __dirname);
console.log("📁 Looking for dist at:", distPath);
console.log("📁 Dist exists?", fs.existsSync(distPath));

if (fs.existsSync(distPath)) {
  const files = fs.readdirSync(distPath);
  console.log("📁 Files in dist:", files);
  console.log("📁 index.html exists?", fs.existsSync(join(distPath, "index.html")));
} else {
  console.error("❌ ERROR: dist folder not found!");
  console.log("📁 Available in", __dirname, ":", fs.readdirSync(__dirname));
}

// Serve static files from dist
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// SPA fallback - serve index.html for all non-static routes
app.use((req, res) => {
  const indexPath = join(distPath, "index.html");
  console.log("Request:", req.path, "-> checking", indexPath);
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send("index.html not found at " + indexPath);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Frontend running on port ${PORT}`);
  console.log(`📁 Serving from: ${distPath}`);
});
