// オルックス Service Worker：ホーム画面に置いたアプリがオフラインでも開けるようにする。
// 更新が届かない「取り残され」を防ぐため、HTMLは network-first（つながっていれば必ず最新、
// 圏外のときだけキャッシュ）。ファイル名は固定なので古い資産を読んでも 404 にならない。
const CACHE = "oruduck-v1";
const CORE = ["./", "./index.html", "./assets/app.js", "./assets/index.css"];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE).catch(() => {})));
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 外部（Webフォント等）は素通し

  // ページ遷移は network-first：オンラインなら最新、オフラインならキャッシュへ退避
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); return r; })
        .catch(() => caches.match(req).then((m) => m || caches.match("./index.html")))
    );
    return;
  }

  // 同一オリジンの静的資産は stale-while-revalidate：即描画しつつ裏で更新
  e.respondWith(
    caches.match(req).then((cached) => {
      const net = fetch(req)
        .then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); return r; })
        .catch(() => cached);
      return cached || net;
    })
  );
});
