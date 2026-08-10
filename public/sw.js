// 온종일팜 서비스워커 — PWA 설치 + 업데이트 배너용
const VERSION = 'onjongil-20260810-4';

self.addEventListener('install', () => { /* 대기(waiting) 상태 유지 — 배너의 SKIP_WAITING 메시지로 활성화 */ });

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// 설치형 PWA 요건: fetch 핸들러. 네트워크 우선(항상 최신), 실패 시 캐시.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 외부(Supabase 등)는 건드리지 않음
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req))
  );
});
