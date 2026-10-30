const CACHE_NAME = "tripmate-shell-v4";
const APP_SHELL = [
    "/homepage.html",
    "/offline.html",
    "/css/design-system.css",
    "/css/homepage.css",
    "/js/homepage.js",
    "/images/tripmate.svg",
    "/images/app-icon.png"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys
                .filter(key => key.startsWith("tripmate-shell-") && key !== CACHE_NAME)
                .map(key => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", event => {
    const request = event.request;
    const url = new URL(request.url);
    if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

    if (request.mode === "navigate") {
        event.respondWith(fetch(request).catch(async () => {
            const cachedPage = await caches.match(request);
            return cachedPage || caches.match("/offline.html");
        }));
        return;
    }

    if (!/\.(?:css|js|svg|png|jpe?g|webp|woff2?)$/i.test(url.pathname)) return;
    event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
        if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
    })));
});
