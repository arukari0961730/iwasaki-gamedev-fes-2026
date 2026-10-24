// 素材/画像 にあるスクリーンショットを、サイト用の軽い画像に変換するスクリプト。
//
// - ファイル名はゲームID（例: kusoge-next.png）にしておく
// - 横幅を縮小し、WebP 形式で public/images/<出力先> に書き出す
//   （元のPNGは数MBあるものもあり、会場の電波だと読み込みが遅くなるため。
//    また、無料プランの1日あたりの転送量にも限りがある）
//
// 使い方:
//   node scripts/optimize-images.mjs                       横幅960px・画質70で games/ に出力
//   node scripts/optimize-images.mjs --width 1280 --quality 80 --out games-hq
import { readdir, mkdir } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import sharp from "sharp";

const { values: opts } = parseArgs({
  options: {
    width: { type: "string", default: "960" },
    quality: { type: "string", default: "70" },
    out: { type: "string", default: "games" },
  },
});

const root = path.resolve(import.meta.dirname, "..");
const srcDir = path.join(root, "素材", "画像");
const outDir = path.join(root, "public", "images", opts.out);

await mkdir(outDir, { recursive: true });

let total = 0;
for (const file of await readdir(srcDir)) {
  if (!/\.(png|jpe?g)$/i.test(file)) continue;
  const id = path.parse(file).name;
  const info = await sharp(path.join(srcDir, file))
    .resize({ width: Number(opts.width), withoutEnlargement: true })
    .webp({ quality: Number(opts.quality) })
    .toFile(path.join(outDir, `${id}.webp`));
  total += info.size;
  console.log(`${id}.webp  ${info.width}x${info.height}  ${Math.round(info.size / 1024)}KB`);
}
console.log(`合計 ${Math.round(total / 1024)}KB → public/images/${opts.out}/`);
