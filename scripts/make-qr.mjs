// 会場に置く QR コードの印刷用ページを作るスクリプト。
//
// - トップページ用の 1枚だけ（ゲームごとに作ると枚数が多すぎるため。
//   来場者はトップのゲーム一覧から、ランキングとスコア登録に進む）
// - 同じものを各テーブルに置く場合は、印刷時に部数を増やす
// - 出力: docs/qr/index.html（ブラウザで開いて印刷する。1枚＝A4 1ページ）
//
// 使い方: node scripts/make-qr.mjs
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import QRCode from "qrcode";

const SITE = "https://gamedev-fes-2026.web.app";
const root = path.resolve(import.meta.dirname, "..");
const sheets = [
  { title: "ゲーム紹介＆ランキング", sub: "展示中のゲームの紹介・ハイスコア・スコア登録はこちら", url: `${SITE}/` },
];

const escape = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const pages = await Promise.all(sheets.map(async (s) => {
  // 誤り訂正レベル M：多少汚れたり折れたりしても読み取れる
  const svg = await QRCode.toString(s.url, { type: "svg", errorCorrectionLevel: "M", margin: 2 });
  return `
  <section class="sheet">
    <p class="head">GAMEDEV CIRCLE FES 2026</p>
    <h1>${escape(s.title)}</h1>
    <p class="sub">${escape(s.sub)}</p>
    <div class="qr">${svg}</div>
    <p class="url">${escape(s.url)}</p>
  </section>`;
}));

const html = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<title>QRコード（印刷用）</title>
<link href="https://fonts.googleapis.com/css2?family=DotGothic16&family=Press+Start+2P&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #555; font-family: "DotGothic16", sans-serif; }
  .sheet {
    width: 210mm; height: 297mm; margin: 10mm auto; padding: 18mm 16mm;
    background: #fff; color: #000; text-align: center;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    border: 6mm solid #000; outline: 2mm solid #e8342b; outline-offset: -10mm;
    page-break-after: always; break-after: page;
  }
  .head { font-family: "Press Start 2P"; font-size: 13pt; margin: 0 0 10mm; }
  h1 { font-family: "Press Start 2P", "DotGothic16"; font-size: 26pt; line-height: 1.5; margin: 0 0 6mm; word-break: break-word; }
  .sub { font-size: 20pt; margin: 0 0 10mm; }
  .qr { width: 140mm; height: 140mm; }
  .qr svg { width: 100%; height: 100%; }
  .url { font-size: 12pt; margin: 8mm 0 0; word-break: break-all; }
  @media print {
    body { background: #fff; }
    .sheet { margin: 0; }
  }
</style>
</head>
<body>${pages.join("")}
</body>
</html>
`;

await mkdir(path.join(root, "docs", "qr"), { recursive: true });
await writeFile(path.join(root, "docs", "qr", "index.html"), html);
console.log(`${sheets.length}枚分の QR コードを docs/qr/index.html に書き出しました`);
sheets.forEach((s) => console.log(`  ${s.title}: ${s.url}`));
