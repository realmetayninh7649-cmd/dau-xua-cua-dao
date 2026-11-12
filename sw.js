/* Chỉ lưu màn hình báo ngoại tuyến. Không lưu dữ liệu quản trị hoặc tư liệu Supabase. */
'use strict';
const CACHE_NAME = 'gdd-offline-shell-v1';
const OFFLINE_URL = new URL('./offline.html', self.registration.scope).href;
const LOGO_URL = new URL('./logo.png', self.registration.scope).href;
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.add(OFFLINE_URL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(names => Promise.all(
      names.filter(name => name.startsWith('gdd-offline-shell-') && name !== CACHE_NAME)
        .map(name => caches.delete(name))
    )).then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.mode !== 'navigate' || request.method !== 'GET') return;
  const url = new URL(request.url);
  const scope = new URL(self.registration.scope);
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  event.respondWith(fetch(request).catch(async () => {
    const offline = await caches.match(OFFLINE_URL);
    return offline || Response.error();
  }));
});
