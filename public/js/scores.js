// スコアの読み書き（Firestore）をまとめたファイル。
//
// データの置き場所: games/{ゲームID}/scores/{プレイヤー名}
//   - プレイヤー名をそのまま文書のIDにしているので、同じ名前の記録は1つにまとまる
//     （＝「同じ人は名前だけで判定し、最高スコアだけを表示する」を、データの形で実現している）
//   - achievedAt は「その最高スコアを出した日時」。同点のときは先に出した人を上位にする
import {
  collection, doc, query, where, orderBy, limit, onSnapshot,
  runTransaction, serverTimestamp, updateDoc, writeBatch, getDoc,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { db } from "./firebase.js";

function scoresOf(gameId) {
  return collection(db, "games", gameId, "scores");
}

// ランキングを購読する。データが変わるたびに callback が呼ばれる（リアルタイム更新）
export function watchRanking(gameId, callback, { max, includeHidden = false } = {}) {
  const conditions = [];
  if (!includeHidden) conditions.push(where("hidden", "==", false));
  conditions.push(orderBy("score", "desc"), orderBy("achievedAt", "asc"));
  if (max) conditions.push(limit(max));

  return onSnapshot(
    query(scoresOf(gameId), ...conditions),
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => console.error(`ランキングの読み込みに失敗しました (${gameId})`, err),
  );
}

// スコアを登録する。同じ名前の記録があれば、前より良いときだけ上書きする
// 戻り値: { status: "created" | "updated" | "not-best", best: 現在の最高スコア }
export async function submitScore(gameId, name, score) {
  const ref = doc(scoresOf(gameId), name);
  return runTransaction(db, async (tx) => {
    const current = await tx.get(ref);
    if (!current.exists()) {
      tx.set(ref, { gameId, name, score, achievedAt: serverTimestamp(), hidden: false });
      return { status: "created", best: score };
    }
    const best = current.data().score;
    if (score <= best) return { status: "not-best", best };
    tx.update(ref, { score, achievedAt: serverTimestamp() });
    return { status: "updated", best: score };
  });
}

// ---------- ここから下は管理画面用（管理者だけがルールで許可されている） ----------

export function updateRecord(gameId, name, fields) {
  return updateDoc(doc(scoresOf(gameId), name), fields);
}

// 名前は文書のIDなので、変更するときは「新しい名前で作り直して、古いものを消す」
export async function renameRecord(gameId, oldName, newName) {
  const oldRef = doc(scoresOf(gameId), oldName);
  const newRef = doc(scoresOf(gameId), newName);
  const [oldSnap, newSnap] = await Promise.all([getDoc(oldRef), getDoc(newRef)]);
  if (newSnap.exists()) throw new Error(`「${newName}」の記録はすでにあります`);
  const batch = writeBatch(db);
  batch.set(newRef, { ...oldSnap.data(), name: newName });
  batch.delete(oldRef);
  await batch.commit();
}
