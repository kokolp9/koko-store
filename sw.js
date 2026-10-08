// Koko Store Service Worker
const CACHE_NAME = 'koko-store-v1';

const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json'
];

self.addEventListener('install', event => {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(ASSETS_TO_CACHE).catch(err => {
                console.log('[SW] Cache add failed:', err);
            });
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;
    
    const url = new URL(event.request.url);
    
    if (url.origin !== location.origin && !url.hostname.includes('supabase')) return;

    event.respondWith(
        caches.match(event.request).then(cached => {
            const fetchPromise = fetch(event.request).then(response => {
                if (response && response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            }).catch(() => cached);
            
            return cached || fetchPromise;
        })
    );
});