const CACHE_NAME = 'insam-ia-v1';
const STATIC_CACHE = 'insam-ia-static-v1';
const API_CACHE = 'insam-ia-api-v1';

const STATIC_ASSETS = [
    '/',
    '/offline.html',
];

// Install: cache static shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== STATIC_CACHE && key !== API_CACHE)
                    .map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// Fetch: different strategies
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // API requests: network first, fallback to cache
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Only cache GET requests
                    if (event.request.method === 'GET' && response.status === 200) {
                        const clone = response.clone();
                        caches.open(API_CACHE).then((cache) => {
                            cache.put(event.request, clone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    return caches.match(event.request).then((cached) => {
                        return cached || new Response(
                            JSON.stringify({ error: 'Vous etes hors ligne', offline: true }),
                            { headers: { 'Content-Type': 'application/json' } }
                        );
                    });
                })
        );
        return;
    }

    // Static assets: cache first
    if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|ico|woff2?)$/)) {
        event.respondWith(
            caches.match(event.request).then((cached) => {
                return cached || fetch(event.request).then((response) => {
                    const clone = response.clone();
                    caches.open(STATIC_CACHE).then((cache) => {
                        cache.put(event.request, clone);
                    });
                    return response;
                });
            })
        );
        return;
    }

    // HTML pages: network first, fallback to cache, then offline page
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                const clone = response.clone();
                caches.open(STATIC_CACHE).then((cache) => {
                    cache.put(event.request, clone);
                });
                return response;
            })
            .catch(() => {
                return caches.match(event.request).then((cached) => {
                    return cached || caches.match('/offline.html');
                });
            })
    );
});
