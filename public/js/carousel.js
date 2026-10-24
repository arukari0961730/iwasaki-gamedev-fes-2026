// 注目エリア：ランキングのあるゲームを「紹介＋TOP3」で順番に切り替えて見せる。
// トップページ（/）とモニター表示（/display）の両方で、この同じ部品を使う。
import { escapeHtml, rankingItems, imageUrl } from "./games.js";
import { watchRanking } from "./scores.js";

const INTERVAL = 10_000;      // 自動で次のゲームに切り替えるまでの時間
const PAUSE_AFTER_TOUCH = 20_000; // 触ったあと、自動切り替えを止めておく時間

export function mountCarousel(root, games, { linkToRanking = true } = {}) {
  root.innerHTML = `
    <div class="slides">
      ${games.map((g, i) => `
        <article class="slide" data-id="${g.id}">
          <img class="shot" src="${imageUrl(g)}" alt="${escapeHtml(g.name)} のゲーム画面" loading="${i === 0 ? "eager" : "lazy"}">
          <div>
            <h2 class="game-name">${escapeHtml(g.name)}</h2>
            <p class="desc">${escapeHtml(g.description)}</p>
            <p class="hs-title">HIGH SCORE</p>
            <ol class="ranking">${rankingItems(g, [], { min: 3 })}</ol>
            ${linkToRanking ? `
            <div class="actions">
              <a class="btn" href="/register?game=${g.id}">ENTRY ▶ スコア登録</a>
              <a class="btn sub" href="/ranking?game=${g.id}">ALL RANKING</a>
            </div>` : ""}
          </div>
        </article>`).join("")}
    </div>
    <div class="carousel-nav">
      <button class="arrow" data-step="-1" aria-label="前のゲーム">◀</button>
      <div class="dots">${games.map((g, i) => `<button data-index="${i}" aria-label="${escapeHtml(g.name)}"></button>`).join("")}</div>
      <button class="arrow" data-step="1" aria-label="次のゲーム">▶</button>
    </div>`;

  const slides = [...root.querySelectorAll(".slide")];
  const dots = [...root.querySelectorAll(".dots button")];
  let current = 0;
  let pausedUntil = 0;

  function show(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach((s, i) => s.classList.toggle("is-active", i === current));
    dots.forEach((d, i) => d.classList.toggle("is-active", i === current));
    // 画像は表示する直前まで読み込まない（転送量を抑えるため）。
    // ただし切り替えた瞬間に画像が空にならないよう、次のゲームの画像だけは先に読み込んでおく
    slides[(current + 1) % slides.length].querySelector("img").loading = "eager";
  }

  // 人が操作したら、しばらく自動切り替えを止める（読んでいる途中で変わらないように）
  function showByUser(index) {
    pausedUntil = Date.now() + PAUSE_AFTER_TOUCH;
    show(index);
  }

  root.querySelectorAll(".arrow").forEach((btn) =>
    btn.addEventListener("click", () => showByUser(current + Number(btn.dataset.step))));
  dots.forEach((dot) =>
    dot.addEventListener("click", () => showByUser(Number(dot.dataset.index))));

  // スワイプで切り替え
  let startX = null;
  root.addEventListener("pointerdown", (e) => { startX = e.clientX; });
  root.addEventListener("pointerup", (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 50) showByUser(current + (dx < 0 ? 1 : -1));
  });

  setInterval(() => {
    if (Date.now() >= pausedUntil) show(current + 1);
  }, INTERVAL);

  // 各ゲームの TOP3 をリアルタイムで反映する
  for (const game of games) {
    const list = root.querySelector(`.slide[data-id="${game.id}"] .ranking`);
    watchRanking(game.id, (records) => {
      list.innerHTML = rankingItems(game, records, { min: 3 });
    }, { max: 3 });
  }

  show(0);
}
