'use strict';

const CACHE_NAME    = 'sentinel-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;600;700&display=swap',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET') return;

  if (url.hostname === 'dns.google' ||
      url.hostname === 'services.nvd.nist.gov' ||
      url.hostname === 'api.securityheaders.com') {
    event.respondWith(fetch(event.request).catch(() => new Response(
      JSON.stringify({ error: '離線模式：無法存取外部 API' }),
      { headers: { 'Content-Type': 'application/json' } }
    )));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
