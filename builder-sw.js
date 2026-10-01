const CACHE = 'dualis-builder-shell-v1';
const SHELL = [
  '/builder/',
  '/builder.html',
  '/builder-manifest.webmanifest',
  '/builder-icon.svg',
  '/assets/builder-CsCqM4I9.js',
  '/assets/scene-manifest-BjFSetx2.js'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (response.ok && (url.pathname.startsWith('/builder') || url.pathname.startsWith('/assets/'))) {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, copy));
    }
    return response;
  })));
});
