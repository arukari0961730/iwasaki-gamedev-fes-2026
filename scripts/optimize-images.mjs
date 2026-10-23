// 素材/画像 にあるスクリーンショットを、サイト用の軽い画像に変換するスクリプト。
//
// - ファイル名はゲームID（例: kusoge-next.png）にしておく
// - 横幅を最大1280pxに縮小し、WebP 形式で public/images/games/ に書き出す
//   （元のPNGは数MBあるものもあり、会場の電波だと読み込みが遅くなるため）
//
// 使い方: node scripts/optimize-images.mjs
import { readdir, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const srcDir = path.join(root, "素材", "画像");
const outDir = path.join(root, "public", "images", "games");

await mkdir(outDir, { recursive: true });

for (const file of await readdir(srcDir)) {
  if (!/\.(png|jpe?g)$/i.test(file)) continue;
  const id = path.parse(file).name;
  const outPath = path.join(outDir, `${id}.webp`);
  const info = await sharp(path.join(srcDir, file))
    .resize({ width: 1280, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(outPath);
  console.log(`${id}.webp  ${info.width}x${info.height}  ${Math.round(info.size / 1024)}KB`);
}
