import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const distPath = join(__dirname, "dist");

// Check if dist folder exists
if (!fs.existsSync(distPath)) {
  console.error("❌ ERROR: dist folder not found at:", distPath);
  console.log("Available files:", fs.readdirSync(__dirname));
  process.exit(1);
}

// Serve static files from dist
app.use(express.static(distPath));

// SPA fallback - serve index.html for all non-static routes
app.get("*", (req, res) => {
  const indexPath = join(distPath, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send("index.html not found");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Frontend running on port ${PORT}`);
  console.log(`📁 Serving from: ${distPath}`);
});
