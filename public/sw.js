/**
 * Service Worker cho DoanhNghiepVN.today PWA
 * Cung cấp khả năng tải nhanh và hoạt động offline cơ bản
 */

const CACHE_NAME = 'dnvn-cache-v1';
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.png',
  '/logo_icon.png',
  '/logo_doanhnghiepvn.png',
  '/logo_doanhnghiepvn_dark.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Lỗi precache PWA:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Bỏ qua các API request và socket để luôn lấy dữ liệu mới nhất
  if (url.pathname.startsWith('/api') || event.request.method !== 'GET') {
    return;
  }

  // Network-first với fallback sang Cache
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      })
  );
});
