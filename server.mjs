import { createReadStream, existsSync } from "node:fs";
import { stat, readFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, "dist");
const host = "0.0.0.0";
const port = Number(process.env.PORT || 3000);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const indexPath = path.join(distDir, "index.html");
const runtimeConfigScriptPath = "/app-config.js";

const sendFile = async (res, filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const fileStats = await stat(filePath);

  res.writeHead(200, {
    "Content-Length": fileStats.size,
    "Content-Type": contentTypes[ext] || "application/octet-stream",
  });

  createReadStream(filePath).pipe(res);
};

const getRuntimeConfigScript = () => {
  const apiUrl = (process.env.VITE_API_URL || "").trim();

  return `window.__APP_CONFIG__ = ${JSON.stringify({
    VITE_API_URL: apiUrl,
  })};`;
};

http
  .createServer(async (req, res) => {
    try {
      const requestPath = decodeURIComponent((req.url || "/").split("?")[0]);

      if (requestPath === runtimeConfigScriptPath) {
        const script = getRuntimeConfigScript();
        res.writeHead(200, {
          "Cache-Control": "no-store",
          "Content-Type": "text/javascript; charset=utf-8",
        });
        res.end(script);
        return;
      }

      const normalizedPath = requestPath === "/" ? "/index.html" : requestPath;
      const resolvedPath = path.normalize(path.join(distDir, normalizedPath));

      if (!resolvedPath.startsWith(distDir)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }

      if (existsSync(resolvedPath)) {
        await sendFile(res, resolvedPath);
        return;
      }

      const html = await readFile(indexPath);
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
      });
      res.end(html);
    } catch (error) {
      res.writeHead(500, {
        "Content-Type": "text/plain; charset=utf-8",
      });
      res.end("Internal Server Error");
    }
  })
  .listen(port, host);
