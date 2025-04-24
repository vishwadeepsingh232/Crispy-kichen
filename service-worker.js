const CACHE_NAME = "my-cache-v1";
const urlsToCache = [
    "/",
    //html
    "/index.html",
    "/about.html",
    "/contact.html",
    "/menu.html",
    "/news-detail.html",
    "/news.html",

    //css
    "/css/tooplate-crspy-kitchen.css",
    "/css/bootstrap-icon.css",
    "/css/bootstrap.mini",

    //js
    "/app.js",
    "/js/bootstrap.bundle.min.js",
    "/js/custom.js",
    "/js/query.min.js",

    //video
    "/video/production_ID_3769033.mp4",
    //font
    "/fonts/bootstrap-icons.woff",
    "/fonts/bootstrap-icons.woof2",

    //image
    "/images/author/*",
    "/images/breakfast/*",
    "/images/dinner/*",
    "/images/header/*",
    "/images/lunch/*",
    "/images/news/*",
    "/images/slide/*",
    "/images/team/*"
    
];

// Install event: Caches the assets
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
                        // Optional: return custom offline response
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
