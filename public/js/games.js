// ゲーム情報（data/games.json）の読み込みと、スコアの表示・入力の変換をまとめたファイル。
//
// スコアはどのゲームでも「整数1つ」で保存している。
//   - 点数: そのまま（1200）
//   - タイム: 秒に変換（2:12 → 132）
// 表示するときに、ゲームごとの設定（ranking.format / ranking.unit）に合わせて変換する。

let cache;

export async function loadGames() {
  cache ??= fetch("/data/games.json").then((res) => res.json());
  return cache;
}

export async function findGame(id) {
  const games = await loadGames();
  return games.find((g) => g.id === id && g.ranking.enabled);
}

export function rankingGames(games) {
  return games.filter((g) => g.ranking.enabled);
}

// ゲーム画像の URL（画像がまだないゲームは「NO IMAGE」の仮画像にする）
export function imageUrl(game) {
  return `/${game.image ?? "images/no-image.svg"}`;
}

// 保存されている整数 → 画面に出す文字列
export function formatScore(game, score) {
  if (game.ranking.format === "time") {
    const min = Math.floor(score / 60);
    const sec = String(score % 60).padStart(2, "0");
    return `${min}:${sec}`;
  }
  // 単位が英字（Coin など）のときは、数字とくっつかないように半角スペースを入れる
  const unit = game.ranking.unit ?? "";
  const space = /^[A-Za-z]/.test(unit) ? " " : "";
  return `${score.toLocaleString("ja-JP")}${space}${unit}`;
}

// 1 → "1ST", 2 → "2ND", 11 → "11TH" のような順位の表記
export function ordinal(n) {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}TH`;
  return n + ({ 1: "ST", 2: "ND", 3: "RD" }[n % 10] ?? "TH");
}

// 名前などを HTML に埋め込むときに、タグとして解釈されないようにする
export function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);
}

// ランキング表の中身（<li> の並び）を作る
export function rankingItems(game, records, { min = 0 } = {}) {
  const items = records.map((r, i) => `
    <li class="${r.hidden ? "is-hidden" : ""}" data-name="${escapeHtml(r.name)}">
      <span class="rank">${ordinal(i + 1)}</span>
      <span class="name">${escapeHtml(r.name)}</span>
      <span class="score">${formatScore(game, r.score)}</span>
    </li>`);
  for (let i = records.length; i < min; i++) {
    items.push(`
    <li class="empty">
      <span class="rank">${ordinal(i + 1)}</span>
      <span class="name">---</span>
      <span class="score">---</span>
    </li>`);
  }
  return items.join("");
}
