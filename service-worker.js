const CACHE_NAME = "my-cache-v1";
const urlsToCache = [
    "/",
    "/index.html",
    "/about.html",
    "/contact.html",
    "/menu.html",
    "/news-detail.html",
    "/news.html",
    "/css/tooplate-crspy-kitchen.css",
    "/css/bootstrap-icon.css",
    "/css/bootstrap.mini", // Check typo! Should be bootstrap.min.css
    "/app.js",
    "/js/bootstrap.bundle.min.js",
    "/js/custom.js",
    "/js/query.min.js",
    "/video/production_ID_3769033.mp4",
    "/fonts/bootstrap-icons.woff",
    "/fonts/bootstrap-icons.woff2", // typo corrected: "woof2" -> "woff2"
    // Images should be listed individually (wildcard '*' doesn't work)
    "/images/author/author1.jpg",
    "/images/author/author2.jpg",
    "/images/breakfast/breakfast1.jpg",
    "/images/lunch/lunch1.jpg",
    "/images/dinner/dinner1.jpg",
    "/images/header/header1.jpg",
    "/images/news/news1.jpg",
    "/images/slide/slide1.jpg",
    "/images/team/team1.jpg"
];

// Install event: Cache assets
self.addEventListener("install", (event) => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching assets');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('Service Worker: All assets cached');
                return self.skipWaiting(); // Force activation
            })
            .catch((error) => {
                console.error('Service Worker: Caching failed', error);
            })
    );
});

// Fetch event: Serve cached or fetch from network
self.addEventListener("fetch", (event) => {
    if (event.request.method !== 'GET') return;

    const requestURL = new URL(event.request.url);

    // Ignore non-HTTP(s) requests like chrome-extension://
    if (!requestURL.protocol.startsWith('http')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    console.log('Service Worker: Serving from cache', event.request.url);
                    return response;
                }

                console.log('Service Worker: Fetching from network', event.request.url);
                return fetch(event.request)
                    .then((networkResponse) => {
                        if (
                            !networkResponse ||
                            networkResponse.status !== 200 ||
                            networkResponse.type !== 'basic'
                        ) {
                            return networkResponse;
                        }

                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                // Only cache HTTP(S) requests from your domain
                                if (event.request.url.startsWith(self.location.origin)) {
                                    cache.put(event.request, responseToCache);
                                }
                            });

                        return networkResponse;
                    })
                    .catch((error) => {
                        console.error('Service Worker: Fetch failed', error);
                    });
            })
    );
});

// Activate event: Clean up old caches
self.addEventListener("activate", (event) => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activated');
                return self.clients.claim(); // Take control immediately
            })
    );
});
