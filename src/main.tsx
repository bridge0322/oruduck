import { createRoot } from "react-dom/client";
import "@phosphor-icons/web/regular";
import "@phosphor-icons/web/bold";
import "@phosphor-icons/web/fill";
import "./tokens.css";
import { App } from "./features/tracker/App";

// データ（localStorage）をできるだけ消されにくくする。ブラウザに「永続ストレージ」を要求。
// ホーム画面に追加して使うと、より確実に保持されます。
if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().catch(() => {});
}

// Service Worker を登録：ホーム画面アプリがオフラインでも開けるようにする。
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(import.meta.env.BASE_URL + "sw.js", { scope: import.meta.env.BASE_URL })
      .catch(() => {});
  });
}

createRoot(document.getElementById("root")!).render(<App />);
