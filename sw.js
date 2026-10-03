/* 监理工程师刷题 PWA · Service Worker
   作用：首次访问后缓存页面，之后离线也能打开（地铁、无网环境）
   策略：网络优先、失败回落缓存（保证内容总是最新的） */

const CACHE = "jl-exam-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./week1.html",
  "./manifest.json",
  "./icons/icon-96.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png"
];

/* 安装：预缓存核心资源 */
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => {
      // 单个文件失败不影响整体安装
      return Promise.allSettled(ASSETS.map(url => cache.add(url)));
    }).then(() => self.skipWaiting())
  );
});

/* 激活：清理旧版本缓存 */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* 请求拦截：网络优先，失败回落缓存 */
self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  // 不缓存 GitHub API 请求（错题云同步必须实时）
  if (req.url.includes("api.github.com")) return;

  event.respondWith(
    fetch(req)
      .then(res => {
        // 成功则更新缓存
        if (res && res.status === 200 && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match("./index.html")))
  );
});
