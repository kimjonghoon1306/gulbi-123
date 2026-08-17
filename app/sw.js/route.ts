const deploymentVersion =
  process.env.VERCEL_DEPLOYMENT_ID ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  'local-development'

export const dynamic = 'force-dynamic'

export function GET() {
  const script = `
// 온종일팜 서비스워커 — 배포 버전 ${deploymentVersion}
const VERSION = ${JSON.stringify(`onjongil-${deploymentVersion}`)};

self.addEventListener('install', () => {
  // iOS PWA에서 waiting 감지가 누락될 수 있으므로 새 배포는 즉시 활성화한다.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // 페이지(HTML) 네비게이션과 Next 데이터/청크는 절대 오래된 캐시를 쓰지 않는다.
  // → 새 배포가 나오면 iOS PWA에서도 즉시 최신 화면이 뜬다. (네트워크 실패 시에만 캐시 폴백)
  const isNavigation = request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html');
  const isFresh = isNavigation || url.pathname.startsWith('/_next/');
  if (isFresh) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then((response) => {
          const copy = response.clone();
          caches.open(VERSION).then((cache) => cache.put(request, copy)).catch(() => {});
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(VERSION).then((cache) => cache.put(request, copy)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(request))
  );
});
`

  return new Response(script, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Service-Worker-Allowed': '/',
    },
  })
}
