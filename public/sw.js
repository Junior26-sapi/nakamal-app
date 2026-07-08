// Service Worker for Nakamal Venue Management Offline Notification System

const CACHE_NAME = 'nakamal-v4';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/icon.png'
];

// Pre-cache core structural assets during installation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching core assets for offline usage...');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Purge obsolete caches on activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log(`[SW] Purging outdated cache: ${key}`);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Smart fetch interception with offline-first support for assets and bypass for APIs
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Bypass API requests and external telemetry to guarantee real-time data integrity
  if (url.pathname.startsWith('/api/') || url.pathname.includes('/socket.io') || event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh copy in the background to update cache for next load (Stale-While-Revalidate)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {/* Silent fail when completely offline */});
        
        return cachedResponse;
      }

      // Network fallback
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // Cache newly retrieved client assets or third parity assets like Fonts dynamically
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // If entirely offline and it's a page navigation request, return default index.html fallback
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// Listener for notifications triggered by client-side detection (especially useful when offline)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'MONITOR_OFFLINE_CHANGE') {
    const { title, body, icon, badge, url } = event.data;
    
    event.waitUntil(
      self.registration.showNotification(title, {
        body: body,
        icon: icon || '/icon.png',
        badge: badge || '/icon.png',
        silent: false,
        vibrate: [200, 100, 200],
        data: { url: url || '/' },
        tag: 'nakamal-status-offline'
      })
    );
  }
});

// Handle notification click to navigate the user back to their manager dashboard
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const targetUrl = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new tab/window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
