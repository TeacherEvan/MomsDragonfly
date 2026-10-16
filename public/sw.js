// Service worker for Mom's Dragonfly PWA
const CACHE_NAME = 'moms-dragonfly-v7';
const MEDIA_CACHE = 'moms-dragonfly-media-v1';
const OFFLINE_URL = '/offline.html';

// Files to cache on install
const PRECACHE_URLS = [
  '/explore',
  '/local',
  '/journal',
  '/budget',
  '/reminders',
  '/tickets',
  '/settings',
  OFFLINE_URL,
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/intro.jpg',
  '/dragonfly-backdrop.jpg',
];

// Install event - precache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== MEDIA_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // Never intercept cross-origin requests (map tiles, external images):
  // let the network handle them directly — the SW adds failure modes
  // (lifecycle races, respondWith errors) but no caching value here.
  if (url.origin !== self.location.origin) return;

  // Intro media (splash video): cache-first so it plays instantly and
  // reliably — even on flaky connections or offline after first view.
  if (request.destination === 'video' || url.pathname === '/Intro.mp4') {
    event.respondWith(
      caches.open(MEDIA_CACHE).then(async (cache) => {
        const cached = await cache.match(request, { ignoreSearch: true });
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (
            response &&
            response.status === 200 &&
            (response.type === 'basic' || response.type === 'cors')
          ) {
            cache.put(request, response.clone());
          }
          return response;
        } catch (err) {
          const fallback = await cache.match(request, { ignoreSearch: true });
          return fallback || Response.error();
        }
      })
    );
    return;
  }

  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (
            response &&
            response.status === 200 &&
            response.type === 'basic' &&
            !response.redirected
          ) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request, { ignoreSearch: true });
          if (cached) return cached;
          const appShell = await caches.match('/explore');
          if (appShell) return appShell;
          const fallback = await caches.match(OFFLINE_URL);
          return fallback || Response.error();
        })
    );
    return;
  }

  // Handle static assets - cache first
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font' ||
    request.destination === 'manifest'
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((response) => {
            // Don't cache opaque responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
            return response;
          })
          .catch(async (err) => {
            console.warn('SW asset fetch failed:', request.url, err);
            const fallback = await caches.match(request);
            return fallback || Response.error();
          });
      })
    );
    return;
  }

  // Default: network first, fall back to cache — never resolve to undefined
  event.respondWith(
    fetch(request).catch(async () => {
      const cached = await caches.match(request);
      return cached || Response.error();
    })
  );
});

// Push notifications - handle incoming push payload and display notification
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: event.data.text() };
    }
  }

  const title = data.title || "Mom's Dragonfly Reminder";
  const options = {
    body: data.body || 'You have an upcoming travel reminder.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/reminders',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click - focus existing tab or navigate to destination
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const rawUrl = (event.notification.data && event.notification.data.url) || '/reminders';
  const targetUrl =
    typeof rawUrl === 'string' && rawUrl.startsWith('/') && !rawUrl.startsWith('//')
      ? rawUrl
      : '/reminders';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            const clientUrl = new URL(client.url);
            if (clientUrl.origin === self.location.origin) {
              if (
                clientUrl.pathname === targetUrl ||
                clientUrl.pathname.startsWith(targetUrl + '/')
              ) {
                return client.focus();
              }
              if ('navigate' in client) {
                return client.navigate(targetUrl).then((navigatedClient) => {
                  return navigatedClient ? navigatedClient.focus() : client.focus();
                });
              }
              return client.focus();
            }
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
