// Firebase への接続をまとめるファイル。
// 各ページはここから db（データベース）と auth（ログイン）を読み込んで使う。
//
// firebaseConfig は「どのプロジェクトにつなぐか」を示す名札で、公開しても問題ない。
// データを守っているのは firestore.rules（セキュリティルール）。
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAQ5HIQaqTny7YqyrM2jlsG7kbM0c2Da9M",
  authDomain: "gamedev-fes-2026.firebaseapp.com",
  projectId: "gamedev-fes-2026",
  storageBucket: "gamedev-fes-2026.firebasestorage.app",
  messagingSenderId: "219954349864",
  appId: "1:219954349864:web:dbcee92d6b6a0311ce321d",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
