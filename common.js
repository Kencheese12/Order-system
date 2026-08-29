// ==========================================================
// 英語部注文システム 共通処理
// ==========================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  set,
  remove,
  onValue,
  query,
  orderByChild
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-database.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 商品一覧
export const PRODUCTS = [
  "しお",
  "カレー",
  "コンポタ",
  "ハニバタ",
  "コンソメ",
  "醤油バター"
];

/**
 * 注文を1件追加する
 * @param {string} name 商品名
 */
export function addOrder(name) {
  const newOrderRef = push(ref(db, "orders"));
  set(newOrderRef, {
    name: name,
    time: Date.now()
  }).catch((error) => {
    console.error("注文の追加に失敗しました:", error);
    alert("注文の追加に失敗しました。通信状況を確認してください。");
  });
}

/**
 * 注文を1件削除する(注文側の取り消し・厨房側の完成、どちらもこれを使う)
 * @param {string} id 削除する注文のid
 */
export function removeOrder(id) {
  remove(ref(db, "orders/" + id)).catch((error) => {
    console.error("注文の削除に失敗しました:", error);
    alert("削除に失敗しました。通信状況を確認してください。");
  });
}

/**
 * 注文一覧の変化を監視する。データが変わるたびに、
 * 古い順に並んだ配列でcallbackが呼ばれる。
 * @param {(orders: {id: string, name: string, time: number}[]) => void} callback
 */
export function watchOrders(callback) {
  const ordersQuery = query(ref(db, "orders"), orderByChild("time"));
  onValue(
    ordersQuery,
    (snapshot) => {
      const orders = [];
      snapshot.forEach((child) => {
        const val = child.val();
        orders.push({
          id: child.key,
          name: val.name,
          time: val.time
        });
      });
      callback(orders);
    },
    (error) => {
      console.error("Firebaseからの読み込みに失敗しました:", error);
    }
  );
}

/**
 * 注文カードの一覧をHTMLに描画する共通関数。
 * 注文画面・厨房画面のどちらもこの関数を使うため、同じ見た目のカードが並ぶ。
 * カード自体をタップすると onButtonClick が呼ばれる。
 * @param {HTMLElement} container カードを入れる要素
 * @param {{id: string, name: string, time: number}[]} orders 注文一覧(古い順)
 * @param {string} buttonLabel カードに表示するボタン文字("取り消し" / "完成" など)
 * @param {(id: string) => void} onButtonClick カードをタップしたときの処理
 */
export function renderOrders(container, orders, buttonLabel, onButtonClick) {
  container.innerHTML = "";

  if (orders.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-message";
    empty.textContent = "現在、注文はありません";
    container.appendChild(empty);
    return;
  }

  orders.forEach((order, index) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "order-card";
    if (index === 0) {
      card.classList.add("order-card-oldest");
    }
    card.addEventListener("click", () => onButtonClick(order.id));

    const numberEl = document.createElement("div");
    numberEl.className = "order-card-number";
    numberEl.textContent = "#" + (index + 1);
    card.appendChild(numberEl);

    const nameEl = document.createElement("div");
    nameEl.className = "order-card-name";
    nameEl.textContent = order.name;
    card.appendChild(nameEl);

    const timeEl = document.createElement("div");
    timeEl.className = "order-card-time";
    const d = new Date(order.time);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    timeEl.textContent = hh + ":" + mm;
    card.appendChild(timeEl);

    const labelEl = document.createElement("div");
    labelEl.className = "order-card-button-label";
    labelEl.textContent = buttonLabel;
    card.appendChild(labelEl);

    container.appendChild(card);
  });
}
