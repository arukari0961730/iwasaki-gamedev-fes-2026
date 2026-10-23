// プレイヤー名のチェック（文化祭版は画面側で行う）。
//
// NGワードは、そのまま照合するとすり抜けやすい（「バカ」「ば か」「ﾊﾞｶ」など）。
// そこで照合の前に表記をそろえる（正規化する）。
//   1. 全角英数・半角カナをそろえる（NFKC）
//   2. 大文字 → 小文字
//   3. カタカナ → ひらがな
//   4. スペース・記号を取り除く
//
// 注意: 画面側のチェックは、その気になれば回避できる。
// 漏れたものは管理画面で非表示にする運用で補い、面接版でサーバー側のチェックに移す。

export const NAME_MAX = 12;

// 必要に応じて追加する（正規化したあとの形＝ひらがな・小文字で書く）
const NG_WORDS = [
  "しね", "ころす", "ころしてやる", "きもい", "うざい", "ばか", "あほ", "かす", "くず", "ごみ",
  "ちんこ", "ちんぽ", "まんこ", "おっぱい", "せっくす", "えっち", "うんこ", "うんち",
  "fuck", "shit", "bitch", "sex", "dick", "pussy", "kill",
];

export function normalize(text) {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .replace(/[\s\p{P}\p{S}ー]/gu, "");
}

// 問題があればエラーメッセージを、なければ null を返す
export function checkName(rawName) {
  const name = rawName.trim();
  if (!name) return "名前を入力してください";
  if ([...name].length > NAME_MAX) return `名前は${NAME_MAX}文字以内にしてください`;
  // 「/」は Firestore の保存場所の区切りに使われるため使えない
  if (name.includes("/") || /^\.\.?$/.test(name) || /^__.*__$/.test(name)) {
    return "この名前は使えません";
  }
  const normalized = normalize(name);
  if (NG_WORDS.some((w) => normalized.includes(w))) {
    return "この名前は使えません。別の名前にしてください";
  }
  return null;
}
