// 確認用の簡易サーバー。http://localhost:5173 で public/ の中身を配信する。
// - Firebase Hosting と同じく、/ranking → ranking.html のように .html を省略して開ける
// - /docs/ と /public/ で始まるパスは、プロジェクト直下から配信する（デザイン見本用）
//
// 使い方: node scripts/dev-server.mjs
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const port = 5173;
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
};

async function resolve(base, urlPath) {
  let filePath = path.join(base, urlPath);
  if (!filePath.startsWith(base)) return null;
  try {
    if ((await stat(filePath)).isDirectory()) filePath = path.join(filePath, "index.html");
    await stat(filePath);
    return filePath;
  } catch {
    if (!path.extname(filePath)) return resolve(base, `${urlPath}.html`).catch(() => null);
    return null;
  }
}

createServer(async (req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const base = /^\/(docs|public)\//.test(urlPath) ? root : path.join(root, "public");
  const filePath = await resolve(base, urlPath);
  try {
    if (!filePath) throw new Error("not found");
    const body = await readFile(filePath);
    res.writeHead(200, { "Content-Type": types[path.extname(filePath)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404).end("Not found");
  }
}).listen(port, () => console.log(`http://localhost:${port}`));
